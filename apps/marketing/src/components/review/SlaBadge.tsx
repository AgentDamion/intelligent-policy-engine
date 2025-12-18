import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { slaUtils } from '@/lib/sla/sla';

interface SlaBadgeProps {
  submittedAt: string;
  slaHours: number;
  atRisk?: boolean;
  clientTimezone?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  submittedAt,
  slaHours,
  atRisk = false,
  clientTimezone = 'UTC'
}) => {
  const { timeRemaining, isBreached, urgencyLevel } = slaUtils.computeBreach(
    submittedAt,
    slaHours,
    clientTimezone
  );

  const getBadgeVariant = () => {
    if (isBreached) return 'destructive';
    if (atRisk || urgencyLevel === 'urgent') return 'destructive';
    if (urgencyLevel === 'warning') return 'secondary';
    return 'outline';
  };

  const getBadgeContent = () => {
    if (isBreached) {
      return (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          SLA Breached
        </div>
      );
    }

    if (atRisk) {
      return (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          At Risk ({timeRemaining})
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {timeRemaining}
      </div>
    );
  };

  return (
    <Badge variant={getBadgeVariant()} className="text-xs">
      {getBadgeContent()}
    </Badge>
  );
};