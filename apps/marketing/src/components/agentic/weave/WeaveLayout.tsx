import { useState, useEffect, useRef } from 'react';
import { ActiveThreads } from './ActiveThreads';
import { ConversationStream } from './ConversationStream';
import { ThreadListSkeleton } from '../ac/Skeleton';
import { WeaveAnnotations } from './WeaveAnnotations';
import { useAgentThreads } from '@/hooks/useAgentThreads';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';
import { transformThreadToMessages } from '@/services/agentMessageTransformer';
import { supabase } from '@/integrations/supabase/client';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { WEAVE_LAYOUT } from '@/constants/weave';
import { W2_THREAD_METADATA } from '@/data/weaveMockData';
import { useDemoMode } from '@/hooks/useDemoMode';

export const WeaveLayout = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isDemoMode } = useDemoMode();
  
  // Fetch threads (respects demo mode internally)
  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useAgentThreads();

  // Find selected thread
  const selectedThread = threads.find(t => t.id === selectedThreadId);
  
  // Fetch messages with real-time updates (respects demo mode internally)
  const { realtimeMessages, isTyping } = useAgentMessagesRealtime(selectedThreadId || '');
  const allMessages = realtimeMessages;
  
  // Get metadata for selected thread
  const selectedThreadData = selectedThreadId 
    ? W2_THREAD_METADATA[selectedThreadId as keyof typeof W2_THREAD_METADATA]
    : undefined;

  // Auto-select first thread on load
  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Clear input
      if (e.key === 'Escape') {
        setInputValue('');
        inputRef.current?.focus();
      }
      
      // /: Focus input
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Enter: Open first thread if none selected
      if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
        if (threads.length > 0 && !selectedThreadId) {
          setSelectedThreadId(threads[0].id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [threads, selectedThreadId]);

  // Handle agent query submission
  const handleAgentQuery = async (question: string) => {
    if (!question.trim() || !selectedThreadId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Call cursor-agent-adapter edge function
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          query: question,
          context: {
            threadId: selectedThreadId,
            // W2: Mock threads don't have meta.policyId structure
            policySnapshotId: undefined,
          },
        },
      });

      if (error) throw error;
      
      setInputValue('');
      toast.success('Question sent to agents');
      
    } catch (error) {
      console.error('Agent query failed:', error);
      toast.error('Failed to send question. Please try again.');
      setInputValue(question); // Restore on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgentQuery(inputValue);
    }
  };

  // Error state
  if (threadsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-ink-700 text-[14px] mb-s3">Failed to load agent conversations</p>
          <button
            onClick={() => window.location.reload()}
            className="px-s3 py-s2 bg-ink-900 text-white rounded-r1 text-[14px] font-medium hover:bg-ink-800 focus:shadow-focus-ring outline-none"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" data-weave-layout>
      {/* Left Panel - Active Threads */}
      <aside 
        className="bg-surface-50 border-r border-ink-100 flex flex-col flex-shrink-0"
        style={{ width: WEAVE_LAYOUT.INBOX_WIDTH }}
        aria-label="Active threads"
        data-inbox-width={WEAVE_LAYOUT.INBOX_WIDTH}
      >
        <div className="p-s4 border-b border-ink-100 bg-surface-0">
          <h2 className="text-[14px] font-semibold text-ink-900 mb-s1">Active Threads</h2>
          <p className="text-[12px] font-mono text-ink-500">Multi-agent policy dialogues</p>
        </div>

        <div role="list" className="flex-1 overflow-y-auto">
          {threadsLoading ? (
            <ThreadListSkeleton />
          ) : threads.length === 0 ? (
            <div className="p-s4 text-center">
              <p className="text-ink-500 text-[12px] font-mono mb-s2">No active conversations</p>
              <p className="text-ink-300 text-[12px]">Agent activities will appear here</p>
            </div>
          ) : (
            <ActiveThreads 
              threads={threads}
              selectedId={selectedThreadId || ''}
              onSelect={setSelectedThreadId}
            />
          )}
        </div>

        <div className="p-s3 border-t border-ink-100 bg-surface-0">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask the agents a question…"
            disabled={!selectedThreadId || isSubmitting}
            className={clsx(
              'w-full px-s3 py-s2 text-[14px] rounded-r2 border',
              'bg-surface-0 text-ink-900 placeholder:text-ink-300',
              'border-ink-200 focus:border-ink-500 focus:shadow-focus-ring outline-none transition-colors',
              (!selectedThreadId || isSubmitting) && 'bg-surface-50 text-ink-300 cursor-not-allowed'
            )}
            aria-label="Ask the agents a question"
          />
        </div>
      </aside>

      {/* Center Panel - Conversation */}
      <main 
        className="flex-1 overflow-y-auto bg-surface-0" 
        aria-label="Conversation"
        data-message-max-width={WEAVE_LAYOUT.MESSAGE_MAX_WIDTH}
      >
        {selectedThread ? (
          <ConversationStream 
            threadId={selectedThreadId || ''}
            threadTitle={selectedThread.title}
            messages={allMessages}
            startedTime={selectedThreadData?.startedTime}
            exchangeCount={selectedThreadData?.exchangeCount}
            participantCount={selectedThreadData?.participantCount}
            isLoading={threadsLoading}
            isTyping={isTyping}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-ink-500 text-[14px] font-mono mb-s1">
                {threads.length === 0 ? 'No threads yet' : 'Select a thread to view'}
              </p>
              <p className="text-ink-300 text-[12px]">
                {threads.length === 0 
                  ? 'Agent activities will create threads automatically' 
                  : 'Choose from the left panel'}
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* QA Overlay - visible in development mode */}
      {process.env.NODE_ENV === 'development' && <WeaveAnnotations />}
    </div>
  );
};

// Helper: Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
