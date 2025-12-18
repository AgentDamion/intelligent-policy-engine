import { Link } from 'react-router-dom';
import { ACAgentMsg } from '../ac/ACAgentMsg';
import { ACButton } from '../ac/ACButton';
import { MessageSkeleton, TypingIndicator } from '../ac/Skeleton';
import type { TransformedMessage } from '@/types/agentic';
import { WEAVE_LAYOUT } from '@/constants/weave';

interface ConversationStreamProps {
  threadId: string;
  threadTitle: string;
  messages: TransformedMessage[];
  startedTime?: string;
  exchangeCount?: number;
  participantCount?: number;
  isLoading?: boolean;
  isTyping?: boolean;
}

export const ConversationStream = ({ 
  threadId, 
  threadTitle, 
  messages,
  startedTime,
  exchangeCount,
  participantCount,
  isLoading = false,
  isTyping = false 
}: ConversationStreamProps) => {
  const conversationState = isLoading ? 'loading' : isTyping ? 'typing' : 'ready';
  
  return (
    <div 
      className="mx-auto p-s6"
      style={{ maxWidth: WEAVE_LAYOUT.MESSAGE_MAX_WIDTH }}
      data-message-count={messages.length}
      data-conversation-state={conversationState}
      data-proof-bundle={`bundle-${threadId}`}
    >
      <div className="flex items-center justify-between mb-s4">
        <div>
          <h2 className="text-[18px] font-semibold text-ink-900 mb-s1">
            {threadTitle}
          </h2>
          <p className="font-mono text-[12px] text-ink-500">
            {startedTime && exchangeCount && participantCount 
              ? `Started ${startedTime} · ${exchangeCount} exchanges · ${participantCount} participants`
              : `${messages.length} exchanges`}
          </p>
        </div>
        
        <div className="flex items-center gap-s2">
          <Link 
            to={`/spine/${threadId}`}
            className="px-s3 py-s2 text-[14px] font-medium rounded-r1 outline-none transition-colors text-ink-700 hover:bg-surface-50 focus:shadow-focus-ring"
            data-action="summarize-to-spine"
          >
            Summarize to Spine
          </Link>
          
          <ACButton variant="primary" data-action="view-proof">
            View Proof Bundle
          </ACButton>
        </div>
      </div>

      <div className="flex flex-col gap-s4">
        {isLoading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </>
        ) : messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <ACAgentMsg key={msg.id} {...msg} />
            ))}
            {isTyping && <TypingIndicator />}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-ink-500">
            <p className="font-mono text-[12px]">No messages yet</p>
            <p className="text-[12px] text-ink-300 mt-s1">Ask a question to start the conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};
