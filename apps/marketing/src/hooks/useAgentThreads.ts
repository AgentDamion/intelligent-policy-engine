import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgentActivity, AgentThread } from '@/types/agentic';
import { useDemoMode } from './useDemoMode';
import { W2_MOCK_THREADS } from '@/data/weaveMockData';

// Derive thread title from activity details/context
const deriveTitle = (activity: AgentActivity): string => {
  const details = activity.details || {};
  const context = details.context || {};
  
  if (context.policyTitle) return context.policyTitle;
  if (context.policyId) return `Policy ${context.policyId}`;
  if (context.workflowId) return `Workflow ${context.workflowId}`;
  if (context.decisionId) return `Decision ${context.decisionId}`;
  
  // Fallback to action
  return activity.action || 'Untitled Discussion';
};

// Group activities by shared context into threads
const groupIntoThreads = (activities: AgentActivity[]): AgentThread[] => {
  const threadMap = new Map<string, any>();

  activities.forEach((activity) => {
    const details = activity.details || {};
    const context = details.context || {};
    
    // Use policy_snapshot_id, decision_id, workflow_id, or policy_id as thread key
    const threadKey = context.policy_snapshot_id || 
                      context.decision_id || 
                      context.workflow_id || 
                      context.policy_id || 
                      activity.workspace_id ||
                      'general';

    if (!threadMap.has(threadKey)) {
      threadMap.set(threadKey, {
        id: threadKey,
        title: deriveTitle(activity),
        activities: [],
        participants: new Set<string>(),
        lastActivity: activity.created_at,
        status: 'active' as const,
        meta: {
          policyId: context.policy_id,
          decisionId: context.decision_id,
          workflowId: context.workflow_id,
        }
      });
    }

    const thread = threadMap.get(threadKey)!;
    thread.activities.push(activity);
    thread.participants.add(activity.agent);
    
    if (new Date(activity.created_at) > new Date(thread.lastActivity)) {
      thread.lastActivity = activity.created_at;
    }
  });

  // Convert to array and sort by last activity
  return Array.from(threadMap.values())
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .map((thread) => ({
      ...thread,
      participants: Array.from(thread.participants),
      activityCount: thread.activities.length,
      lastActivityTime: thread.lastActivity,
    }));
};

export const useAgentThreads = (workspaceId?: string, enterpriseId?: string) => {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ['agent-threads', workspaceId, enterpriseId, isDemoMode],
    queryFn: async () => {
      // Return mock data in demo mode
      if (isDemoMode) {
        return W2_MOCK_THREADS as any[];
      }

      let query = supabase
        .from('agent_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      // Filter by workspace or enterprise if provided
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      } else if (enterpriseId) {
        query = query.eq('enterprise_id', enterpriseId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return groupIntoThreads(data as AgentActivity[]);
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: isDemoMode ? false : 30 * 1000, // Don't auto-refresh in demo mode
  });
};
