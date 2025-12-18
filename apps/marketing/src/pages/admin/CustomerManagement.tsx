import React, { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Building, 
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const customers = [
    {
      id: 1,
      name: 'Acme Pharmaceuticals',
      email: 'admin@acmepharma.com',
      plan: 'Enterprise',
      status: 'Active',
      users: 25,
      mrr: 2400,
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      health: 'Healthy'
    },
    {
      id: 2,
      name: 'TechStart Inc',
      email: 'contact@techstart.com',
      plan: 'Professional',
      status: 'Active',
      users: 12,
      mrr: 299,
      joinDate: '2024-01-20',
      lastActive: '1 day ago',
      health: 'Healthy'
    },
    {
      id: 3,
      name: 'MedDevice Ltd',
      email: 'it@meddevice.com',
      plan: 'Professional',
      status: 'Active',
      users: 18,
      mrr: 299,
      joinDate: '2023-12-10',
      lastActive: '3 days ago',
      health: 'At Risk'
    },
    {
      id: 4,
      name: 'BioTech Solutions',
      email: 'admin@biotech.com',
      plan: 'Enterprise',
      status: 'Active',
      users: 45,
      mrr: 2400,
      joinDate: '2023-11-05',
      lastActive: '1 hour ago',
      health: 'Healthy'
    },
    {
      id: 5,
      name: 'StartupCorp',
      email: 'team@startup.com',
      plan: 'Starter',
      status: 'Trial',
      users: 5,
      mrr: 0,
      joinDate: '2024-01-25',
      lastActive: '5 days ago',
      health: 'Critical'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'Trial':
        return <Badge variant="secondary">Trial</Badge>;
      case 'Suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'Healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'At Risk':
        return <Badge variant="default" className="bg-yellow-500">At Risk</Badge>;
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{health}</Badge>;
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StandardPageLayout
      title="Customer Management"
      description="Manage enterprise customers, subscriptions, and account health"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Database
            </CardTitle>
            <CardDescription>Manage all customer accounts and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Building className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(customer.status)}
                      {getHealthBadge(customer.health)}
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <label className="text-xs text-muted-foreground">Plan</label>
                      <p className="font-medium">{customer.plan}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Users</label>
                      <p className="font-medium">{customer.users}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">MRR</label>
                      <p className="font-medium">${customer.mrr}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Last Active</label>
                      <p className="font-medium">{customer.lastActive}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                +3 this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter(c => c.status === 'Active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((customers.filter(c => c.status === 'Active').length / customers.length) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${customers.reduce((sum, c) => sum + c.mrr, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly recurring revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((customers.filter(c => c.health === 'Healthy').length / customers.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Healthy customers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default CustomerManagement;