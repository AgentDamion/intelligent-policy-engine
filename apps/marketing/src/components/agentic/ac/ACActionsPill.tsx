import { useState } from 'react';
import { useAgentSuggestedActions } from '@/hooks/useAgentSuggestedActions';
import { ACActionsDrawer } from './ACActionsDrawer';

interface ACActionsPillProps {
  threadId: string;
}

export const ACActionsPill = ({ threadId }: ACActionsPillProps) => {
  const { data: actions = [], isLoading } = useAgentSuggestedActions(threadId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading || actions.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-s4 right-s4 px-s4 py-s3 bg-ink-900 text-white rounded-r2 shadow-lg hover:bg-ink-800 focus:shadow-focus-ring outline-none flex items-center gap-s2 transition-all z-50"
        data-agent-actions-pill
        aria-label={`${actions.length} agent suggestions available`}
      >
        <span className="font-mono text-[12px] font-medium">
          Agent Suggestions
        </span>
        <span className="bg-white text-ink-900 px-s2 py-s1 rounded-r1 text-[11px] font-bold">
          {actions.length}
        </span>
      </button>

      <ACActionsDrawer
        actions={actions}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        threadId={threadId}
      />
    </>
  );
};
