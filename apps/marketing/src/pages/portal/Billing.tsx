import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, FileText, Calendar } from 'lucide-react';

const Billing: React.FC = () => {
  const billingData = {
    currentPlan: 'Professional',
    monthlyAmount: 299,
    nextBilling: '2024-02-15',
    paymentMethod: '•••• •••• •••• 4242',
    invoices: [
      { id: 'INV-2024-001', date: '2024-01-15', amount: 299, status: 'Paid' },
      { id: 'INV-2023-012', date: '2023-12-15', amount: 299, status: 'Paid' },
      { id: 'INV-2023-011', date: '2023-11-15', amount: 299, status: 'Paid' },
    ]
  };

  return (
    <StandardPageLayout
      title="Billing & Payments"
      description="Manage your subscription, payment methods, and billing history"
    >
      <div className="space-y-8">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active plan and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Plan</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {billingData.currentPlan}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Monthly Cost</label>
                  <p className="text-2xl font-bold mt-1">${billingData.monthlyAmount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Next Billing Date</label>
                  <p className="text-lg mt-1">{billingData.nextBilling}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4" />
                    <span>{billingData.paymentMethod}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Change Plan
                  </Button>
                  <Button variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>What's included in your Professional plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">AI Tools</h4>
                <p className="text-sm text-muted-foreground">Up to 50 AI tools</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Team Members</h4>
                <p className="text-sm text-muted-foreground">Up to 25 users</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Compliance Reports</h4>
                <p className="text-sm text-muted-foreground">Unlimited reports</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">API Access</h4>
                <p className="text-sm text-muted-foreground">Full API access</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Support</h4>
                <p className="text-sm text-muted-foreground">Priority support</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Storage</h4>
                <p className="text-sm text-muted-foreground">1TB evidence storage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View and download your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingData.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${invoice.amount}</p>
                      <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage-Based Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Track your usage against plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>AI Tool Assessments</span>
                <span className="font-medium">23 / 50</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Compliance Reports</span>
                <span className="font-medium">5 / Unlimited</span>
              </div>
              <div className="flex justify-between items-center">
                <span>API Calls</span>
                <span className="font-medium">1,247 / 10,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage Used</span>
                <span className="font-medium">234 GB / 1 TB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default Billing;