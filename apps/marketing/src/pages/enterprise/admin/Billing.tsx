import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Calendar, DollarSign } from 'lucide-react';

const EnterpriseBilling: React.FC = () => {
  const billingData = {
    currentPlan: 'Enterprise Pro',
    monthlyAmount: 2499,
    nextBilling: '2024-02-15',
    paymentMethod: '**** **** **** 4321',
    invoices: [
      { id: 'INV-2024-001', date: '2024-01-15', amount: 2499, status: 'paid' },
      { id: 'INV-2023-012', date: '2023-12-15', amount: 2499, status: 'paid' },
      { id: 'INV-2023-011', date: '2023-11-15', amount: 2499, status: 'paid' },
    ]
  };

  return (
    <StandardPageLayout
      title="Enterprise Billing"
      description="Manage your enterprise subscription, payment methods, and billing history"
    >
      <div className="space-y-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active enterprise plan and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold">{billingData.currentPlan}</p>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Monthly Amount</label>
                <p className="text-2xl font-bold mt-1">${billingData.monthlyAmount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Next Billing Date</label>
                <p className="text-lg mt-1">{billingData.nextBilling}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Credit Card</p>
                  <span className="text-sm text-muted-foreground">{billingData.paymentMethod}</span>
                </div>
              </div>
              <Button variant="outline">Update Payment Method</Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View and download past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingData.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">${invoice.amount}</span>
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

        {/* Usage Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Summary</CardTitle>
            <CardDescription>Current month usage and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">API Calls</label>
                <p className="text-2xl font-bold mt-1">42,847</p>
                <p className="text-sm text-muted-foreground">of 100,000 limit</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Active Users</label>
                <p className="text-2xl font-bold mt-1">127</p>
                <p className="text-sm text-muted-foreground">of 500 limit</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Storage Used</label>
                <p className="text-2xl font-bold mt-1">8.4 GB</p>
                <p className="text-sm text-muted-foreground">of 50 GB limit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default EnterpriseBilling;