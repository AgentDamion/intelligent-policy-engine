import React from 'react';
import { EdgeCard, EdgeCardBody } from '@/components/ui/edge-card';
import { cn } from '@/lib/utils';

interface TriggeredRuleCardProps {
  title: string;
  description: string;
  match: string;
  action: string;
  variant: 'informational' | 'conditional';
}

export const TriggeredRuleCard: React.FC<TriggeredRuleCardProps> = ({
  title,
  description,
  match,
  action,
  variant,
}) => {
  const edgeColor = variant === 'informational' ? 'border-l-aicomplyr-yellow' : 'border-l-status-escalated';
  const bgColor = variant === 'informational' ? 'bg-yellow-50' : 'bg-amber-50';

  return (
    <EdgeCard className={cn('border-l-4', edgeColor, bgColor)}>
      <EdgeCardBody className="py-4">
        <div className="space-y-2">
          <h4 className="font-bold text-sm text-aicomplyr-black">{title}</h4>
          <p className="text-xs text-neutral-700">{description}</p>
          <div className="flex items-center gap-4 text-[11px] text-neutral-500">
            <span>Match: {match}</span>
            <span>Action: {action}</span>
          </div>
        </div>
      </EdgeCardBody>
    </EdgeCard>
  );
};

