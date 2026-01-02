import React from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge, StatusVariant } from '@/components/ui/status-badge';

interface ToolCardProps {
  tool: {
    name: string;
    category: string;
  };
  status: StatusVariant | 'unknown';
  onClick?: () => void;
  selected?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  status,
  onClick,
  selected = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const borderColor = selected
    ? 'border-l-aicomplyr-yellow'
    : isHovered
    ? 'border-l-neutral-400'
    : 'border-l-transparent';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'bg-white border-l-4 border-b border-b-neutral-200 p-4 cursor-pointer transition-all',
        borderColor
      )}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-semibold text-aicomplyr-black">
            {tool.name}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {tool.category}
          </div>
        </div>
{status === 'unknown' ? (
          <span className="inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-neutral-500 text-white">
            UNKNOWN
          </span>
        ) : (
          <StatusBadge variant={status} />
        )}
      </div>
    </div>
  );
};

