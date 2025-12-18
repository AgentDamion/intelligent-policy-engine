import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Key, Activity, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { StatsCards } from './StatsCards';
import type { FilterTimeRange, QuickViewFilter } from './types';
import { useMiddlewareStats } from '@/hooks/useMiddlewareStats';
import { clsx } from 'clsx';

interface MiddlewareFiltersProps {
  timeRange: FilterTimeRange;
  onTimeRangeChange: (range: FilterTimeRange) => void;
  quickView: QuickViewFilter;
  onQuickViewChange: (view: QuickViewFilter) => void;
  onManageKeys: () => void;
}

export const MiddlewareFilters = ({
  timeRange,
  onTimeRangeChange,
  quickView,
  onQuickViewChange,
  onManageKeys,
}: MiddlewareFiltersProps) => {
  const { stats, loading } = useMiddlewareStats(timeRange);

  const timeRanges: { value: FilterTimeRange; label: string }[] = [
    { value: 'hour', label: 'Last Hour' },
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
  ];

  const quickViews: { value: QuickViewFilter; label: string; icon: any; count?: number }[] = [
    { value: 'all', label: 'All Activity', icon: Activity },
    { value: 'blocked', label: 'Blocked', icon: Shield, count: stats.requestsByDecision.find(d => d.decision === 'block')?.count },
    { value: 'warned', label: 'Warnings', icon: AlertTriangle, count: stats.requestsByDecision.find(d => d.decision === 'warn')?.count },
    { value: 'allowed', label: 'Allowed', icon: CheckCircle, count: stats.requestsByDecision.find(d => d.decision === 'allow')?.count },
    { value: 'slow', label: 'Slow (>500ms)', icon: Clock },
  ];

  return (
    <div className="w-[280px] border-r border-ink-100 bg-surface-0 p-s4 flex flex-col">
      <div className="mb-s4">
        <h2 className="text-[14px] font-semibold text-ink-900 mb-s3">Middleware Activity</h2>
        <Button
          onClick={onManageKeys}
          className="w-full"
          variant="outline"
          size="sm"
        >
          <Key className="h-4 w-4 mr-s2" />
          Manage API Keys
        </Button>
      </div>

      <StatsCards stats={stats} loading={loading} />

      <div className="mb-s4">
        <h3 className="text-[12px] font-mono text-ink-500 mb-s2 uppercase">Time Range</h3>
        <div className="space-y-s1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange(range.value)}
              className={clsx(
                'w-full text-left px-s2 py-s1 rounded-r1 text-[13px] transition-colors',
                timeRange === range.value
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:bg-surface-50'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-mono text-ink-500 mb-s2 uppercase">Quick Views</h3>
        <div className="space-y-s1">
          {quickViews.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.value}
                onClick={() => onQuickViewChange(view.value)}
                className={clsx(
                  'w-full flex items-center justify-between px-s2 py-s1 rounded-r1 text-[13px] transition-colors',
                  quickView === view.value
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-600 hover:bg-surface-50'
                )}
              >
                <span className="flex items-center gap-s2">
                  <Icon className="h-3.5 w-3.5" />
                  {view.label}
                </span>
                {view.count !== undefined && (
                  <span className="text-[11px] font-mono">{view.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
