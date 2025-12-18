import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  AlertCircle,
  Download,
  Send,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useAdminKPIs } from '@/hooks/useAdminKPIs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Mock data for charts and tables
const revenueData = [
  { month: 'Jan', mrr: 720000, arr: 8640000 },
  { month: 'Feb', mrr: 735000, arr: 8820000 },
  { month: 'Mar', mrr: 752000, arr: 9024000 },
  { month: 'Apr', mrr: 768000, arr: 9216000 },
  { month: 'May', mrr: 785000, arr: 9420000 },
  { month: 'Jun', mrr: 802000, arr: 9624000 },
  { month: 'Jul', mrr: 820000, arr: 9840000 },
  { month: 'Aug', mrr: 838000, arr: 10056000 },
  { month: 'Sep', mrr: 847000, arr: 10164000 }
];

const subscriptionData = [
  { name: 'Active', value: 89, color: 'hsl(var(--success))' },
  { name: 'Churned', value: 12, color: 'hsl(var(--destructive))' },
  { name: 'Paused', value: 5, color: 'hsl(var(--muted))' }
];

const cashFlowData = [
  { month: 'Oct', projected: 920000, actual: 0 },
  { month: 'Nov', projected: 985000, actual: 0 },
  { month: 'Dec', projected: 1020000, actual: 0 },
  { month: 'Jan', projected: 1085000, actual: 0 },
  { month: 'Feb', projected: 1150000, actual: 0 },
  { month: 'Mar', projected: 1220000, actual: 0 }
];

const invoicesData = [
  { id: 'INV-2024-001', customer: 'Acme Pharmaceuticals', amount: '$25,000', status: 'Paid', dueDate: '2024-09-15' },
  { id: 'INV-2024-002', customer: 'Digital Health Agency', amount: '$15,000', status: 'Pending', dueDate: '2024-09-30' },
  { id: 'INV-2024-003', customer: 'Global Medical Corp', amount: '$35,000', status: 'Overdue', dueDate: '2024-09-10' },
  { id: 'INV-2024-004', customer: 'Innovation Labs', amount: '$12,000', status: 'Paid', dueDate: '2024-09-20' },
  { id: 'INV-2024-005', customer: 'MedTech Solutions', amount: '$28,000', status: 'Pending', dueDate: '2024-10-05' }
];

const subscriptionsData = [
  { customer: 'Acme Pharmaceuticals', plan: 'Enterprise Pro', mrr: '$25,000', nextBilling: '2024-10-15', status: 'Active' },
  { customer: 'Digital Health Agency', plan: 'Agency Plus', mrr: '$15,000', nextBilling: '2024-10-01', status: 'Active' },
  { customer: 'Global Medical Corp', plan: 'Enterprise Pro', mrr: '$35,000', nextBilling: '2024-10-10', status: 'Active' },
  { customer: 'Innovation Labs', plan: 'Startup', mrr: '$5,000', nextBilling: '2024-10-20', status: 'Paused' },
  { customer: 'MedTech Solutions', plan: 'Professional', mrr: '$18,000', nextBilling: '2024-10-25', status: 'Active' }
];

const failedPayments = [
  { customer: 'Innovation Labs', amount: '$5,000', reason: 'Insufficient funds', date: '2024-09-25' },
  { customer: 'StartUp Health', amount: '$3,200', reason: 'Card expired', date: '2024-09-23' }
];

const Finance: React.FC = () => {
  const kpis = useAdminKPIs();
  const [selectedPeriod, setSelectedPeriod] = useState('12M');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'Pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'Overdue':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'Active':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'Paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance & Billing</h1>
          <p className="text-muted-foreground">Revenue tracking, billing management, and financial analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.mrr)}</div>
            <p className="text-xs text-success">+12.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.arr)}</div>
            <p className="text-xs text-success">+18.2% year over year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$485K</div>
            <p className="text-xs text-success">+5.7% from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Churn Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1%</div>
            <p className="text-xs text-destructive">+0.3% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly Recurring Revenue over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'MRR']} />
                <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Current customer subscription breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Projection</CardTitle>
          <CardDescription>6-month revenue forecast and actual performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
              <Bar dataKey="projected" fill="hsl(var(--primary))" name="Projected" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Billing Management */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
          <CardDescription>Invoice tracking, subscriptions, and payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="invoices">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Invoices</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Send Reminder
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Invoice ID</th>
                      <th className="p-4 font-medium">Customer</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Due Date</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesData.map((invoice) => (
                      <tr key={invoice.id} className="border-b">
                        <td className="p-4">{invoice.id}</td>
                        <td className="p-4">{invoice.customer}</td>
                        <td className="p-4 font-semibold">{invoice.amount}</td>
                        <td className="p-4">{getStatusBadge(invoice.status)}</td>
                        <td className="p-4">{invoice.dueDate}</td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Customer Subscriptions</h3>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Plans
                </Button>
              </div>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Customer</th>
                      <th className="p-4 font-medium">Plan</th>
                      <th className="p-4 font-medium">MRR</th>
                      <th className="p-4 font-medium">Next Billing</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionsData.map((subscription, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">{subscription.customer}</td>
                        <td className="p-4">{subscription.plan}</td>
                        <td className="p-4 font-semibold">{subscription.mrr}</td>
                        <td className="p-4">{subscription.nextBilling}</td>
                        <td className="p-4">{getStatusBadge(subscription.status)}</td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Failed Payments</h3>
                <Button variant="outline" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Refund
                </Button>
              </div>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Customer</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Reason</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedPayments.map((payment, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">{payment.customer}</td>
                        <td className="p-4 font-semibold">{payment.amount}</td>
                        <td className="p-4">{payment.reason}</td>
                        <td className="p-4">{payment.date}</td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">Retry</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;