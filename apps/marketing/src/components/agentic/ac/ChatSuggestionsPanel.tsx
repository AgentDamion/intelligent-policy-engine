import { Zap, ArrowRight, Download, Circle, Sparkles } from 'lucide-react';
import type { SuggestedAction } from '@/types/chat';

interface ChatSuggestionsPanelProps {
  actions: SuggestedAction[];
  onActionClick: (action: SuggestedAction) => void;
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'navigate':
      return <ArrowRight className="w-3 h-3" />;
    case 'download':
      return <Download className="w-3 h-3" />;
    case 'modal':
      return <Circle className="w-3 h-3" />;
    case 'api':
      return <Sparkles className="w-3 h-3" />;
    default:
      return <ArrowRight className="w-3 h-3" />;
  }
};

export const ChatSuggestionsPanel = ({ actions, onActionClick }: ChatSuggestionsPanelProps) => {
  if (actions.length === 0) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/5 p-s3">
      <div className="flex items-center gap-s1 mb-s2">
        <Zap className="w-3 h-3 text-primary" />
        <span className="text-[12px] font-semibold text-ink-900">
          Agent Suggestions
        </span>
      </div>
      
      <div className="flex flex-wrap gap-s2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action)}
            className="inline-flex items-center gap-s1 px-s2 py-s1 text-[12px] font-medium text-ink-900 bg-surface-0 border border-ink-200 rounded-r1 hover:bg-surface-50 hover:border-ink-300 focus:shadow-focus-ring outline-none transition-colors"
          >
            {getActionIcon(action.action_type)}
            <span>{action.label}</span>
            {action.priority === 'high' && (
              <span className="ml-s1 px-s1 py-0.5 bg-destructive text-white text-[10px] font-bold rounded">
                HIGH
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
