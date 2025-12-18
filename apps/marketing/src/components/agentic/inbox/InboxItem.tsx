import { clsx } from 'clsx';
import { ACPill } from '@/components/agentic/ac/ACPill';
import type { InboxItem as InboxItemType } from './types';

interface InboxItemProps {
  item: InboxItemType;
  isSelected?: boolean;
  onClick: () => void;
}

function getSeverityColor(severity: InboxItemType['severity']) {
  switch (severity) {
    case 'critical':
      return 'bg-[hsl(0_84%_60%)]';
    case 'high':
      return 'bg-[hsl(25_95%_53%)]';
    case 'medium':
      return 'bg-[hsl(45_100%_51%)]';
    case 'low':
    default:
      return 'bg-ink-300';
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export const InboxItem = ({ item, isSelected, onClick }: InboxItemProps) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left flex items-start gap-s3 px-s4 py-s3 transition-colors',
        'hover:bg-surface-50 border-b border-ink-50',
        isSelected ? 'bg-surface-50' : 'bg-white'
      )}
    >
      {/* Severity Indicator */}
      <div className="flex-shrink-0 pt-[6px]">
        {!item.is_read && (
          <div className={clsx('w-2 h-2 rounded-full', getSeverityColor(item.severity))} />
        )}
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-s2 mb-s1">
          <h3 className="text-[14px] font-semibold text-ink-900 truncate flex-1">
            {item.title}
          </h3>
          <span className="text-[12px] text-ink-400 flex-shrink-0">
            {formatRelativeTime(item.last_updated_at)}
          </span>
        </div>
        
        <p className="text-[12px] text-ink-500 truncate mb-s1">
          {item.subtitle}
        </p>
        
        <div className="flex items-center gap-s2 flex-wrap">
          <ACPill label={item.narrative_status} kind="status" />
          
          {item.metadata_badges.slice(0, 2).map((badge, idx) => (
            <span key={idx} className="text-[11px] text-ink-400 font-mono">
              {badge.icon} {badge.label}
              {badge.count !== undefined && ` ${badge.count}`}
            </span>
          ))}
        </div>
        
        <p className="text-[11px] text-ink-400 truncate mt-s1">
          {item.participants.join(', ')}
        </p>
      </div>
    </button>
  );
};
