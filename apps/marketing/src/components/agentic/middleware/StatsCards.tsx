import { TrendingUp, TrendingDown, Activity, Shield, Clock, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { MiddlewareStats } from './types';

interface StatsCardsProps {
  stats: MiddlewareStats;
  loading: boolean;
}

export const StatsCards = ({ stats, loading }: StatsCardsProps) => {
  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const getBlockRateColor = (rate: number) => {
    if (rate >= 20) return 'text-red-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getResponseTimeColor = (time: number) => {
    if (time >= 500) return 'text-red-600';
    if (time >= 200) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-s3 mb-s4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-s3 animate-pulse">
            <div className="h-4 bg-ink-200 rounded mb-s2 w-1/2" />
            <div className="h-6 bg-ink-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-s3 mb-s4">
      <Card className="p-s3 border border-ink-100">
        <div className="flex items-center gap-s2 mb-s1">
          <Activity className="h-4 w-4 text-ink-500" />
          <span className="text-[12px] font-mono text-ink-500">Total Requests</span>
        </div>
        <div className="text-[20px] font-semibold text-ink-900">
          {stats.totalRequests.toLocaleString()}
        </div>
      </Card>

      <Card className="p-s3 border border-ink-100">
        <div className="flex items-center gap-s2 mb-s1">
          <Shield className="h-4 w-4 text-ink-500" />
          <span className="text-[12px] font-mono text-ink-500">Block Rate</span>
        </div>
        <div className={`text-[20px] font-semibold ${getBlockRateColor(stats.blockRate)}`}>
          {stats.blockRate.toFixed(1)}%
        </div>
      </Card>

      <Card className="p-s3 border border-ink-100">
        <div className="flex items-center gap-s2 mb-s1">
          <Clock className="h-4 w-4 text-ink-500" />
          <span className="text-[12px] font-mono text-ink-500">Avg Response</span>
        </div>
        <div className={`text-[20px] font-semibold ${getResponseTimeColor(stats.avgResponseTime)}`}>
          {Math.round(stats.avgResponseTime)}ms
        </div>
      </Card>

      <Card className="p-s3 border border-ink-100">
        <div className="flex items-center gap-s2 mb-s1">
          <DollarSign className="h-4 w-4 text-ink-500" />
          <span className="text-[12px] font-mono text-ink-500">Total Cost</span>
        </div>
        <div className="text-[20px] font-semibold text-ink-900">
          {formatCost(stats.totalCost)}
        </div>
      </Card>
    </div>
  );
};
