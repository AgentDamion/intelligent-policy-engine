import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';

// Simplified interface for real integration
interface PerformanceTrend {
  timestamp: string;
  value: number;
  metric: string;
}

interface ClientCorrelation {
  clientId: string;
  clientName: string;
  correlation: number;
  riskLevel: string;
}

interface AdvancedAnalyticsChartsProps {
  performanceTrends: PerformanceTrend[];
  clientCorrelations: ClientCorrelation[];
  isLoading?: boolean;
}

export default function AdvancedAnalyticsCharts({ 
  performanceTrends, 
  clientCorrelations, 
  isLoading = false 
}: AdvancedAnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>Loading analytics...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Client Correlations
            </CardTitle>
            <CardDescription>Loading correlations...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Real-time agency performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">{trend.metric}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(trend.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{trend.value}%</div>
                  <Badge variant={trend.value > 80 ? 'default' : trend.value > 60 ? 'secondary' : 'destructive'}>
                    {trend.value > 80 ? 'Excellent' : trend.value > 60 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
            ))}
            {performanceTrends.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No performance data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Client Correlations
          </CardTitle>
          <CardDescription>Cross-client risk patterns and correlations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientCorrelations.map((correlation, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">{correlation.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {correlation.clientId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{(correlation.correlation * 100).toFixed(0)}%</div>
                  <Badge variant={
                    correlation.riskLevel === 'high' ? 'destructive' :
                    correlation.riskLevel === 'medium' ? 'secondary' : 'default'
                  }>
                    {correlation.riskLevel} risk
                  </Badge>
                </div>
              </div>
            ))}
            {clientCorrelations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No correlation data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}