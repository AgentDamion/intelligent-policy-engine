import React from 'react';
import { MetricCard } from '@/components/common/MetricCard';
import { AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import type { ConflictAnalytics } from '@/hooks/useConflictDetection';

interface ConflictOverviewProps {
  analytics: ConflictAnalytics;
}

export const ConflictOverview: React.FC<ConflictOverviewProps> = ({ analytics }) => {
  const { summary, trending } = analytics;

  const getConflictStatus = (total: number) => {
    if (total === 0) return 'success';
    if (total <= 2) return 'warning';
    return 'danger';
  };

  const getSeverityStatus = (high: number) => {
    if (high === 0) return 'success';
    if (high <= 1) return 'warning';
    return 'danger';
  };

  const getResolutionStatus = (avg: number) => {
    if (avg <= 3) return 'success';
    if (avg <= 7) return 'warning';
    return 'danger';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Active Conflicts"
        value={summary.open}
        change={{
          value: trending.new_this_week,
          type: trending.new_this_week > 0 ? 'increase' : 'neutral',
          period: 'this week'
        }}
        icon={<AlertTriangle className="h-4 w-4" />}
        description={`${summary.in_progress} in progress`}
        status={getConflictStatus(summary.open)}
      />
      
      <MetricCard
        title="High Severity"
        value={summary.by_severity.high}
        icon={<TrendingUp className="h-4 w-4" />}
        description={`${summary.by_severity.medium} medium, ${summary.by_severity.low} low`}
        status={getSeverityStatus(summary.by_severity.high)}
      />
      
      <MetricCard
        title="Avg Resolution Time"
        value={`${trending.avg_resolution_time} days`}
        change={{
          value: 15,
          type: 'decrease',
          period: 'last month'
        }}
        icon={<Clock className="h-4 w-4" />}
        description="Time to resolve conflicts"
        status={getResolutionStatus(trending.avg_resolution_time)}
      />
      
      <MetricCard
        title="Resolved This Week"
        value={trending.resolved_this_week}
        change={{
          value: 25,
          type: 'increase',
          period: 'vs last week'
        }}
        icon={<CheckCircle className="h-4 w-4" />}
        description={`${summary.resolved} total resolved`}
        status="success"
      />
    </div>
  );
};