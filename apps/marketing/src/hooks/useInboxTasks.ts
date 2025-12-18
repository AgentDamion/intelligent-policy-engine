import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InboxTask {
  id: string;
  source_agent: string;
  user_role_target: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  summary_html: string;
  task_type: string;
  action_type: string;
  action_payload: Record<string, any>;
  source_url?: string;
  source_entity_id?: string;
  context_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  actioned_at?: string;
  actioned_by?: string;
  action_response?: Record<string, any>;
  assigned_to?: string;
  workspace_id?: string;
  requires_approval?: boolean;
}

export const useInboxTasks = () => {
  return useQuery({
    queryKey: ['inbox-tasks'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inbox_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as InboxTask[];
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

export const useInboxTask = (taskId: string) => {
  return useQuery({
    queryKey: ['inbox-task', taskId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inbox_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      return data as InboxTask;
    },
    enabled: !!taskId,
  });
};
