import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { monitoring } from '@/utils/monitoring';
import type { ChatMessage, UseChatWidgetReturn } from '@/types/chat';

/**
 * Hook for managing chat widget state and interactions
 * Handles message fetching, real-time updates, sending messages, and unread tracking
 */
export const useChatWidget = (
  threadId: string,
  isWidgetOpen: boolean = false
): UseChatWidgetReturn => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch message history
  const { data: historyData, isLoading, error: queryError } = useQuery({
    queryKey: ['chat-messages', threadId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!threadId && threadId !== 'general',
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Real-time subscription for new messages
  const { isConnected } = useRealtimeSubscription({
    table: 'chat_messages',
    event: 'INSERT',
    filter: `thread_id=eq.${threadId}`,
    enabled: !!threadId && threadId !== 'general',
    onData: (payload) => {
      const newMessage = payload.new as ChatMessage;
      
      // Add to local state
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Track unread if from assistant and widget is collapsed
      if (newMessage.role === 'assistant' && !isWidgetOpen) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['chat-messages', threadId] });
      
      monitoring.info('New chat message received', {
        messageId: newMessage.id,
        role: newMessage.role,
        threadId: newMessage.thread_id
      }, 'chat-widget');
    },
    onError: (error) => {
      monitoring.error('Chat realtime subscription error', error, 'chat-widget');
      setError(error);
    }
  });

  // Sync messages from query data
  useEffect(() => {
    if (historyData) {
      setMessages(historyData);
    }
  }, [historyData]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError : new Error('Failed to load messages'));
    }
  }, [queryError]);

  // Reset state when thread changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    setIsSending(false);
  }, [threadId]);

  // Load unread count from localStorage on mount
  useEffect(() => {
    if (!threadId || threadId === 'general') return;
    
    const key = `chat-unread-${threadId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setUnreadCount(parseInt(stored, 10) || 0);
    }
  }, [threadId]);

  // Persist unread count to localStorage
  useEffect(() => {
    if (!threadId || threadId === 'general') return;
    
    const key = `chat-unread-${threadId}`;
    if (unreadCount > 0) {
      localStorage.setItem(key, unreadCount.toString());
    } else {
      localStorage.removeItem(key);
    }
  }, [unreadCount, threadId]);

  // Clear unread when widget opens
  useEffect(() => {
    if (isWidgetOpen && unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [isWidgetOpen, unreadCount]);

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get workspace context
      const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const workspaceId = workspaceMember?.workspace_id;

      // Insert user message to database
      const { data: userMessage, error: insertError } = await (supabase as any)
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          role: 'user',
          content: content.trim(),
          user_id: user.id,
          workspace_id: workspaceId,
          metadata: {
            timestamp: new Date().toISOString(),
            message_length: content.length
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // User message will appear via realtime subscription

      // Call agent edge function
      const { data: agentResponse, error: agentError } = await supabase.functions.invoke(
        'cursor-agent-adapter',
        {
          body: {
            query: content,
            context: {
              threadId: threadId,
              messageId: userMessage.id,
              workspaceId: workspaceId
            }
          }
        }
      );

      if (agentError) throw agentError;

      // Agent response will appear via realtime subscription
      monitoring.info('Message sent successfully', {
        messageId: userMessage.id,
        threadId,
        agentResponseReceived: !!agentResponse
      }, 'chat-widget');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      monitoring.error('Failed to send chat message', error, 'chat-widget');
      setError(error);
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [threadId, isSending]);

  // Clear unread count manually
  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    messages,
    unreadCount,
    isLoading,
    isSending,
    isConnected,
    sendMessage,
    clearUnread,
    error
  };
};
