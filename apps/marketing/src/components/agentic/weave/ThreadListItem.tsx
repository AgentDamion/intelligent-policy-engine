import { clsx } from 'clsx';
import { ACPill } from '../ac/ACPill';

interface ThreadListItemProps {
  id: string;
  title: string;
  pills: { label: string; kind?: 'agent' | 'human' | 'status' | 'fact' }[];
  meta: string;
  status: string;
  participantCount: number;
  active?: boolean;
  onClick?: () => void;
}

export const ThreadListItem = ({
  id,
  title,
  pills,
  meta,
  status,
  participantCount,
  active = false,
  onClick,
}: ThreadListItemProps) => {
  return (
    <button
      role="listitem"
      data-thread-id={id}
      data-thread-status={status}
      data-participant-count={participantCount}
      onClick={onClick}
      className={clsx(
        'w-full text-left p-s3 rounded-r2 border outline-none transition-all',
        'focus:shadow-focus-ring',
        active
          ? 'bg-surface-0 border-ink-300'
          : 'bg-transparent border-transparent hover:bg-surface-0 hover:border-ink-100'
      )}
    >
      <h3 className={clsx('text-[14px] font-semibold mb-s1', active ? 'text-ink-900' : 'text-ink-700')}>
        {title}
      </h3>
      
      <div className="flex flex-wrap gap-s1 mb-s2">
        {pills.map((pill, idx) => (
          <ACPill key={idx} {...pill} />
        ))}
      </div>
      
      <span className="font-mono text-[12px] text-ink-500">{meta}</span>
    </button>
  );
};
