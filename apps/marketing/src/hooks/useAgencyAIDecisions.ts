import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import webSocketService from '@/services/webSocketService';
import { useAuth } from '@/contexts/AuthContext';

export interface AgencyAIDecision {
  id: string;
  agent: string;
  action: string;
  clientId?: string;
  clientName?: string;
  outcome: 'approved' | 'rejected' | 'flagged' | 'escalated';
  risk?: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  created_at: string;
  crossClientPattern?: boolean;
  slaImpact?: 'none' | 'minor' | 'major' | 'critical';
  agencyAction?: 'none' | 'escalate' | 'generate_report' | 'notify_client';
}

export interface AgencyAIAnalytics {
  totalDecisions: number;
  crossClientRisks: number;
  slaBreaches: number;
  autoResolved: number;
  clientRiskDistribution: Record<string, number>;
  topRiskPatterns: string[];
}

interface UseAgencyAIDecisionsOptions {
  clientId?: string;
  agencyId?: string;
  includeAllClients?: boolean;
}

export const useAgencyAIDecisions = (options: UseAgencyAIDecisionsOptions = {}) => {
  const [decisions, setDecisions] = useState<AgencyAIDecision[]>([]);
  const [analytics, setAnalytics] = useState<AgencyAIAnalytics>({
    totalDecisions: 0,
    crossClientRisks: 0,
    slaBreaches: 0,
    autoResolved: 0,
    clientRiskDistribution: {},
    topRiskPatterns: []
  });
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { session } = useAuth();

  const fetchAgencyAIDecisions = async () => {
    setLoading(true);
    try {
      // Fetch real AI decisions from database
      const { data, error } = await supabase
        .from('ai_agent_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching agency AI decisions:', error);
        throw error;
      }

      // Transform database decisions into AgencyAIDecision format
      const transformedDecisions: AgencyAIDecision[] = (data || []).map((decision: any) => ({
        id: decision.id.toString(),
        agent: decision.agent,
        action: decision.action,
        clientId: decision.details?.clientId,
        clientName: decision.details?.clientName || decision.agency,
        outcome: decision.outcome,
        risk: decision.risk,
        details: decision.details || {},
        created_at: decision.created_at,
        crossClientPattern: decision.details?.crossClientPattern || false,
        slaImpact: decision.details?.slaImpact || 'none',
        agencyAction: decision.details?.agencyAction || 'none'
      }));

      // If we have real data, use it; otherwise trigger AI analysis for sample data
      if (transformedDecisions.length > 0) {
        setDecisions(transformedDecisions);
        updateAnalytics(transformedDecisions);
      } else {
        // Generate initial AI decisions for new agencies
        await generateInitialAIDecisions();
      }
    } catch (error) {
      console.error('Falling back to sample data:', error);
      // Agency-specific sample data
      const agencySampleDecisions: AgencyAIDecision[] = [
        {
          id: '1',
          agent: 'Cross-Client Risk Detector',
          action: 'Detected GDPR conflict across Pfizer and Novartis submissions',
          clientId: 'pfizer-001',
          clientName: 'Pfizer Inc.',
          outcome: 'flagged',
          risk: 'high',
          details: { 
            confidence: 0.92, 
            reasoning: 'Similar data processing patterns detected across clients require policy alignment',
            conflictingClients: ['Pfizer Inc.', 'Novartis AG']
          },
          created_at: new Date().toISOString(),
          crossClientPattern: true,
          slaImpact: 'major',
          agencyAction: 'escalate'
        },
        {
          id: '2',
          agent: 'SLA Monitor AI',
          action: 'Predicted SLA breach for Johnson & Johnson review',
          clientId: 'jj-001',
          clientName: 'Johnson & Johnson',
          outcome: 'escalated',
          risk: 'medium',
          details: { 
            confidence: 0.85, 
            reasoning: 'Current review velocity indicates 72h delay beyond SLA',
            estimatedDelay: '72 hours',
            suggestedAction: 'Reallocate reviewer resources'
          },
          created_at: new Date(Date.now() - 30 * 60000).toISOString(),
          crossClientPattern: false,
          slaImpact: 'critical',
          agencyAction: 'notify_client'
        },
        {
          id: '3',
          agent: 'Portfolio Compliance Analyzer',
          action: 'Auto-approved Merck tool after cross-validation',
          clientId: 'merck-001',
          clientName: 'Merck & Co.',
          outcome: 'approved',
          risk: 'low',
          details: { 
            confidence: 0.96, 
            reasoning: 'Tool matches previously approved pattern from GSK with similar risk profile',
            similarApprovals: ['GSK-AI-Tool-2024-Q3'],
            autoApprovalReason: 'Pattern matching'
          },
          created_at: new Date(Date.now() - 45 * 60000).toISOString(),
          crossClientPattern: true,
          slaImpact: 'none',
          agencyAction: 'none'
        }
      ];
      // Fallback to generating real AI decisions
      await generateInitialAIDecisions();
    } finally {
      setLoading(false);
    }
  };

  const generateInitialAIDecisions = async () => {
    try {
      // Generate a few AI-powered decisions to populate the feed
      const sampleAnalyses = [
        {
          documentType: 'submission',
          analysisType: 'cross_client_check',
          context: { reason: 'Cross-client pattern analysis for GDPR compliance' }
        },
        {
          documentType: 'submission', 
          analysisType: 'risk_assessment',
          context: { reason: 'SLA monitoring for pharmaceutical compliance review' }
        }
      ];

      for (const analysis of sampleAnalyses) {
        await supabase.functions.invoke('agency-ai-decisions', {
          body: analysis
        });
      }

      // Refetch decisions after generating
      setTimeout(() => fetchAgencyAIDecisions(), 2000);
    } catch (error) {
      console.error('Failed to generate initial AI decisions:', error);
      // Fallback to sample data
      const agencySampleDecisions: AgencyAIDecision[] = [
        {
          id: '1',
          agent: 'Cross-Client Risk Detector',
          action: 'Detected GDPR conflict across Pfizer and Novartis submissions',
          clientId: 'pfizer-001',
          clientName: 'Pfizer Inc.',
          outcome: 'flagged',
          risk: 'high',
          details: { 
            confidence: 0.92, 
            reasoning: 'Similar data processing patterns detected across clients require policy alignment',
            conflictingClients: ['Pfizer Inc.', 'Novartis AG']
          },
          created_at: new Date().toISOString(),
          crossClientPattern: true,
          slaImpact: 'major',
          agencyAction: 'escalate'
        }
      ];
      setDecisions(agencySampleDecisions);
      updateAnalytics(agencySampleDecisions);
    }
  };

  const updateAnalytics = (decisions: AgencyAIDecision[]) => {
    const analytics: AgencyAIAnalytics = {
      totalDecisions: decisions.length,
      crossClientRisks: decisions.filter(d => d.crossClientPattern).length,
      slaBreaches: decisions.filter(d => d.slaImpact === 'critical' || d.slaImpact === 'major').length,
      autoResolved: decisions.filter(d => d.outcome === 'approved' && d.details?.autoApprovalReason).length,
      clientRiskDistribution: {},
      topRiskPatterns: []
    };

    // Calculate client risk distribution
    decisions.forEach(decision => {
      if (decision.clientName && decision.risk) {
        const riskValue = decision.risk === 'critical' ? 4 : decision.risk === 'high' ? 3 : 
                         decision.risk === 'medium' ? 2 : 1;
        analytics.clientRiskDistribution[decision.clientName] = 
          (analytics.clientRiskDistribution[decision.clientName] || 0) + riskValue;
      }
    });

    // Extract top risk patterns
    const patterns = decisions
      .filter(d => d.crossClientPattern && d.details?.reasoning)
      .map(d => d.details?.reasoning || '')
      .slice(0, 3);
    analytics.topRiskPatterns = patterns;

    setAnalytics(analytics);
  };

  useEffect(() => {
    fetchAgencyAIDecisions();
    
    // Set up WebSocket for real-time updates with agency-specific handling
    let unsubscribe: (() => void) | null = null;

    if (session) {
      setIsConnected(webSocketService.isConnected());
      
      unsubscribe = webSocketService.subscribeToAIDecisions((data) => {
        console.log('Received agency AI decision via WebSocket:', data);
        
        // Transform WebSocket data to AgencyAIDecision format
        const newDecision: AgencyAIDecision = {
          id: data.id || Date.now().toString(),
          agent: data.agent || data.source || 'Agency AI Agent',
          action: data.action || data.message || 'Analysis completed',
          clientId: data.clientId || data.details?.clientId,
          clientName: data.clientName || data.agency || data.client,
          outcome: data.outcome || 'processed',
          risk: data.risk || 'low',
          details: data.details || data.payload || {},
          created_at: data.created_at || new Date().toISOString(),
          crossClientPattern: data.crossClientPattern || false,
          slaImpact: data.slaImpact || 'none',
          agencyAction: data.agencyAction || 'none'
        };

        setDecisions(prev => {
          const updated = [newDecision, ...prev.slice(0, 49)]; // Keep only latest 50
          updateAnalytics(updated);
          return updated;
        });
      });

      // Monitor connection status
      const statusCheck = setInterval(() => {
        setIsConnected(webSocketService.isConnected());
      }, 5000);

      return () => {
        if (unsubscribe) unsubscribe();
        clearInterval(statusCheck);
      };
    }

    // Fallback polling for non-authenticated users
    const interval = setInterval(fetchAgencyAIDecisions, 30000);
    return () => clearInterval(interval);
  }, [session, options.clientId, options.agencyId]);

  const escalateDecision = async (decisionId: string, reason: string) => {
    // Implementation for escalating decisions
    console.log('Escalating decision:', decisionId, 'Reason:', reason);
    // Would integrate with existing escalation workflow
  };

  const generateReport = async (clientId?: string) => {
    // Implementation for generating compliance reports
    console.log('Generating report for client:', clientId);
    // Would integrate with existing reporting system
  };

  return { 
    decisions, 
    analytics, 
    loading, 
    refetch: fetchAgencyAIDecisions, 
    isConnected,
    escalateDecision,
    generateReport
  };
};