import { ACAgentAvatar } from './ACAgentAvatar';

interface ChatTypingIndicatorProps {
  agent?: string;
}

export const ChatTypingIndicator = ({ agent = 'Agent' }: ChatTypingIndicatorProps) => {
  return (
    <div className="flex gap-s2 items-start">
      <ACAgentAvatar initial={agent.charAt(0)} size={28} type="agent" />
      
      <div className="flex flex-col gap-s1">
        <div className="bg-surface-50 border border-ink-100 rounded-r2 px-s3 py-s2 max-w-[280px]">
          <div className="flex items-center gap-s1">
            <span className="w-2 h-2 rounded-full bg-ink-500 animate-typing-dot-1" />
            <span className="w-2 h-2 rounded-full bg-ink-500 animate-typing-dot-2" />
            <span className="w-2 h-2 rounded-full bg-ink-500 animate-typing-dot-3" />
          </div>
        </div>
        
        <div className="font-mono text-[11px] text-ink-500 px-s1">
          {agent} is typing...
        </div>
      </div>
    </div>
  );
};
