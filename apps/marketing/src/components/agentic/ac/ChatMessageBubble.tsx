import { formatDistanceToNow, format } from 'date-fns';
import { ACAgentAvatar } from './ACAgentAvatar';
import type { ChatMessage } from '@/types/chat';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isLatest?: boolean;
}

export const ChatMessageBubble = ({ message, isLatest }: ChatMessageBubbleProps) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.created_at);
  const timeAgo = Date.now() - timestamp.getTime() < 86400000
    ? formatDistanceToNow(timestamp, { addSuffix: true })
    : format(timestamp, 'MMM d, h:mm a');
  
  const agentName = message.metadata?.agent || 'Assistant';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-s1 max-w-[280px]">
          <div className="bg-ink-900 text-white rounded-r2 px-s3 py-s2">
            <p className="text-[14px] leading-[20px] whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="font-mono text-[11px] text-ink-500 px-s1">
            {timeAgo}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-s2 items-start">
      <ACAgentAvatar initial={agentName.charAt(0)} size={28} type="agent" />
      
      <div className="flex flex-col gap-s1 max-w-[280px]">
        <div className="bg-surface-50 border border-ink-100 rounded-r2 px-s3 py-s2">
          <p className="text-[14px] leading-[20px] text-ink-900 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        <div className="flex items-center gap-s2 font-mono text-[11px] text-ink-500 px-s1">
          <span>{agentName}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};
