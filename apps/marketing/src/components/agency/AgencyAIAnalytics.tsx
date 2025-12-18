import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAgencyAIAnalytics } from '@/hooks/useAgencyAIAnalytics';
import PredictiveInsightsPanel from './PredictiveInsightsPanel';
import AdvancedAnalyticsCharts from './AdvancedAnalyticsCharts';
import ClientPortfolioAnalytics from './ClientPortfolioAnalytics';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Brain, Zap } from 'lucide-react';

interface AgencyAIAnalyticsProps {
  enterpriseId: string;
}

export const AgencyAIAnalytics: React.FC<AgencyAIAnalyticsProps> = ({ enterpriseId }) => {
  const { analyticsData, loading, error } = useAgencyAIAnalytics(enterpriseId);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agency AI Analytics
            </CardTitle>
            <CardDescription>Loading AI-powered insights...</CardDescription>
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to load analytics data</p>
            <p className="text-sm text-red-500 mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple risk calculation based on available data
  const riskLevel = analyticsData.predictiveMetrics.slaBreachRisk > 20 ? 'high' : 
                   analyticsData.predictiveMetrics.slaBreachRisk > 10 ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">SLA Risk</p>
                <p className="text-2xl font-bold">{analyticsData.predictiveMetrics.slaBreachRisk}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">{analyticsData.performanceTrends.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">AI Insights</p>
                <p className="text-2xl font-bold">{analyticsData.realtimeInsights.opportunityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Automation</p>
                <p className="text-2xl font-bold">{analyticsData.realtimeInsights.automationPotential}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alert */}
      {riskLevel === 'high' && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-red-800">High Risk Alert</p>
                <p className="text-sm text-red-600">
                  SLA breach risk is elevated. Consider reallocating resources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="charts">Advanced Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <PredictiveInsightsPanel 
            predictiveMetrics={analyticsData.predictiveMetrics}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value="portfolio">
          <ClientPortfolioAnalytics 
            clientCorrelations={analyticsData.clientCorrelations}
          />
        </TabsContent>

        <TabsContent value="charts">
          <AdvancedAnalyticsCharts 
            performanceTrends={analyticsData.performanceTrends}
            clientCorrelations={analyticsData.clientCorrelations}
            isLoading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};