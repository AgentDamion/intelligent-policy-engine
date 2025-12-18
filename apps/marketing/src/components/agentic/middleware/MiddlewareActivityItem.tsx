import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { MiddlewareRequest } from './types';

interface MiddlewareActivityItemProps {
  request: MiddlewareRequest;
  isSelected: boolean;
  onClick: () => void;
}

export const MiddlewareActivityItem = ({
  request,
  isSelected,
  onClick,
}: MiddlewareActivityItemProps) => {
  const getDecisionBadge = (decision: string | null) => {
    if (decision === 'block') {
      return (
        <Badge variant="destructive" className="text-[11px]">
          <Shield className="h-3 w-3 mr-1" />
          Blocked
        </Badge>
      );
    }
    if (decision === 'warn') {
      return (
        <Badge className="text-[11px] bg-yellow-100 text-yellow-800 border-yellow-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    }
    return (
      <Badge className="text-[11px] bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Allowed
      </Badge>
    );
  };

  const getResponseTimeColor = (time: number | null) => {
    if (!time) return 'text-ink-500';
    if (time >= 500) return 'text-red-600';
    if (time >= 200) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCost = (cost: number | null) => {
    if (!cost) return '$0.0000';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left p-s3 border-b border-ink-100 hover:bg-surface-50 transition-colors',
        isSelected && 'bg-surface-50 border-l-2 border-l-ink-900'
      )}
    >
      <div className="flex items-center justify-between mb-s2">
        <span className="text-[12px] font-mono text-ink-500">
          {formatDistanceToNow(new Date(request.created_at || ''), { addSuffix: true })}
        </span>
        {getDecisionBadge(request.policy_decision)}
      </div>

      <div className="flex items-center gap-s2 mb-s2">
        <Badge variant="outline" className="text-[11px] font-mono">
          {request.model || 'unknown'}
        </Badge>
        <span className={clsx('text-[12px] font-mono', getResponseTimeColor(request.response_time_ms))}>
          {request.response_time_ms ? `${request.response_time_ms}ms` : '-'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-ink-600">
          {request.partner_id?.substring(0, 20) || 'Unknown Partner'}
        </span>
        <span className="text-[12px] font-mono text-ink-900">
          {formatCost(request.estimated_cost_usd)}
        </span>
      </div>
    </button>
  );
};
