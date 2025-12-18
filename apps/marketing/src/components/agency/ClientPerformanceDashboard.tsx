import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';

interface ClientPerformanceMetrics {
  client_id: string;
  client_name: string;
  sla_performance: {
    on_time: number;
    late: number;
    overdue: number;
    average_response_time: number; // in hours
  };
  compliance_trends: {
    current_score: number;
    previous_score: number;
    trend: 'up' | 'down' | 'stable';
    frameworks: {
      name: string;
      score: number;
      status: 'compliant' | 'at_risk' | 'non_compliant';
    }[];
  };
  risk_indicators: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    trend: 'improving' | 'stable' | 'worsening';
  };
  activity_summary: {
    total_submissions: number;
    approved: number;
    rejected: number;
    pending: number;
  };
}

interface ClientPerformanceDashboardProps {
  selectedClientId?: string;
}

export const ClientPerformanceDashboard: React.FC<ClientPerformanceDashboardProps> = ({
  selectedClientId
}) => {
  const [performanceData, setPerformanceData] = useState<ClientPerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedClientId]);

  const fetchPerformanceData = async () => {
    try {
      // In production, this would fetch real performance data
      const sampleData: ClientPerformanceMetrics[] = [
        {
          client_id: '1',
          client_name: 'Pfizer Inc.',
          sla_performance: {
            on_time: 87,
            late: 10,
            overdue: 3,
            average_response_time: 18.5
          },
          compliance_trends: {
            current_score: 92,
            previous_score: 89,
            trend: 'up',
            frameworks: [
              { name: 'FDA 21 CFR Part 11', score: 95, status: 'compliant' },
              { name: 'GxP', score: 91, status: 'compliant' },
              { name: 'HIPAA', score: 88, status: 'at_risk' }
            ]
          },
          risk_indicators: {
            level: 'low',
            factors: ['Data encryption compliance', 'Access control protocols'],
            trend: 'improving'
          },
          activity_summary: {
            total_submissions: 45,
            approved: 38,
            rejected: 2,
            pending: 5
          }
        },
        {
          client_id: '2',
          client_name: 'Novartis AG',
          sla_performance: {
            on_time: 78,
            late: 18,
            overdue: 4,
            average_response_time: 28.2
          },
          compliance_trends: {
            current_score: 85,
            previous_score: 87,
            trend: 'down',
            frameworks: [
              { name: 'FDA', score: 88, status: 'compliant' },
              { name: 'EMA', score: 82, status: 'at_risk' },
              { name: 'ICH Guidelines', score: 85, status: 'compliant' }
            ]
          },
          risk_indicators: {
            level: 'medium',
            factors: ['Audit trail gaps', 'Version control issues'],
            trend: 'stable'
          },
          activity_summary: {
            total_submissions: 32,
            approved: 24,
            rejected: 4,
            pending: 4
          }
        }
      ];

      setPerformanceData(selectedClientId 
        ? sampleData.filter(d => d.client_id === selectedClientId)
        : sampleData
      );
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
      case 'worsening':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'at_risk': return 'text-yellow-600 bg-yellow-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Client Performance Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            SLA tracking, compliance trends, and risk identification
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {performanceData.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No performance data</h4>
              <p className="text-sm text-muted-foreground">
                Performance metrics will appear here once client activity is available
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        performanceData.map((client) => (
          <Card key={client.client_id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {client.client_name} Performance
              </CardTitle>
              <CardDescription>
                Comprehensive performance metrics and compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SLA Performance */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  SLA Performance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>On Time</span>
                      <span className="font-medium">{client.sla_performance.on_time}%</span>
                    </div>
                    <Progress value={client.sla_performance.on_time} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Late</span>
                      <span className="font-medium text-yellow-600">{client.sla_performance.late}%</span>
                    </div>
                    <Progress value={client.sla_performance.late} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overdue</span>
                      <span className="font-medium text-red-600">{client.sla_performance.overdue}%</span>
                    </div>
                    <Progress value={client.sla_performance.overdue} className="h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{client.sla_performance.average_response_time}h</div>
                    <div className="text-xs text-muted-foreground">Avg Response Time</div>
                  </div>
                </div>
              </div>

              {/* Compliance Trends */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Compliance Trends
                  {getTrendIcon(client.compliance_trends.trend)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Current Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{client.compliance_trends.current_score}%</span>
                        {client.compliance_trends.trend === 'up' && (
                          <Badge variant="outline" className="text-green-600">
                            +{client.compliance_trends.current_score - client.compliance_trends.previous_score}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={client.compliance_trends.current_score} className="h-3" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Framework Compliance</span>
                    {client.compliance_trends.frameworks.map((framework) => (
                      <div key={framework.name} className="flex items-center justify-between text-sm">
                        <span>{framework.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{framework.score}%</span>
                          <Badge variant="outline" className={getComplianceStatusColor(framework.status)}>
                            {framework.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Assessment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getRiskColor(client.risk_indicators.level)}>
                        {client.risk_indicators.level.toUpperCase()} RISK
                      </Badge>
                      {getTrendIcon(client.risk_indicators.trend)}
                    </div>
                    <div className="space-y-1">
                      {client.risk_indicators.factors.map((factor, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Activity Summary</span>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>Total: <span className="font-medium">{client.activity_summary.total_submissions}</span></div>
                      <div>Approved: <span className="font-medium text-green-600">{client.activity_summary.approved}</span></div>
                      <div>Rejected: <span className="font-medium text-red-600">{client.activity_summary.rejected}</span></div>
                      <div>Pending: <span className="font-medium text-yellow-600">{client.activity_summary.pending}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button size="sm" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Schedule Review
                </Button>
                <Button size="sm" variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Address Risks
                </Button>
                <Button size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};