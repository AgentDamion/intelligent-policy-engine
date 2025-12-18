import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Shield, Users } from 'lucide-react';

const AnalyticsOverview = () => {
  // Sample data for analytics
  const toolUsageData = [
    { month: 'Jan', client1: 45, client2: 38, client3: 52 },
    { month: 'Feb', client1: 52, client2: 41, client3: 58 },
    { month: 'Mar', client1: 48, client2: 44, client3: 61 },
    { month: 'Apr', client1: 61, client2: 52, client3: 69 },
    { month: 'May', client1: 55, client2: 48, client3: 65 },
    { month: 'Jun', client1: 67, client2: 55, client3: 73 }
  ];

  const complianceScores = [
    { name: 'Acme Pharma', score: 94, trend: 'up' },
    { name: 'BioTech Corp', score: 87, trend: 'up' },
    { name: 'MediGen Labs', score: 91, trend: 'down' },
    { name: 'HealthTech Inc', score: 89, trend: 'up' }
  ];

  const approvalEfficiency = [
    { week: 'Week 1', avgDays: 3.2 },
    { week: 'Week 2', avgDays: 2.8 },
    { week: 'Week 3', avgDays: 2.1 },
    { week: 'Week 4', avgDays: 1.9 }
  ];

  const riskDistribution = [
    { name: 'Low Risk', value: 65, color: 'hsl(var(--chart-1))' },
    { name: 'Medium Risk', value: 28, color: 'hsl(var(--chart-2))' },
    { name: 'High Risk', value: 7, color: 'hsl(var(--chart-3))' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">90.3%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-34%</span> faster this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-xs text-muted-foreground">
              65% tools are low risk
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Tool Usage</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Tool Usage by Client</CardTitle>
              <CardDescription>Number of AI tools actively used across clients</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={toolUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="client1" fill="hsl(var(--chart-1))" name="Acme Pharma" />
                  <Bar dataKey="client2" fill="hsl(var(--chart-2))" name="BioTech Corp" />
                  <Bar dataKey="client3" fill="hsl(var(--chart-3))" name="MediGen Labs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Compliance Scores</CardTitle>
              <CardDescription>Current compliance ratings and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceScores.map((client) => (
                  <div key={client.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">Compliance Score</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={client.score >= 90 ? "default" : "secondary"}>
                        {client.score}%
                      </Badge>
                      {client.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool Approval Efficiency</CardTitle>
              <CardDescription>Average approval time trending downward</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={approvalEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgDays" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    name="Average Days"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Current risk profile across all managed tools</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsOverview;