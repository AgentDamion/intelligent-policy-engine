import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ConflictAnalytics } from '@/hooks/useConflictDetection';

interface ConflictAnalyticsChartProps {
  analytics: ConflictAnalytics;
}

const severityColors = {
  high: 'hsl(var(--destructive))',
  medium: 'hsl(var(--brand-orange))',
  low: 'hsl(var(--brand-green))'
};

const statusColors = {
  open: 'hsl(var(--destructive))',
  in_progress: 'hsl(var(--brand-orange))',
  resolved: 'hsl(var(--brand-green))',
  dismissed: 'hsl(var(--muted-foreground))'
};

const chartConfig = {
  severity: {
    label: "Severity Breakdown",
  },
  type: {
    label: "Conflict Types",
  },
};

export const ConflictAnalyticsChart: React.FC<ConflictAnalyticsChartProps> = ({ analytics }) => {
  const { summary } = analytics;

  // Prepare severity data for pie chart
  const severityData = [
    { name: 'High', value: summary.by_severity.high, color: severityColors.high },
    { name: 'Medium', value: summary.by_severity.medium, color: severityColors.medium },
    { name: 'Low', value: summary.by_severity.low, color: severityColors.low },
  ].filter(item => item.value > 0);

  // Prepare type data for bar chart
  const typeData = Object.entries(summary.by_type).map(([type, count]) => ({
    type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count,
  }));

  // Prepare status distribution for donut chart
  const statusData = [
    { name: 'Open', value: summary.open, color: statusColors.open },
    { name: 'In Progress', value: summary.in_progress, color: statusColors.in_progress },
    { name: 'Resolved', value: summary.resolved, color: statusColors.resolved },
    { name: 'Dismissed', value: summary.dismissed, color: statusColors.dismissed },
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Resolution Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Conflict Types */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Conflict Types Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="type" 
                  className="text-xs fill-muted-foreground"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--brand-teal))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};