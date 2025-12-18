import { Search, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';

interface InboxHeaderProps {
  total: number;
  unread: number;
  lastUpdated?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'most_recent' | 'oldest' | 'priority';
  onSortChange: (sort: 'most_recent' | 'oldest' | 'priority') => void;
}

export const InboxHeader = ({
  total,
  unread,
  lastUpdated,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: InboxHeaderProps) => {
  return (
    <div className="border-b border-ink-100 bg-surface-0 px-s4 py-s3">
      <div className="flex items-center justify-between mb-s3">
        <div className="text-[12px] text-ink-500 font-mono">
          {total} thread{total !== 1 ? 's' : ''} • {unread} unread
          {lastUpdated && ` • updated ${lastUpdated}`}
        </div>
        
        <div className="relative">
          <button
            onClick={() => {
              const next = sortBy === 'most_recent' ? 'oldest' : sortBy === 'oldest' ? 'priority' : 'most_recent';
              onSortChange(next);
            }}
            className={clsx(
              'flex items-center gap-s1 px-s2 py-s1 text-[12px] font-medium text-ink-600',
              'hover:text-ink-900 hover:bg-surface-50 rounded-r1 transition-colors'
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortBy === 'most_recent' ? 'Recent' : sortBy === 'oldest' ? 'Oldest' : 'Priority'}
          </button>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-s2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search threads..."
          className={clsx(
            'w-full pl-[36px] pr-s3 py-s2 text-[14px] rounded-r1 border border-ink-200',
            'bg-white text-ink-900 placeholder:text-ink-400',
            'focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent'
          )}
        />
      </div>
    </div>
  );
};
