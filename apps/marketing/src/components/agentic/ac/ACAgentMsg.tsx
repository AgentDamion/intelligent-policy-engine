import { ACAgentAvatar } from './ACAgentAvatar';
import { ACPill } from './ACPill';
import { WEAVE_LAYOUT } from '@/constants/weave';

interface ACAgentMsgProps {
  id?: string;
  agent: string;
  time: string;
  text: string;
  chips?: { label: string; kind?: 'agent' | 'status' | 'fact' }[];
}

export const ACAgentMsg = ({ id, agent, time, text, chips = [] }: ACAgentMsgProps) => {
  return (
    <article
      role="article"
      className="flex gap-s3"
      data-agent={agent}
      data-message-id={id}
      data-timestamp={time}
    >
      <ACAgentAvatar initial={agent} />
      
      <div className="flex-1">
        <div className="flex items-center gap-s2 mb-s1">
          <span className="font-mono text-[12px] text-ink-500">{agent}</span>
          <span className="font-mono text-[12px] text-ink-300">{time}</span>
        </div>
        
        <div 
          className="p-s3 rounded-r2 border border-ink-100 bg-surface-0 text-[14px] leading-[20px] text-ink-900"
          style={{ maxWidth: WEAVE_LAYOUT.MESSAGE_MAX_WIDTH }}
        >
          {text}
        </div>
        
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-s1 mt-s2" data-chip-container>
            {chips.map((chip, idx) => (
              <ACPill key={idx} {...chip} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
