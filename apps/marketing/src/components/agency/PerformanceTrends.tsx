import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { TrendData } from '@/hooks/useAgencyPerformance';

interface PerformanceTrendsProps {
  trends: TrendData[];
}

const chartConfig = {
  onTimeRate: {
    label: "On-Time Rate",
    color: "hsl(var(--brand-green))",
  },
  approvalRate: {
    label: "Approval Rate", 
    color: "hsl(var(--brand-teal))",
  },
  avgCycleTime: {
    label: "Avg Cycle Time",
    color: "hsl(var(--brand-orange))",
  },
};

export const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ trends }) => {
  // Transform data for the chart
  const chartData = trends.map(trend => ({
    period: trend.period.replace('Last ', '').replace(' days', 'd'),
    onTimeRate: trend.onTimeRate,
    approvalRate: trend.approvalRate,
    avgCycleTime: trend.avgCycleTime
  })).reverse(); // Reverse to show chronological order

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                domain={[0, 'dataMax']}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="onTimeRate"
                stroke="var(--color-onTimeRate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-onTimeRate)", strokeWidth: 2, r: 4 }}
                name="On-Time Rate (%)"
              />
              <Line
                type="monotone"
                dataKey="approvalRate"
                stroke="var(--color-approvalRate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-approvalRate)", strokeWidth: 2, r: 4 }}
                name="Approval Rate (%)"
              />
              <Line
                type="monotone"
                dataKey="avgCycleTime"
                stroke="var(--color-avgCycleTime)"
                strokeWidth={2}
                dot={{ fill: "var(--color-avgCycleTime)", strokeWidth: 2, r: 4 }}
                name="Cycle Time (days)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};