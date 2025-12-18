import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentSuggestedAction {
  id: string;
  label: string;
  action_type: 'navigate' | 'download' | 'modal' | 'api';
  target: string;
  priority: 'high' | 'medium' | 'low';
  context?: Record<string, any>;
  source_agent: string;
  created_at: string;
}

export const useAgentSuggestedActions = (threadId: string) => {
  return useQuery({
    queryKey: ['agent-suggested-actions', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_activities')
        .select('id, agent, created_at, details')
        .eq('workspace_id', threadId)
        .not('details->suggested_actions', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten and deduplicate actions from all messages
      const actions: AgentSuggestedAction[] = [];
      const seen = new Set<string>();

      data?.forEach((activity) => {
        const details = activity.details as any;
        const suggestedActions = details?.suggested_actions || [];
        suggestedActions.forEach((action: any) => {
          const key = `${action.action_type}:${action.target}`;
          if (!seen.has(key)) {
            seen.add(key);
            actions.push({
              id: `${activity.id}-${action.label}`,
              ...action,
              source_agent: activity.agent,
              created_at: activity.created_at
            });
          }
        });
      });

      // Sort by priority (high > medium > low) then by recency
      return actions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    refetchInterval: 5000,
    staleTime: 3000
  });
};
