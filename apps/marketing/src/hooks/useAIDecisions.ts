import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import webSocketService from '@/services/webSocketService';
import { useAuth } from '@/contexts/AuthContext';

export interface AIDecision {
  id: string;
  agent: string;
  action: string;
  agency?: string;
  outcome: 'approved' | 'rejected' | 'flagged';
  risk?: 'low' | 'medium' | 'high';
  details?: Record<string, any>;
  created_at: string;
}

export const useAIDecisions = () => {
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { session } = useAuth();

  const fetchAIDecisions = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase ai_agent_decisions table - table may not exist in types yet
      const { data, error } = await supabase
        .from('ai_agent_decisions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching AI decisions (expected if table not in types):', error);
        throw error;
      }

      const transformedDecisions: AIDecision[] = (data || []).map((decision: any) => ({
        id: decision.id.toString(),
        agent: decision.agent,
        action: decision.action,
        agency: decision.agency,
        outcome: decision.outcome,
        risk: decision.risk,
        details: decision.details || {},
        created_at: decision.created_at
      }));

      setDecisions(transformedDecisions);
    } catch (error) {
      console.error('Using sample data - ai_agent_decisions table not ready:', error);
      // Fallback to sample data (expected until table is in types)
      const sampleDecisions: AIDecision[] = [
        {
          id: '1',
          agent: 'Policy Compliance AI',
          action: 'Reviewed Pfizer AI tool submission',
          agency: 'Pfizer Inc.',
          outcome: 'approved',
          risk: 'low',
          details: { confidence: 0.95, reasoning: 'All compliance checks passed' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          agent: 'Risk Assessment AI',
          action: 'Flagged Novartis data processing tool',
          agency: 'Novartis AG',
          outcome: 'flagged',
          risk: 'medium',
          details: { confidence: 0.78, reasoning: 'Requires manual review for GDPR compliance' },
          created_at: new Date(Date.now() - 15 * 60000).toISOString()
        }
      ];
      setDecisions(sampleDecisions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIDecisions();
    
    // Set up WebSocket for real-time updates
    let unsubscribe: (() => void) | null = null;

    if (session) {
      setIsConnected(webSocketService.isConnected());
      
      unsubscribe = webSocketService.subscribeToAIDecisions((data) => {
        console.log('Received AI decision via WebSocket:', data);
        
        // Transform WebSocket data to AIDecision format
        const newDecision: AIDecision = {
          id: data.id || Date.now().toString(),
          agent: data.agent || data.source || 'AI Agent',
          action: data.action || data.message || 'Analysis completed',
          agency: data.agency || data.client,
          outcome: data.outcome || 'processed',
          risk: data.risk || 'low',
          details: data.details || data.payload || {},
          created_at: data.created_at || new Date().toISOString()
        };

        setDecisions(prev => [newDecision, ...prev.slice(0, 19)]); // Keep only latest 20
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
    const interval = setInterval(fetchAIDecisions, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return { decisions, loading, refetch: fetchAIDecisions, isConnected };
};