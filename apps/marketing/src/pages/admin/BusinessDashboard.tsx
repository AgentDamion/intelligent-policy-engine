import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity, 
  Building, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const BusinessDashboard: React.FC = () => {
  const businessMetrics = {
    monthlyRevenue: 47500,
    totalCustomers: 127,
    activeEnterprises: 89,
    churnRate: 2.3,
    avgDealSize: 2400,
    conversionRate: 12.8
  };

  const recentActivity = [
    { type: 'revenue', message: 'New enterprise subscription: Acme Corp', amount: '$2,400/mo', time: '2 hours ago' },
    { type: 'customer', message: 'Customer onboarding completed: TechStart Inc', time: '4 hours ago' },
    { type: 'alert', message: 'High usage alert: MedDevice Ltd approaching limits', time: '6 hours ago' },
    { type: 'success', message: 'Compliance audit passed: BioTech Solutions', time: '1 day ago' }
  ];

  return (
    <StandardPageLayout
      title="Business Dashboard"
      description="Executive overview of business metrics and operations"
    >
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${businessMetrics.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +8 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Enterprises</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.activeEnterprises}</div>
              <p className="text-xs text-muted-foreground">
                70% of total customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessMetrics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Above industry average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
              <CardDescription>Monthly recurring revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Enterprise Plan</span>
                  <div className="text-right">
                    <span className="font-medium">$32,500</span>
                    <Progress value={68} className="w-20 mt-1" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Professional Plan</span>
                  <div className="text-right">
                    <span className="font-medium">$12,000</span>
                    <Progress value={25} className="w-20 mt-1" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Starter Plan</span>
                  <div className="text-right">
                    <span className="font-medium">$3,000</span>
                    <Progress value={7} className="w-20 mt-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Health</CardTitle>
              <CardDescription>Customer status and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Healthy</span>
                  </div>
                  <span className="font-medium">92 customers</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>At Risk</span>
                  </div>
                  <span className="font-medium">23 customers</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Critical</span>
                  </div>
                  <span className="font-medium">12 customers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Business Activity
            </CardTitle>
            <CardDescription>Latest revenue and customer events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {activity.type === 'revenue' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {activity.type === 'customer' && <Users className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {activity.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{activity.time}</span>
                      {activity.amount && (
                        <Badge variant="default">{activity.amount}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                View All Customers
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue Analytics
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                System Operations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default BusinessDashboard;