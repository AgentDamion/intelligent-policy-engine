import { ACAgentMsg } from '../ac/ACAgentMsg';
import { MessageSkeleton, TypingIndicator } from '../ac/Skeleton';
import { useAgentMessagesRealtime } from '@/hooks/useAgentMessagesRealtime';
import { useAgentThreads } from '@/hooks/useAgentThreads';
import { transformThreadToMessages } from '@/services/agentMessageTransformer';
import { WEAVE_LAYOUT } from '@/constants/weave';
import { W2_THREAD_METADATA } from '@/data/weaveMockData';
import { useDemoMode } from '@/hooks/useDemoMode';

interface ConversationPanelProps {
  threadId: string;
}

export const ConversationPanel = ({ threadId }: ConversationPanelProps) => {
  const { isDemoMode } = useDemoMode();
  
  // Fetch messages with real-time updates (respects demo mode internally)
  const { realtimeMessages, isTyping } = useAgentMessagesRealtime(threadId);
  const allMessages = realtimeMessages;
  const isLoading = false;
  
  // Get metadata for thread
  const selectedThreadData = W2_THREAD_METADATA[threadId as keyof typeof W2_THREAD_METADATA];

  return (
    <div 
      className="flex-1 overflow-y-auto bg-surface-0"
      data-conversation-panel
      data-thread-id={threadId}
    >
      <div 
        className="mx-auto p-s6"
        style={{ maxWidth: WEAVE_LAYOUT.MESSAGE_MAX_WIDTH }}
      >
        <div className="mb-s4">
          <p className="text-[12px] text-ink-500 mb-s1">
            Agent conversation that informed this decision
          </p>
          <p className="font-mono text-[12px] text-ink-400">
            {selectedThreadData 
              ? `${selectedThreadData.exchangeCount} exchanges · ${selectedThreadData.participantCount} participants`
              : `${allMessages.length} exchanges`}
          </p>
        </div>

        <div className="flex flex-col gap-s4">
          {isLoading ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          ) : allMessages.length > 0 ? (
            <>
              {allMessages.map((msg) => (
                <ACAgentMsg key={msg.id} {...msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-ink-500">
              <p className="font-mono text-[12px]">No conversation history</p>
              <p className="text-[12px] text-ink-300 mt-s1">Agent dialogue will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
