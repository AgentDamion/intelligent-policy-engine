import { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { MiddlewareActivityItem } from './MiddlewareActivityItem';
import { Skeleton } from '@/components/ui/skeleton';
import type { MiddlewareRequest, SortOption } from './types';

interface MiddlewareActivityListProps {
  requests: MiddlewareRequest[];
  selectedRequestId: string | null;
  onRequestSelect: (id: string) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const MiddlewareActivityList = ({
  requests,
  selectedRequestId,
  onRequestSelect,
  loading,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: MiddlewareActivityListProps) => {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'cost', label: 'Highest Cost' },
    { value: 'slowest', label: 'Slowest' },
  ];

  const cycleSort = () => {
    const currentIndex = sortOptions.findIndex((opt) => opt.value === sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSortChange(sortOptions[nextIndex].value);
  };

  return (
    <div className="flex-1 flex flex-col border-r border-ink-100 bg-white">
      <div className="border-b border-ink-100 bg-surface-0 px-s4 py-s3">
        <div className="flex items-center justify-between mb-s3">
          <div className="text-[12px] text-ink-500 font-mono">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </div>

          <button
            onClick={cycleSort}
            className={clsx(
              'flex items-center gap-s1 px-s2 py-s1 text-[12px] font-medium text-ink-600',
              'hover:text-ink-900 hover:bg-surface-50 rounded-r1 transition-colors'
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortOptions.find((opt) => opt.value === sortBy)?.label}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-s2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search requests..."
            className={clsx(
              'w-full pl-[36px] pr-s3 py-s2 text-[14px] rounded-r1 border border-ink-200',
              'bg-white text-ink-900 placeholder:text-ink-400',
              'focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent'
            )}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-s4 space-y-s3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-full p-s6 text-center">
            <div>
              <p className="text-[14px] text-ink-500 mb-s2">No requests found</p>
              <p className="text-[12px] text-ink-400">
                Try adjusting your filters or time range
              </p>
            </div>
          </div>
        ) : (
          <div>
            {requests.map((request) => (
              <MiddlewareActivityItem
                key={request.id}
                request={request}
                isSelected={selectedRequestId === request.id}
                onClick={() => onRequestSelect(request.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
