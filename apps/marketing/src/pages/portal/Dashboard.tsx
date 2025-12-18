import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, Users, Shield, Calendar, Download } from 'lucide-react';

const PortalDashboard: React.FC = () => {
  const usageData = {
    currentPlan: 'Professional',
    aiToolsUsed: 23,
    totalLimit: 50,
    complianceScore: 94,
    activeUsers: 8,
    billingCycle: 'Monthly',
    nextBilling: '2024-02-15'
  };

  return (
    <StandardPageLayout
      title="Customer Portal"
      description="Manage your account, billing, and usage analytics"
    >
      <div className="space-y-8">
        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.currentPlan}</div>
              <p className="text-xs text-muted-foreground">
                Billing {usageData.billingCycle.toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Tools Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.aiToolsUsed}/{usageData.totalLimit}</div>
              <Progress value={(usageData.aiToolsUsed / usageData.totalLimit) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.complianceScore}%</div>
              <Badge variant="default" className="mt-2">Excellent</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Invite Team Members
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest compliance and usage activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Tool Compliance Check</p>
                  <p className="text-sm text-muted-foreground">ChatGPT-4 - Passed all requirements</p>
                </div>
                <Badge variant="default">Passed</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Policy Update</p>
                  <p className="text-sm text-muted-foreground">Data Privacy Policy v2.1 distributed</p>
                </div>
                <Badge variant="outline">Updated</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Team Member Added</p>
                  <p className="text-sm text-muted-foreground">Sarah Johnson joined as Compliance Manager</p>
                </div>
                <Badge variant="secondary">New</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Information
            </CardTitle>
            <CardDescription>Next billing cycle and payment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Next billing date:</span>
                <span className="font-medium">{usageData.nextBilling}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Current plan:</span>
                <Badge variant="default">{usageData.currentPlan}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment method:</span>
                <span className="font-medium">•••• •••• •••• 4242</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default PortalDashboard;