import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CursorAIAgent } from '@/services/CursorAIAgent';

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: 'running' | 'complete' | 'error';
  confidence?: number;
  reasoning?: string;
  metadata?: any;
  timestamp: Date;
}

interface Evidence {
  type: string;
  description: string;
  file_url?: string;
  relevance_score?: number;
}

interface ComplianceGap {
  category: string;
  missing_element: string;
  impact: string;
  suggestion: string;
}

interface GenerateAnswerParams {
  question: any;
  partnerProfile: any;
  knowledgeBaseIds: string[];
  workspaceId: string;
  enterpriseId: string;
}

export const useRFPAgentOrchestration = () => {
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [complianceBreakdown, setComplianceBreakdown] = useState<any>({});
  const [evidenceSuggestions, setEvidenceSuggestions] = useState<Evidence[]>([]);
  const [complianceGaps, setComplianceGaps] = useState<ComplianceGap[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const addActivity = useCallback((activity: Omit<AgentActivity, 'id' | 'timestamp'>) => {
    const newActivity: AgentActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setAgentActivities(prev => [...prev, newActivity]);
    return newActivity.id;
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<AgentActivity>) => {
    setAgentActivities(prev =>
      prev.map(activity =>
        activity.id === id ? { ...activity, ...updates } : activity
      )
    );
  }, []);

  const generateAnswer = useCallback(async ({
    question,
    partnerProfile,
    knowledgeBaseIds,
    workspaceId,
    enterpriseId,
  }: GenerateAnswerParams) => {
    setIsGenerating(true);
    setAgentActivities([]);
    
    try {
      // Step 1: PartnerAgent - Assess RFP fit
      const partnerActivityId = addActivity({
        agent: 'PartnerAgent',
        action: 'assess_rfp_fit',
        status: 'running',
      });

      const partnerResult = await CursorAIAgent.executeAgentAction({
        agentName: 'PartnerAgent',
        action: 'assess_rfp_fit',
        context: {
          question,
          partner_profile: partnerProfile,
        },
        workspaceId,
        enterpriseId,
      });

      updateActivity(partnerActivityId, {
        status: 'complete',
        confidence: partnerResult.confidence,
        reasoning: partnerResult.reasoning,
        metadata: partnerResult.result,
      });

      if (partnerResult.result?.decision === 'skip') {
        throw new Error('RFP not suitable for this partner profile');
      }

      // Step 2: KnowledgeAgent - Retrieve context
      const knowledgeActivityId = addActivity({
        agent: 'KnowledgeAgent',
        action: 'retrieve_context',
        status: 'running',
      });

      const knowledgeResult = await CursorAIAgent.executeAgentAction({
        agentName: 'KnowledgeAgent',
        action: 'retrieve_context',
        context: {
          question,
          knowledge_base_ids: knowledgeBaseIds,
          top_k: 5,
        },
        workspaceId,
        enterpriseId,
      });

      updateActivity(knowledgeActivityId, {
        status: 'complete',
        confidence: knowledgeResult.confidence,
        reasoning: knowledgeResult.reasoning,
        metadata: { documents_found: knowledgeResult.result?.documents?.length || 0 },
      });

      const contextDocs = knowledgeResult.result?.documents || [];

      // Step 3: DocumentAgent - Generate answer
      const documentActivityId = addActivity({
        agent: 'DocumentAgent',
        action: 'generate_rfp_answer',
        status: 'running',
      });

      const documentResult = await CursorAIAgent.executeAgentAction({
        agentName: 'DocumentAgent',
        action: 'generate_rfp_answer',
        context: {
          question,
          context_documents: contextDocs,
          partner_profile: partnerProfile,
        },
        workspaceId,
        enterpriseId,
      });

      updateActivity(documentActivityId, {
        status: 'complete',
        confidence: documentResult.confidence,
        reasoning: documentResult.reasoning,
        metadata: { answer_length: documentResult.result?.answer?.length || 0 },
      });

      setCurrentAnswer(documentResult.result?.answer || '');
      setEvidenceSuggestions(documentResult.result?.evidence || []);

      // Step 4: ComplianceAgent - Score answer
      const complianceActivityId = addActivity({
        agent: 'ComplianceAgent',
        action: 'score_rfp_response',
        status: 'running',
      });

      const complianceResult = await CursorAIAgent.executeAgentAction({
        agentName: 'ComplianceAgent',
        action: 'score_rfp_response',
        context: {
          question,
          answer: documentResult.result?.answer,
          evidence: documentResult.result?.evidence,
        },
        workspaceId,
        enterpriseId,
      });

      updateActivity(complianceActivityId, {
        status: 'complete',
        confidence: complianceResult.confidence,
        reasoning: complianceResult.reasoning,
        metadata: { score: complianceResult.result?.composite_score },
      });

      setComplianceScore(complianceResult.result?.composite_score || 0);
      setComplianceBreakdown(complianceResult.result?.category_scores || {});
      setComplianceGaps(complianceResult.result?.gaps || []);

      // Step 5: DocumentAgent - Suggest improvements
      if (complianceResult.result?.composite_score < 80) {
        const improvementActivityId = addActivity({
          agent: 'DocumentAgent',
          action: 'suggest_improvements',
          status: 'running',
        });

        const improvementResult = await CursorAIAgent.executeAgentAction({
          agentName: 'DocumentAgent',
          action: 'suggest_improvements',
          context: {
            question,
            answer: documentResult.result?.answer,
            gaps: complianceResult.result?.gaps,
            target_score: 85,
          },
          workspaceId,
          enterpriseId,
        });

        updateActivity(improvementActivityId, {
          status: 'complete',
          confidence: improvementResult.confidence,
          reasoning: improvementResult.reasoning,
        });

        setImprovements(improvementResult.result?.suggestions || []);
      }

      toast({
        title: 'Answer Generated',
        description: `Compliance score: ${complianceResult.result?.composite_score}%`,
      });

    } catch (error) {
      console.error('Error generating answer:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate answer',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [addActivity, updateActivity, toast]);

  const clearState = useCallback(() => {
    setAgentActivities([]);
    setCurrentAnswer('');
    setComplianceScore(0);
    setComplianceBreakdown({});
    setEvidenceSuggestions([]);
    setComplianceGaps([]);
    setImprovements([]);
  }, []);

  return {
    agentActivities,
    currentAnswer,
    complianceScore,
    complianceBreakdown,
    evidenceSuggestions,
    complianceGaps,
    improvements,
    isGenerating,
    generateAnswer,
    clearState,
    setCurrentAnswer,
  };
};
