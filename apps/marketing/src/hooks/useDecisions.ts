import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DecisionData {
  id: string;
  submission_id?: string;
  submission_item_id?: string;
  outcome: 'approved' | 'rejected' | 'approved_with_conditions';
  feedback?: string;
  conditions?: string;
  decided_by?: string;
  created_at: string;
  expires_at?: string;
  submission?: {
    title: string;
    workspace_id: string;
    status: string;
  };
}

export const useDecisions = (workspaceId?: string) => {
  const [decisions, setDecisions] = useState<DecisionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedWithConditions: 0
  });

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      // Fetch decisions with submission data
      let query = supabase
        .from('decisions')
        .select(`
          *,
          submissions (
            id,
            title,
            workspace_id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching decisions:', error);
        throw error;
      }

      // Filter by workspace if provided
      const filteredData = workspaceId 
        ? (data || []).filter(decision => 
            decision.submissions?.workspace_id === workspaceId)
        : (data || []);

      const transformedDecisions: DecisionData[] = filteredData.map(decision => ({
        id: decision.id,
        submission_id: decision.submission_id,
        submission_item_id: decision.submission_item_id,
        outcome: decision.outcome,
        feedback: decision.feedback,
        conditions: decision.conditions,
        decided_by: decision.decided_by,
        created_at: decision.created_at,
        expires_at: decision.expires_at,
        submission: decision.submissions ? {
          title: decision.submissions.title,
          workspace_id: decision.submissions.workspace_id,
          status: decision.submissions.status
        } : undefined
      }));

      setDecisions(transformedDecisions);

      // Calculate stats
      const total = transformedDecisions.length;
      const approved = transformedDecisions.filter(d => d.outcome === 'approved').length;
      const rejected = transformedDecisions.filter(d => d.outcome === 'rejected').length;
      const approvedWithConditions = transformedDecisions.filter(d => d.outcome === 'approved_with_conditions').length;
      const pending = total - approved - rejected - approvedWithConditions;

      setStats({ total, pending, approved, rejected, approvedWithConditions });

    } catch (error) {
      console.error('Failed to fetch decisions:', error);
      setDecisions([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0, approvedWithConditions: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [workspaceId]);

  return { decisions, loading, stats, refetch: fetchDecisions };
};