import { Zap } from 'lucide-react';

interface ChatWidgetCollapsedProps {
  unreadCount: number;
  onClick: () => void;
}

export const ChatWidgetCollapsed = ({ unreadCount, onClick }: ChatWidgetCollapsedProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[16px] right-[16px] w-[40px] h-[40px] flex items-center justify-center bg-ink-900 text-white rounded-full shadow-lg hover:bg-ink-800 focus:shadow-focus-ring outline-none transition-colors z-[2147483647]"
      aria-label={`Chat assistant${unreadCount > 0 ? ` (${unreadCount} unread messages)` : ''}`}
    >
      <Zap className="w-5 h-5" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-primary text-white text-[10px] font-bold rounded-full">
          {unreadCount >= 10 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};
