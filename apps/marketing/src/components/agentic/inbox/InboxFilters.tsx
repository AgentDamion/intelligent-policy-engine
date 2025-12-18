import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { QuickViewFilter, StatusFilter, SeverityLevel, TimeFilter, InboxItemType } from './types';

interface InboxFiltersProps {
  quickView: QuickViewFilter;
  onQuickViewChange: (view: QuickViewFilter) => void;
  statusFilters: StatusFilter[];
  onStatusChange: (status: StatusFilter) => void;
  severityFilters: SeverityLevel[];
  onSeverityChange: (severity: SeverityLevel) => void;
  timeFilter: TimeFilter;
  onTimeChange: (time: TimeFilter) => void;
  itemCounts: Record<QuickViewFilter, number>;
}

const quickViews: { id: QuickViewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'proofs', label: 'Proofs' },
  { id: 'system', label: 'System' },
];

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_review', label: 'In Review' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'resolved', label: 'Resolved' },
];

const severityOptions: { id: SeverityLevel; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: 'bg-ink-300' },
  { id: 'medium', label: 'Medium', color: 'bg-[hsl(45_100%_51%)]' },
  { id: 'high', label: 'High', color: 'bg-[hsl(25_95%_53%)]' },
  { id: 'critical', label: 'Critical', color: 'bg-[hsl(0_84%_60%)]' },
];

const timeOptions: { id: TimeFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'last_7_days', label: 'Last 7 days' },
  { id: 'last_30_days', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom' },
];

export const InboxFilters = ({
  quickView,
  onQuickViewChange,
  statusFilters,
  onStatusChange,
  severityFilters,
  onSeverityChange,
  timeFilter,
  onTimeChange,
  itemCounts,
}: InboxFiltersProps) => {
  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-ink-100 bg-surface-0 overflow-y-auto p-s4">
      {/* Quick Views */}
      <div className="mb-s6">
        <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
          Quick Views
        </h3>
        <div className="grid grid-cols-2 gap-s2">
          {quickViews.map((view) => (
            <button
              key={view.id}
              onClick={() => onQuickViewChange(view.id)}
              className={clsx(
                'px-s3 py-s2 text-[12px] font-medium rounded-r1 border transition-colors text-left',
                quickView === view.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-white text-ink-700 border-ink-200 hover:bg-surface-50'
              )}
            >
              <div>{view.label}</div>
              <div className={clsx('text-[11px] font-mono', quickView === view.id ? 'text-primary-foreground/80' : 'text-ink-400')}>
                {itemCounts[view.id] || 0}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="mb-s6">
        <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
          Status
        </h3>
        <div className="space-y-s2">
          {statusOptions.map((status) => (
            <label
              key={status.id}
              className="flex items-center gap-s2 cursor-pointer hover:bg-surface-50 px-s2 py-s1 rounded-r1 transition-colors"
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center',
                  statusFilters.includes(status.id)
                    ? 'bg-ink-900 border-ink-900'
                    : 'bg-white border-ink-300'
                )}
              >
                {statusFilters.includes(status.id) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={statusFilters.includes(status.id)}
                onChange={() => onStatusChange(status.id)}
                className="sr-only"
              />
              <span className="text-[13px] text-ink-700">{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="mb-s6">
        <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
          Severity
        </h3>
        <div className="space-y-s2">
          {severityOptions.map((severity) => (
            <label
              key={severity.id}
              className="flex items-center gap-s2 cursor-pointer hover:bg-surface-50 px-s2 py-s1 rounded-r1 transition-colors"
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center',
                  severityFilters.includes(severity.id)
                    ? 'bg-ink-900 border-ink-900'
                    : 'bg-white border-ink-300'
                )}
              >
                {severityFilters.includes(severity.id) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={severityFilters.includes(severity.id)}
                onChange={() => onSeverityChange(severity.id)}
                className="sr-only"
              />
              <div className={clsx('w-2 h-2 rounded-full', severity.color)} />
              <span className="text-[13px] text-ink-700">{severity.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="mb-s6">
        <h3 className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide mb-s3">
          Time
        </h3>
        <div className="space-y-s2">
          {timeOptions.map((time) => (
            <label
              key={time.id}
              className="flex items-center gap-s2 cursor-pointer hover:bg-surface-50 px-s2 py-s1 rounded-r1 transition-colors"
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded-full border flex items-center justify-center',
                  timeFilter === time.id
                    ? 'border-ink-900 border-[5px]'
                    : 'bg-white border-ink-300'
                )}
              />
              <input
                type="radio"
                name="time"
                checked={timeFilter === time.id}
                onChange={() => onTimeChange(time.id)}
                className="sr-only"
              />
              <span className="text-[13px] text-ink-700">{time.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};
