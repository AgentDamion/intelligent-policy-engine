import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgentActivity, TransformedMessage } from '@/types/agentic';
import { transformActivityToMessage } from '@/services/agentMessageTransformer';
import { useDemoMode } from './useDemoMode';
import { W2_MOCK_MESSAGES } from '@/data/weaveMockData';

export const useAgentMessagesRealtime = (threadId: string) => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();
  const [realtimeMessages, setRealtimeMessages] = useState<TransformedMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // In demo mode, return mock messages for thread-1
    if (isDemoMode) {
      if (threadId === 'thread-1') {
        setRealtimeMessages(W2_MOCK_MESSAGES);
        setIsTyping(false);
      } else {
        setRealtimeMessages([]);
        setIsTyping(false);
      }
      return;
    }

    if (!threadId || threadId === 'general') return;

    // Subscribe to new agent_activities
    const channel = supabase
      .channel(`agent-activities-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activities',
        },
        (payload) => {
          const activity = payload.new as AgentActivity;
          
          // Check if activity belongs to this thread
          const details = activity.details || {};
          const context = details.context || {};
          const activityThreadId = context.policy_snapshot_id || 
                                   context.decision_id || 
                                   context.workflow_id || 
                                   activity.workspace_id;
          
          if (activityThreadId === threadId) {
            const message = transformActivityToMessage(activity);
            setRealtimeMessages(prev => [...prev, message]);
            
            // Show typing indicator briefly
            if (activity.status === 'processing') {
              setIsTyping(true);
              setTimeout(() => setIsTyping(false), 2000);
            } else {
              setIsTyping(false);
            }
            
            // Invalidate threads query to update counts
            queryClient.invalidateQueries({ queryKey: ['agent-threads'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);

  return { realtimeMessages, isTyping };
};
