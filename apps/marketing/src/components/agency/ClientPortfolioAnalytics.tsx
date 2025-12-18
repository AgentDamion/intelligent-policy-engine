import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  Users, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  Target,
  Shield,
  Activity
} from 'lucide-react';

// Simplified interface for real integration
interface ClientCorrelation {
  clientId: string;
  clientName: string;
  correlation: number;
  riskLevel: string;
}

interface ClientPortfolioAnalyticsProps {
  selectedClientId?: string;
  clientCorrelations?: ClientCorrelation[];
}

const ClientPortfolioAnalytics: React.FC<ClientPortfolioAnalyticsProps> = ({ 
  selectedClientId,
  clientCorrelations = []
}) => {
  // Sample data for the real integration
  const portfolioMetrics = {
    totalClients: 12,
    activeSubmissions: 34,
    riskDistribution: [
      { name: 'Low Risk', value: 60, color: '#10b981' },
      { name: 'Medium Risk', value: 25, color: '#f59e0b' },
      { name: 'High Risk', value: 15, color: '#ef4444' }
    ],
    complianceScore: 87,
    slaPerformance: 92
  };

  const riskTrends = [
    { month: 'Jan', low: 65, medium: 20, high: 15 },
    { month: 'Feb', low: 62, medium: 23, high: 15 },
    { month: 'Mar', low: 60, medium: 25, high: 15 }
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{portfolioMetrics.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Submissions</p>
                <p className="text-2xl font-bold">{portfolioMetrics.activeSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{portfolioMetrics.complianceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">SLA Performance</p>
                <p className="text-2xl font-bold">{portfolioMetrics.slaPerformance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="correlations">Client Correlations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Current portfolio risk breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioMetrics.riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {portfolioMetrics.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Trends</CardTitle>
                <CardDescription>Monthly risk distribution changes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="low" stackId="a" fill="#10b981" />
                    <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="high" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>Detailed risk assessment across client portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-500">3</div>
                    <div className="text-sm text-muted-foreground">High Risk Clients</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-500">5</div>
                    <div className="text-sm text-muted-foreground">SLA Risks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-500">15</div>
                    <div className="text-sm text-muted-foreground">Compliant Tools</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations">
          <Card>
            <CardHeader>
              <CardTitle>Client Correlations</CardTitle>
              <CardDescription>Cross-client pattern analysis and correlations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientCorrelations.map((correlation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{correlation.clientName}</div>
                      <div className="text-sm text-muted-foreground">ID: {correlation.clientId}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Correlation</div>
                        <div className="font-semibold">{(correlation.correlation * 100).toFixed(0)}%</div>
                      </div>
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
                    No correlation data available. Run portfolio analysis to generate insights.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPortfolioAnalytics;