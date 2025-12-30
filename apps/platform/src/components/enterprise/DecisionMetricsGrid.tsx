import React from 'react';
import { StatCard } from './StatCard';
import { cn } from '@/lib/utils';

interface DecisionMetrics {
  totalDecisions: number;
  approvalRate: number;
  avgConfidence: number;
  pendingReview: number;
  proofBundles: number;
  avgTime: string; // e.g., "2.3 min"
}

interface DecisionMetricsGridProps {
  metrics: DecisionMetrics;
  className?: string;
}

// Get confidence color
const getConfidenceColor = (score: number): string => {
  if (score > 90) return 'bg-status-approved';
  if (score >= 70) return 'bg-status-escalated';
  return 'bg-status-denied';
};

export const DecisionMetricsGrid: React.FC<DecisionMetricsGridProps> = ({
  metrics,
  className,
}) => {
  const approvalRateHighlight = metrics.approvalRate > 70;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4', className)}>
      {/* Total Decisions */}
      <StatCard
        title="Total Decisions"
        value={metrics.totalDecisions.toString()}
        subtext="This month"
      />

      {/* Approval Rate */}
      <StatCard
        title="Approval Rate"
        value={`${Math.round(metrics.approvalRate)}%`}
        delta={
          metrics.approvalRate > 70
            ? { dir: 'up', value: `vs ${Math.round(metrics.approvalRate - 5)}% last month` }
            : undefined
        }
        highlight={approvalRateHighlight}
        subtext={approvalRateHighlight ? 'Above threshold' : undefined}
      />

      {/* Avg Confidence */}
      <StatCard
        title="Avg Confidence"
        value={`${Math.round(metrics.avgConfidence)}%`}
        subtext={
          <span className="flex items-center gap-2">
            <span className={cn('w-2 h-2', getConfidenceColor(metrics.avgConfidence))} />
            {metrics.avgConfidence > 90
              ? 'High confidence'
              : metrics.avgConfidence >= 70
              ? 'Moderate confidence'
              : 'Low confidence'}
          </span>
        }
      />

      {/* Pending Review */}
      <StatCard
        title="Pending Review"
        value={metrics.pendingReview.toString()}
        tone={metrics.pendingReview > 0 ? 'warning' : 'default'}
        subtext="Requires action"
      />

      {/* Proof Bundles */}
      <StatCard
        title="Proof Bundles"
        value={metrics.proofBundles.toString()}
        subtext="Generated"
      />

      {/* Avg Time */}
      <StatCard
        title="Avg Time"
        value={metrics.avgTime}
        subtext="Per decision"
      />
    </div>
  );
};

