import React, { useState } from 'react';
import { useRiskAnalytics } from '@/hooks/useRiskAnalytics';
import { useComplianceDecisions } from '@/hooks/useComplianceDecisions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, Target, Users, FileText, Activity } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const AnalyticsDashboard = () => {
  const { analytics, loading: analyticsLoading } = useRiskAnalytics();
  const { decisions, loading: decisionsLoading } = useComplianceDecisions();
  const [timeRange, setTimeRange] = useState('30d');

  const loading = analyticsLoading || decisionsLoading;

  // Calculate key metrics
  const totalSubmissions = decisions.length;
  const approvedCount = decisions.filter(d => d.status === 'approved').length;
  const rejectedCount = decisions.filter(d => d.status === 'rejected').length;
  const pendingCount = decisions.filter(d => d.status === 'submitted' || d.status === 'under_review').length;
  
  const approvalRate = totalSubmissions > 0 ? (approvedCount / totalSubmissions * 100) : 0;
  const avgRiskScore = analytics?.averageRiskScore || 0;

  // Mock trend data - in real app, this would come from analytics
  const trendData = [
    { month: 'Jan', submissions: 45, approved: 38, rejected: 7 },
    { month: 'Feb', submissions: 52, approved: 44, rejected: 8 },
    { month: 'Mar', submissions: 61, approved: 54, rejected: 7 },
    { month: 'Apr', submissions: 58, approved: 52, rejected: 6 },
    { month: 'May', submissions: 67, approved: 61, rejected: 6 },
    { month: 'Jun', submissions: 73, approved: 68, rejected: 5 },
  ];

  const riskDistributionData = analytics?.riskDistribution ? [
    { name: 'Low Risk (1-3)', value: analytics.riskDistribution.find(r => r.level === 'low')?.count || 0, count: analytics.riskDistribution.find(r => r.level === 'low')?.count || 0 },
    { name: 'Medium Risk (4-6)', value: analytics.riskDistribution.find(r => r.level === 'medium')?.count || 0, count: analytics.riskDistribution.find(r => r.level === 'medium')?.count || 0 },
    { name: 'High Risk (7-10)', value: analytics.riskDistribution.find(r => r.level === 'high')?.count || 0, count: analytics.riskDistribution.find(r => r.level === 'high')?.count || 0 },
  ] : [];

  const categoryData = analytics?.categoryBreakdown ? Object.entries(analytics.categoryBreakdown).map(([category, score]) => ({
    category,
    score: typeof score === 'number' ? score : 0
  })) : [];

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                  {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {change}
                </Badge>
              )}
            </div>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Compliance metrics, approval rates, and performance insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Submissions"
          value={totalSubmissions}
          change="+12%"
          trend="up"
          icon={FileText}
        />
        <MetricCard
          title="Approval Rate"
          value={`${approvalRate.toFixed(1)}%`}
          change="+5.2%"
          trend="up"
          icon={CheckCircle}
        />
        <MetricCard
          title="Avg Risk Score"
          value={avgRiskScore.toFixed(1)}
          change="-0.3"
          trend="up"
          icon={Target}
        />
        <MetricCard
          title="Avg Review Time"
          value="2.3 days"
          change="-0.5d"
          trend="up"
          icon={Clock}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Submission Trends</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="partners">Partner Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submission Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Approval vs Rejection Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Approval vs Rejection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="approved" stroke="hsl(var(--chart-2))" strokeWidth={3} name="Approved" />
                    <Line type="monotone" dataKey="rejected" stroke="hsl(var(--destructive))" strokeWidth={3} name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  <div className="text-2xl font-bold text-success">{approvedCount}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
                  <div className="text-2xl font-bold text-warning">{pendingCount}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{totalSubmissions}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Risk Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Risk by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 10]} />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Review Time</span>
                    <span className="font-medium">2.3 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fastest Review</span>
                    <span className="font-medium">4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">SLA Compliance</span>
                    <span className="font-medium text-success">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decision Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">AI Agreement Rate</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Appeals Rate</span>
                    <span className="font-medium">2.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Policy Accuracy</span>
                    <span className="font-medium text-success">96%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Reviewers</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Load per Reviewer</span>
                    <span className="font-medium">3.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Queue Balance</span>
                    <span className="font-medium text-success">Good</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Partner Analytics</h3>
                <p className="text-muted-foreground">
                  Detailed partner performance metrics and submission quality analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};