import { Inbox } from 'lucide-react';

export const InboxEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-s4 py-s8">
      <div className="w-16 h-16 rounded-full bg-surface-50 flex items-center justify-center mb-s4">
        <Inbox className="h-8 w-8 text-ink-300" />
      </div>
      <h3 className="text-[16px] font-semibold text-ink-900 mb-s2">Inbox zero</h3>
      <p className="text-[14px] text-ink-500 max-w-md">
        No items match your current filters. All governance threads are resolved or archived.
      </p>
    </div>
  );
};
