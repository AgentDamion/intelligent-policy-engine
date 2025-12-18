import { InboxItem } from './InboxItem';
import { InboxHeader } from './InboxHeader';
import { InboxEmptyState } from './InboxEmptyState';
import { InboxSkeleton } from './InboxSkeleton';
import type { InboxItem as InboxItemType } from './types';

interface InboxListProps {
  items: InboxItemType[];
  selectedItemId?: string;
  onItemSelect: (itemId: string) => void;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'most_recent' | 'oldest' | 'priority';
  onSortChange: (sort: 'most_recent' | 'oldest' | 'priority') => void;
}

export const InboxList = ({
  items,
  selectedItemId,
  onItemSelect,
  isLoading,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: InboxListProps) => {
  const unreadCount = items.filter(item => !item.is_read).length;
  
  return (
    <div className="flex flex-col h-full bg-white border-r border-ink-100">
      <InboxHeader
        total={items.length}
        unread={unreadCount}
        lastUpdated="2m ago"
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <InboxSkeleton />
        ) : items.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <div>
            {items.map((item) => (
              <InboxItem
                key={item.item_id}
                item={item}
                isSelected={selectedItemId === item.item_id}
                onClick={() => onItemSelect(item.item_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
