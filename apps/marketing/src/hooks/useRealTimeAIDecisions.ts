/**
 * Enhanced hook for real-time AI decisions with Supabase subscriptions
 * Connects Cursor AI agent outputs to Lovable dashboard displays
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { monitoring } from '@/utils/monitoring';

export interface RealTimeAIDecision {
  id: string;
  agent: string;
  action: string;
  agency?: string;
  outcome: 'approved' | 'rejected' | 'flagged' | 'needs_review';
  risk?: 'low' | 'medium' | 'high';
  details?: {
    confidence?: number;
    reasoning?: string;
    recommendations?: string[];
    documentTitle?: string;
    [key: string]: any;
  };
  created_at: string;
  enterprise_id?: string;
}

export const useRealTimeAIDecisions = (enterpriseId?: string) => {
  const [decisions, setDecisions] = useState<RealTimeAIDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { session } = useAuth();

  const fetchAIDecisions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_agent_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (enterpriseId) {
        query = query.eq('enterprise_id', enterpriseId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching AI decisions:', error);
        throw error;
      }

      const transformedDecisions: RealTimeAIDecision[] = (data || []).map((decision: any) => ({
        id: decision.id.toString(),
        agent: decision.agent,
        action: decision.action,
        agency: decision.agency,
        outcome: decision.outcome,
        risk: decision.risk,
        details: decision.details || {},
        created_at: decision.created_at,
        enterprise_id: decision.enterprise_id
      }));

      setDecisions(transformedDecisions);
      monitoring.info('Fetched real-time AI decisions', { count: transformedDecisions.length });
      
    } catch (error) {
      console.error('Failed to fetch AI decisions:', error);
      monitoring.error('AI decisions fetch failed', error);
      
      // Fallback to sample data for demo purposes
      const sampleDecisions: RealTimeAIDecision[] = [
        {
          id: 'sample-1',
          agent: 'PolicyOrchestrator',
          action: 'Processed Enterprise AI Tool Policy',
          agency: 'Enterprise Client',
          outcome: 'approved',
          risk: 'low',
          details: { 
            confidence: 0.95, 
            reasoning: 'All compliance checks passed',
            recommendations: ['Monitor usage patterns', 'Review quarterly'],
            documentTitle: 'AI Tool Governance Policy'
          },
          created_at: new Date().toISOString(),
          enterprise_id: enterpriseId
        },
        {
          id: 'sample-2',
          agent: 'ComplianceAgent',
          action: 'Flagged potential GDPR violation',
          agency: 'Digital Marketing Team',
          outcome: 'flagged',
          risk: 'medium',
          details: { 
            confidence: 0.78, 
            reasoning: 'Data processing location unclear',
            recommendations: ['Clarify data residency', 'Add DPA requirements'],
            documentTitle: 'Customer Analytics Platform'
          },
          created_at: new Date(Date.now() - 15 * 60000).toISOString(),
          enterprise_id: enterpriseId
        }
      ];
      setDecisions(sampleDecisions);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    let subscription: any = null;

    if (session) {
      setIsConnected(true);
      
      // Subscribe to real-time changes
      const channel = supabase.channel('ai-decisions-realtime');
      
      let subscriptionConfig = {
        event: '*',
        schema: 'public',
        table: 'ai_agent_decisions'
      } as any;

      // Add enterprise filter if provided
      if (enterpriseId) {
        subscriptionConfig.filter = `enterprise_id=eq.${enterpriseId}`;
      }

      subscription = channel
        .on('postgres_changes', subscriptionConfig, (payload) => {
          console.log('Real-time AI decision update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newDecision: RealTimeAIDecision = {
              id: payload.new.id.toString(),
              agent: payload.new.agent,
              action: payload.new.action,
              agency: payload.new.agency,
              outcome: payload.new.outcome,
              risk: payload.new.risk,
              details: payload.new.details || {},
              created_at: payload.new.created_at,
              enterprise_id: payload.new.enterprise_id
            };
            
            setDecisions(prev => [newDecision, ...prev.slice(0, 49)]); // Keep latest 50
            monitoring.info('Received real-time AI decision', { agent: newDecision.agent });
          }
          
          if (payload.eventType === 'UPDATE') {
            setDecisions(prev => prev.map(decision => 
              decision.id === payload.new.id.toString() 
                ? { ...decision, ...payload.new }
                : decision
            ));
          }
        })
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    } else {
      setIsConnected(false);
    }
  }, [session, enterpriseId]);

  // Initial fetch
  useEffect(() => {
    fetchAIDecisions();
  }, [enterpriseId]);

  // Auto-refresh fallback
  useEffect(() => {
    const interval = setInterval(fetchAIDecisions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [enterpriseId]);

  return { 
    decisions, 
    loading, 
    refetch: fetchAIDecisions, 
    isConnected 
  };
};