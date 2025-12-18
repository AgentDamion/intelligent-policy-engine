import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubmissionData {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
  risk_score?: number;
  created_at: string;
  submitted_at?: string;
  decided_at?: string;
  workspace_id: string;
}

export const useSupabaseSubmissions = (workspaceId?: string) => {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }

      const transformedSubmissions: SubmissionData[] = (data || []).map(submission => ({
        id: submission.id,
        title: submission.title,
        description: submission.description,
        status: submission.status,
        risk_score: submission.risk_score,
        created_at: submission.created_at,
        submitted_at: submission.submitted_at,
        decided_at: submission.decided_at,
        workspace_id: submission.workspace_id
      }));

      setSubmissions(transformedSubmissions);

      // Calculate stats
      const total = transformedSubmissions.length;
      const pending = transformedSubmissions.filter(s => s.status === 'under_review' || s.status === 'submitted').length;
      const approved = transformedSubmissions.filter(s => s.status === 'approved').length;
      const rejected = transformedSubmissions.filter(s => s.status === 'rejected').length;

      setStats({ total, pending, approved, rejected });

    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      // Fallback to empty data on error - will be handled by UI
      setSubmissions([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchSubmissions, 60000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  return { submissions, loading, stats, refetch: fetchSubmissions };
};