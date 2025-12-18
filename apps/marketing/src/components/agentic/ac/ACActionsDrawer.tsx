import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { AgentSuggestedAction } from '@/hooks/useAgentSuggestedActions';

interface ACActionsDrawerProps {
  actions: AgentSuggestedAction[];
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
}

export const ACActionsDrawer = ({ 
  actions, 
  isOpen, 
  onClose,
  threadId 
}: ACActionsDrawerProps) => {
  const navigate = useNavigate();

  const handleAction = async (action: AgentSuggestedAction) => {
    switch (action.action_type) {
      case 'navigate':
        navigate(action.target);
        onClose();
        break;
      case 'download':
        window.open(action.target, '_blank');
        onClose();
        break;
      case 'modal':
        // Future enhancement
        break;
      case 'api':
        // Future enhancement
        break;
    }

    console.log('[Agent Action Executed]', {
      threadId,
      action: action.label,
      source: action.source_agent
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-ink-900/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div 
        className="fixed bottom-0 right-0 w-[400px] h-[500px] bg-surface-0 border-l border-t border-ink-100 rounded-tl-r3 shadow-2xl z-50 overflow-hidden flex flex-col"
        data-agent-actions-drawer
      >
        <div className="flex items-center justify-between px-s4 py-s3 border-b border-ink-100 bg-surface-50">
          <div>
            <h3 className="text-[14px] font-semibold text-ink-900">
              Agent Suggestions
            </h3>
            <p className="font-mono text-[11px] text-ink-500 mt-s1">
              {actions.length} actions recommended
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-s2 text-ink-500 hover:text-ink-900 hover:bg-surface-100 rounded-r1 focus:shadow-focus-ring outline-none"
            aria-label="Close suggestions"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-s4 space-y-s3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className="w-full text-left p-s3 border border-ink-100 rounded-r2 hover:border-ink-300 hover:bg-surface-50 focus:shadow-focus-ring outline-none transition-all"
              data-action-card
              data-priority={action.priority}
            >
              <div className="flex items-start justify-between mb-s2">
                <span className="text-[14px] font-medium text-ink-900">
                  {action.label}
                </span>
                <span className="font-mono text-[10px] text-ink-500 uppercase">
                  {action.source_agent}
                </span>
              </div>
              
              {action.context && (
                <p className="text-[12px] text-ink-700 mb-s2">
                  {getActionDescription(action)}
                </p>
              )}

              <div className="flex items-center gap-s2">
                <span className="text-[11px] font-mono text-ink-500">
                  {getActionTypeLabel(action.action_type)}
                </span>
                {action.priority === 'high' && (
                  <span className="px-s2 py-s1 bg-ink-900 text-white text-[10px] font-mono rounded-r1">
                    HIGH PRIORITY
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="px-s4 py-s3 border-t border-ink-100 bg-surface-50">
          <button
            onClick={onClose}
            className="w-full px-s3 py-s2 text-[14px] font-medium text-ink-700 hover:bg-surface-100 rounded-r1 outline-none focus:shadow-focus-ring"
          >
            Dismiss All
          </button>
        </div>
      </div>
    </>
  );
};

function getActionDescription(action: AgentSuggestedAction): string {
  const ctx = action.context || {};
  if (action.label.includes('Similar Decisions')) {
    return `Found ${ctx.count || 0} similar decisions from ${ctx.timeframe || 'recent history'}`;
  }
  if (action.label.includes('Export')) {
    return 'Download complete proof bundle with metadata for audit reporting';
  }
  return '';
}

function getActionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    navigate: '→ Navigate',
    download: '↓ Download',
    modal: '◎ View',
    api: '⚡ Execute'
  };
  return labels[type] || type;
}
