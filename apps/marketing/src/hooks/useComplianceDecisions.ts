import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceDecision {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
  risk_score?: number;
  created_at: string;
  submitted_at?: string;
  decided_at?: string;
  workspace_id: string;
  items: SubmissionItem[];
  ai_recommendations: AIDecision[];
  human_decisions: Decision[];
  scores: Score[];
}

export interface SubmissionItem {
  id: string;
  ai_tool_name: string;
  vendor?: string;
  description?: string;
  risk_score?: number;
}

export interface AIDecision {
  id: number;
  agent: string;
  action: string;
  outcome: string;
  risk?: string;
  created_at: string;
  details?: any;
  agency?: string;
  enterprise_id?: string;
}

export interface Decision {
  id: string;
  outcome: 'approved' | 'approved_with_conditions' | 'rejected';
  conditions?: string;
  feedback?: string;
  created_at: string;
  decided_by?: string;
}

export interface Score {
  id: string;
  overall_score?: number;
  category_scores?: any;
  created_at: string;
}

export const useComplianceDecisions = (workspaceId?: string) => {
  const [decisions, setDecisions] = useState<ComplianceDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let submissionsQuery = supabase
        .from('submissions')
        .select(`
          *,
          submission_items (*),
          scores (*),
          decisions!decisions_submission_id_fkey (*)
        `)
        .order('created_at', { ascending: false });

      if (workspaceId) {
        submissionsQuery = submissionsQuery.eq('workspace_id', workspaceId);
      }

      const { data: submissions, error: submissionsError } = await submissionsQuery;

      if (submissionsError) throw submissionsError;

      // Fetch AI decisions separately
      const { data: aiDecisions, error: aiError } = await supabase
        .from('ai_agent_decisions')
        .select('*')
        .order('created_at', { ascending: false });

      if (aiError) throw aiError;

      const transformedDecisions: ComplianceDecision[] = (submissions || []).map(submission => ({
        id: submission.id,
        title: submission.title,
        status: submission.status,
        risk_score: submission.risk_score,
        created_at: submission.created_at,
        submitted_at: submission.submitted_at,
        decided_at: submission.decided_at,
        workspace_id: submission.workspace_id,
        items: submission.submission_items || [],
        ai_recommendations: aiDecisions || [],
        human_decisions: Array.isArray(submission.decisions) ? submission.decisions : [],
        scores: submission.scores || []
      }));

      setDecisions(transformedDecisions);
    } catch (err) {
      console.error('Error fetching compliance decisions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch decisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [workspaceId]);

  return { 
    decisions, 
    loading, 
    error, 
    refetch: fetchDecisions 
  };
};