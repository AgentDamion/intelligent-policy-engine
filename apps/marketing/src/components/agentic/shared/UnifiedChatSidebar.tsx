import { useState } from 'react';
import { useAgentThreads } from '@/hooks/useAgentThreads';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';
import { ActiveThreads } from '../weave/ActiveThreads';
import { ConversationStream } from '../weave/ConversationStream';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { monitoring } from '@/utils/monitoring';

interface UnifiedChatSidebarProps {
  selectedThreadId: string;
  onThreadSelect: (threadId: string) => void;
  className?: string;
}

export const UnifiedChatSidebar = ({
  selectedThreadId,
  onThreadSelect,
  className = '',
}: UnifiedChatSidebarProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: threads = [], isLoading, error } = useAgentThreads();
  const { realtimeMessages, isTyping } = useAgentMessagesRealtime(selectedThreadId);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const handleAgentQuery = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const query = inputValue;
    setInputValue('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user?.id || '')
        .limit(1)
        .single();

      const { error: functionError } = await supabase.functions.invoke(
        'cursor-agent-adapter',
        {
          body: {
            query,
            context: {
              threadId: selectedThreadId,
              workspaceId: workspaceMember?.workspace_id,
              mode: 'unified-sidebar'
            }
          }
        }
      );

      if (functionError) throw functionError;

      monitoring.info('Agent query sent from unified sidebar', {
        threadId: selectedThreadId,
        queryLength: query.length
      });
    } catch (err) {
      console.error('Failed to send query:', err);
      toast.error('Failed to send message to agents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgentQuery();
    }
  };

  if (error) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex-1 flex items-center justify-center p-s4">
          <div className="text-center text-ink-500 text-[14px]">
            Failed to load threads
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-surface-0 border-r border-ink-100 ${className}`}>
      {/* Thread List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-s3 border-b border-ink-100">
          <h2 className="text-[14px] font-semibold text-ink-900">Active Threads</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ActiveThreads
            threads={threads.map((thread) => ({
              id: thread.id,
              title: thread.title,
              pills: [
                { label: `${thread.participants?.length ?? thread.participantCount ?? 0} agents`, kind: 'agent' as const },
                { label: thread.status, kind: 'status' as const }
              ],
              meta: new Date(thread.lastActivityTime).toLocaleString(),
              status: thread.status,
              participantCount: thread.participants?.length ?? thread.participantCount ?? 0
            }))}
            selectedId={selectedThreadId}
            onSelect={onThreadSelect}
          />
        </div>
      </div>

      {/* Input at Bottom */}
      <div className="border-t border-ink-100 p-s3 bg-surface-50">
        <div className="mb-s2">
          <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wide">
            Agent Chat
          </div>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Ask the agents a question..."
          disabled={isSubmitting}
          className="w-full px-s3 py-s2 text-[14px] rounded-r1 border border-ink-200 bg-surface-0 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};
