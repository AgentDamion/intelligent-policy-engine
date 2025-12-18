import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useRiskAnalytics } from '@/hooks/useRiskAnalytics';
import { TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const RISK_COLORS = {
  Low: 'hsl(var(--brand-green))',
  Medium: 'hsl(var(--brand-orange))',
  High: 'hsl(var(--brand-coral))'
};

const chartConfig = {
  risk: {
    label: "Risk Score",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--secondary))",
  },
};

export const RiskScoreVisualization = ({ workspaceId }: { workspaceId?: string }) => {
  const { analytics, loading, error, refetch } = useRiskAnalytics(workspaceId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">Error loading risk analytics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const { totalSubmissions, averageRiskScore, riskDistribution, categoryBreakdown, trendData } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              {averageRiskScore < 30 ? (
                <TrendingDown className="w-5 h-5 text-green-500" />
              ) : averageRiskScore < 70 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-500" />
              )}
              <div>
                <div className="text-2xl font-bold">{Math.round(averageRiskScore)}</div>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {riskDistribution.map((risk) => (
          <Card key={risk.level}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold" style={{ color: RISK_COLORS[risk.level as keyof typeof RISK_COLORS] }}>
                {risk.count}
              </div>
              <p className="text-sm text-muted-foreground">{risk.level} Risk</p>
              <p className="text-xs text-muted-foreground">{Math.round(risk.percentage)}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="level"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS]} 
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Risk by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Risk Trend Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="avgRisk" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details Table */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Avg Score</th>
                    <th className="text-left p-2">Risk Level</th>
                    <th className="text-left p-2">Submissions</th>
                    <th className="text-left p-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((category, index) => {
                    const riskLevel = category.avgScore < 30 ? 'Low' : category.avgScore < 70 ? 'Medium' : 'High';
                    const riskColor = RISK_COLORS[riskLevel as keyof typeof RISK_COLORS];
                    
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{category.category}</td>
                        <td className="p-2">{Math.round(category.avgScore)}</td>
                        <td className="p-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: riskColor }}
                          >
                            {riskLevel}
                          </span>
                        </td>
                        <td className="p-2">{category.count}</td>
                        <td className="p-2">
                          {category.avgScore < 50 ? (
                            <TrendingDown className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};