/**
 * Hook to connect Lovable frontends to Cursor AI agent system
 * Bridges Lovable UI → Cursor PolicyOrchestrator → Supabase data
 */
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';

export interface PolicySubmission {
  document: {
    title: string;
    content: string;
    enterpriseId: string;
    mimeType?: string;
    metadata?: Record<string, any>;
  };
  options?: {
    timeoutMs?: number;
    forceReprocess?: boolean;
    bypassValidation?: boolean;
  };
}

export interface CursorProcessingResult {
  success: boolean;
  data?: {
    finalOutcome: 'approved' | 'rejected' | 'needs_review';
    confidence: number;
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    parsedDocument: {
      content?: string;
      type?: string;
      extractedFields?: {
        toolName: string;
        vendor: string;
        status: string;
        risk: string;
        useCases: string[];
        restrictions: string[];
        confidence: {
          toolName: number;
          vendor: number;
          status: number;
          useCases: number;
          restrictions: number;
          overall: number;
        };
      };
    };
    validationResults: any;
    processingStats: {
      processingTime: number;
      traceId: string;
      extractionMethod?: string;
      overallConfidence?: number;
    };
  };
  error?: string;
  message?: string;
}

export const useCursorAIIntegration = () => {
  const [processing, setProcessing] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<CursorProcessingResult | null>(null);
  const [agencyContext, setAgencyContext] = useState<{
    agencyId: string;
    agencyName: string;
    clientIds: string[];
  } | null>(null);
  const { toast } = useToast();

  /**
   * Set agency context for batch processing operations
   */
  const setAgencyContextData = (context: { agencyId: string; agencyName: string; clientIds: string[] }) => {
    setAgencyContext(context);
  };

  /**
   * Submit batch of documents to Cursor AI for agency processing
   */
  const submitBatchToCursor = async (documents: Array<{
    id: string;
    title: string;
    content: string;
    clientId: string;
    clientName: string;
    metadata?: Record<string, any>;
  }>): Promise<CursorProcessingResult> => {
    if (!agencyContext) {
      throw new Error('Agency context must be set before batch processing');
    }

    setBatchProcessing(true);
    
    try {
      monitoring.info('Submitting batch to Cursor AI', {
        batchSize: documents.length,
        agencyId: agencyContext.agencyId
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke('policy-process', {
        body: {
          batchMode: true,
          documents: documents.map(doc => ({
            document: {
              title: doc.title,
              content: doc.content,
              enterpriseId: agencyContext.agencyId,
              metadata: {
                ...doc.metadata,
                clientId: doc.clientId,
                clientName: doc.clientName,
                isAgencyBatch: true,
                agencyContext
              }
            },
            enterpriseId: agencyContext.agencyId,
            options: { bypassValidation: false }
          })),
          agencyContext
        }
      });

      if (functionError) {
        throw new Error(`Batch processing failed: ${functionError.message || 'Unknown error'}`);
      }

      const result: CursorProcessingResult = functionData;
      
      if (result.success && result.data) {
        await storeAIDecisionInSupabase({
          agent: 'Agency Batch Processor',
          action: `Processed ${documents.length} documents`,
          outcome: result.data.finalOutcome,
          risk: result.data.riskLevel,
          details: {
            batchSize: documents.length,
            agencyId: agencyContext.agencyId,
            agencyName: agencyContext.agencyName,
            clientIds: documents.map(d => d.clientId),
            processingStats: result.data.processingStats
          },
          enterprise_id: agencyContext.agencyId
        });
      }

      setLastResult(result);
      
      if (result.success) {
        toast({
          title: "Batch Processing Complete",
          description: `Successfully processed ${documents.length} documents`,
        });
      } else {
        toast({
          title: "Batch Processing Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      monitoring.error('Batch processing failed', error, 'useCursorAIIntegration');
      
      const failureResult: CursorProcessingResult = {
        success: false,
        error: errorMessage
      };
      
      setLastResult(failureResult);
      
      toast({
        title: "Batch Processing Error",
        description: errorMessage,
        variant: "destructive"
      });

      return failureResult;
    } finally {
      setBatchProcessing(false);
    }
  };

  /**
   * Analyze client portfolio using real Cursor AI
   */
  const analyzeClientPortfolio = async (clientIds: string[], analysisType: 'risk' | 'compliance' | 'sla'): Promise<any> => {
    if (!agencyContext) {
      throw new Error('Agency context required for portfolio analysis');
    }

    setProcessing(true);
    
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('policy-process', {
        body: {
          portfolioMode: true,
          analysisType,
          clientIds,
          agencyContext,
          enterpriseId: agencyContext.agencyId
        }
      });

      if (functionError) {
        throw new Error(`Portfolio analysis failed: ${functionError.message}`);
      }

      await storeAIDecisionInSupabase({
        agent: 'Client Portfolio Analyzer',
        action: `${analysisType} analysis for ${clientIds.length} clients`,
        outcome: 'completed',
        risk: 'medium',
        details: {
          analysisType,
          clientIds,
          agencyId: agencyContext.agencyId,
          results: functionData
        },
        enterprise_id: agencyContext.agencyId
      });

      return functionData;

    } catch (error) {
      monitoring.error('Portfolio analysis failed', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Submit policy document to Cursor AI agent system
   */
  const submitPolicyToCursor = async (submission: PolicySubmission): Promise<CursorProcessingResult> => {
    setProcessing(true);
    
    try {
      monitoring.info('Submitting policy to Cursor AI agents', {
        title: submission.document.title,
        enterpriseId: submission.document.enterpriseId
      });

      // Call the Supabase Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('policy-process', {
        body: {
          document: submission.document,
          enterpriseId: submission.document.enterpriseId,
          options: submission.options || {}
        }
      });

      if (functionError) {
        throw new Error(`API call failed: ${functionError.message || 'Unknown error'}`);
      }

      const result: CursorProcessingResult = functionData;
      
      // Store result in Supabase for dashboard display
      if (result.success && result.data) {
        await storeAIDecisionInSupabase({
          agent: 'PolicyOrchestrator',
          action: `Processed policy: ${submission.document.title}`,
          outcome: result.data.finalOutcome,
          risk: result.data.riskLevel,
          details: {
            confidence: result.data.confidence,
            reasoning: result.data.reasoning,
            recommendations: result.data.recommendations,
            documentTitle: submission.document.title
          },
          enterprise_id: submission.document.enterpriseId
        });
      }

      setLastResult(result);
      
      if (result.success) {
        toast({
          title: "Policy Processed Successfully",
          description: result.message || `Processing completed with ${result.data?.finalOutcome}`,
        });
      } else {
        toast({
          title: "Processing Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      monitoring.error('Policy submission to Cursor failed', error, 'useCursorAIIntegration');
      
      const failureResult: CursorProcessingResult = {
        success: false,
        error: errorMessage
      };
      
      setLastResult(failureResult);
      
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive"
      });

      return failureResult;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Get processing statistics from Cursor system
   */
  const getCursorProcessingStats = async () => {
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('policy-process');

      if (functionError) {
        throw new Error(`Failed to get stats: ${functionError.message}`);
      }

      return functionData.data;
    } catch (error) {
      monitoring.error('Failed to get Cursor processing stats', error);
      return null;
    }
  };

  /**
   * Store AI decision in Supabase for real-time dashboard updates
   */
  const storeAIDecisionInSupabase = async (decision: {
    agent: string;
    action: string;
    outcome: string;
    risk: string;
    details: Record<string, any>;
    enterprise_id: string;
  }) => {
    try {
      // Set enterprise_id to null to avoid RLS permission issues on client-side
      // The edge function handles proper storage with enterprise context
      const { error } = await supabase
        .from('ai_agent_decisions')
        .insert({
          ...decision,
          enterprise_id: null
        });

      if (error) {
        console.error('Failed to store AI decision in Supabase:', error);
      } else {
        monitoring.info('Stored AI decision in Supabase', { agent: decision.agent });
      }
    } catch (error) {
      console.error('Error storing AI decision:', error);
    }
  };

  return {
    // Core functionality
    submitPolicyToCursor,
    getCursorProcessingStats,
    
    // Agency-specific functionality
    submitBatchToCursor,
    analyzeClientPortfolio,
    setAgencyContextData,
    
    // State
    processing,
    batchProcessing,
    lastResult,
    agencyContext,
    
    // Utilities
    storeAIDecisionInSupabase
  };
};