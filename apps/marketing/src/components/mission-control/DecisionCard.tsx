import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DecisionBadge } from './DecisionBadge';
import type { DecisionItem } from '@/data/mockDecisions';

interface DecisionCardProps {
  decision: DecisionItem;
  onApprove?: (id: string) => void;
  onOverride?: (id: string) => void;
  onAskVera?: (id: string) => void;
}

export const DecisionCard = ({
  decision,
  onApprove,
  onOverride,
  onAskVera
}: DecisionCardProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const borderColor = {
    ESCALATE: 'border-l-amber-500',
    BLOCK: 'border-l-red-500',
    ALLOW: 'border-l-green-500'
  }[decision.recommendation];

  return (
    <div className={`bg-card border border-border rounded-lg border-l-4 ${borderColor} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1">
          {/* Campaign & Partner */}
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {decision.campaignName}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {decision.partner} - {decision.brand}
          </p>

          {/* Tools */}
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground">Tools: </span>
            <span className="text-sm text-foreground">
              {decision.tools.join(', ')}
            </span>
          </div>

          {/* Data Scope */}
          <div className="mb-4">
            <span className="text-xs font-medium text-muted-foreground">Data scope: </span>
            <span className="text-sm text-foreground">
              {decision.dataScope.join(', ')}
            </span>
          </div>

          {/* VERA Reasoning */}
          <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 mb-4">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">V</span>
            </div>
            <p className="text-sm text-foreground italic">
              "{decision.veraReasoning}"
            </p>
          </div>

          {/* Shadow Mode Badge & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {decision.shadowMode && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                  Shadow Mode
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove?.(decision.id)}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOverride?.(decision.id)}
              >
                Override
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => onAskVera?.(decision.id)}
              >
                Ask VERA
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Decision Badge */}
        <div className="flex flex-col items-end gap-4">
          <DecisionBadge
            recommendation={decision.recommendation}
            confidence={decision.confidence}
          />
          <span className="text-xs text-muted-foreground">
            {formatDate(decision.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DecisionCard;










