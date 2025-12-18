import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';

// Simplified interface for real integration
interface PredictiveMetrics {
  slaBreachRisk: number;
  resourceNeeds: {
    estimatedReviewers: number;
    avgProcessingTimeHours: number;
  };
  bottleneckPredictions: Array<{
    stage: string;
    probability: number;
    impact: string;
  }>;
}

interface PredictiveInsightsPanelProps {
  predictiveMetrics?: PredictiveMetrics;
  isLoading?: boolean;
}

const PredictiveInsightsPanel: React.FC<PredictiveInsightsPanelProps> = ({ 
  predictiveMetrics,
  isLoading = false
}) => {
  // Default metrics if none provided
  const defaultMetrics: PredictiveMetrics = {
    slaBreachRisk: 15,
    resourceNeeds: {
      estimatedReviewers: 3,
      avgProcessingTimeHours: 24
    },
    bottleneckPredictions: [
      { stage: 'Initial Review', probability: 0.3, impact: 'medium' },
      { stage: 'Compliance Check', probability: 0.15, impact: 'low' }
    ]
  };

  const metrics = predictiveMetrics || defaultMetrics;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predictive Insights
          </CardTitle>
          <CardDescription>Loading AI predictions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">SLA Breach Risk</p>
                <p className="text-2xl font-bold">{metrics.slaBreachRisk}%</p>
                <Progress value={metrics.slaBreachRisk} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reviewers Needed</p>
                <p className="text-2xl font-bold">{metrics.resourceNeeds.estimatedReviewers}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {metrics.resourceNeeds.avgProcessingTimeHours}h per review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bottleneck Risk</p>
                <p className="text-2xl font-bold">
                  {Math.max(...metrics.bottleneckPredictions.map(b => b.probability * 100)).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Highest stage risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bottleneck Predictions
          </CardTitle>
          <CardDescription>AI-powered workflow bottleneck analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.bottleneckPredictions.map((prediction, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{prediction.stage}</div>
                  <div className="text-sm text-muted-foreground">
                    {(prediction.probability * 100).toFixed(0)}% probability
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    prediction.impact === 'high' ? 'destructive' :
                    prediction.impact === 'medium' ? 'secondary' : 'default'
                  }>
                    {prediction.impact} impact
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Resource Optimization
          </CardTitle>
          <CardDescription>AI recommendations for optimal resource allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Current resource allocation is optimal for next 48 hours. Consider adding 1 reviewer 
                for Tuesday peak load.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Utilization</span>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} />
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Optimal Utilization</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <Progress value={85} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveInsightsPanel;