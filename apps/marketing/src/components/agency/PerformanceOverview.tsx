import React from 'react';
import { MetricCard } from '@/components/common/MetricCard';
import { Clock, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import type { PerformanceMetrics } from '@/hooks/useAgencyPerformance';

interface PerformanceOverviewProps {
  metrics: PerformanceMetrics;
}

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ metrics }) => {
  const getOnTimeStatus = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'danger';
  };

  const getApprovalStatus = (rate: number) => {
    if (rate >= 85) return 'success';
    if (rate >= 70) return 'warning';
    return 'danger';
  };

  const getCycleTimeStatus = (days: number) => {
    if (days <= 5) return 'success';
    if (days <= 10) return 'warning';
    return 'danger';
  };

  // Calculate changes from historical data
  const getPerformanceChange = (current: number, historical: number) => {
    if (historical === 0) return { value: 0, type: 'neutral' as const };
    
    const change = ((current - historical) / historical) * 100;
    if (Math.abs(change) < 1) return { value: 0, type: 'neutral' as const };
    
    return {
      value: Math.abs(Math.round(change)),
      type: change > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  const lastPeriodData = metrics.historicalTrends.find(t => t.period === 'Last 7 days');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="On-Time Submission Rate"
        value={`${metrics.onTimeRate}%`}
        change={lastPeriodData ? {
          ...getPerformanceChange(metrics.onTimeRate, lastPeriodData.onTimeRate),
          period: 'last week'
        } : undefined}
        icon={<Clock className="h-4 w-4" />}
        description="Submissions delivered by deadline"
        status={getOnTimeStatus(metrics.onTimeRate)}
      />
      
      <MetricCard
        title="Approval Success Rate"
        value={`${metrics.approvalRate}%`}
        change={lastPeriodData ? {
          ...getPerformanceChange(metrics.approvalRate, lastPeriodData.approvalRate),
          period: 'last week'
        } : undefined}
        icon={<CheckCircle className="h-4 w-4" />}
        description="Submissions approved on first review"
        status={getApprovalStatus(metrics.approvalRate)}
      />
      
      <MetricCard
        title="Average Cycle Time"
        value={`${metrics.avgCycleTime} days`}
        change={lastPeriodData ? {
          ...getPerformanceChange(lastPeriodData.avgCycleTime, metrics.avgCycleTime), // Inverted for cycle time
          period: 'last week'
        } : undefined}
        icon={<TrendingUp className="h-4 w-4" />}
        description="From creation to final decision"
        status={getCycleTimeStatus(metrics.avgCycleTime)}
      />
      
      <MetricCard
        title="Total Submissions"
        value={metrics.totalSubmissions}
        icon={<BarChart3 className="h-4 w-4" />}
        description="All submissions this period"
        status="neutral"
      />
    </div>
  );
};