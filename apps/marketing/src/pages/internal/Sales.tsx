import React, { useState } from 'react';
import { Search, Filter, Plus, Phone, Mail, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'lead' | 'prospect' | 'active' | 'churned';
  healthScore: number;
  lastActivity: string;
  mrr: number;
  complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
  aiToolsCount: number;
  lastContact: string;
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    company: 'PharmaTech Solutions',
    email: 'sarah.j@pharmatech.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    healthScore: 92,
    lastActivity: '2 hours ago',
    mrr: 15000,
    complianceStatus: 'compliant',
    aiToolsCount: 12,
    lastContact: '2024-01-15'
  },
  {
    id: '2',
    name: 'Mike Chen',
    company: 'BioInnovate Corp',
    email: 'mike.chen@bioinnovate.com',
    phone: '+1 (555) 987-6543',
    status: 'prospect',
    healthScore: 78,
    lastActivity: '1 day ago',
    mrr: 0,
    complianceStatus: 'at-risk',
    aiToolsCount: 3,
    lastContact: '2024-01-14'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    company: 'MedTech Dynamics',
    email: 'e.rodriguez@medtechdyn.com',
    phone: '+1 (555) 456-7890',
    status: 'active',
    healthScore: 85,
    lastActivity: '5 hours ago',
    mrr: 25000,
    complianceStatus: 'compliant',
    aiToolsCount: 18,
    lastContact: '2024-01-13'
  }
];

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'churned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales & Customer Management</h1>
          <p className="text-muted-foreground">Manage customer relationships and sales pipeline</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.8M</div>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">63</div>
            <p className="text-xs text-blue-600">+5 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-green-600">+2 points</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Customer Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="health">Customer Health</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Manage and track all customer relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>AI Tools</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.company}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getHealthScoreIcon(customer.healthScore)}
                          {customer.healthScore}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.mrr > 0 ? `$${customer.mrr.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getComplianceColor(customer.complianceStatus)}>
                          {customer.complianceStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.aiToolsCount}</TableCell>
                      <TableCell>{customer.lastActivity}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Track prospects through the sales funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Leads (45)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">TechCorp Inc</div>
                      <div className="text-xs text-muted-foreground">$50K potential</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">DataFlow Systems</div>
                      <div className="text-xs text-muted-foreground">$75K potential</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Qualified (23)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-blue-50">
                      <div className="font-medium text-sm">InnoMed Labs</div>
                      <div className="text-xs text-muted-foreground">$120K potential</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Proposal (12)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-yellow-50">
                      <div className="font-medium text-sm">HealthTech Pro</div>
                      <div className="text-xs text-muted-foreground">$200K potential</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Closed (8)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-green-50">
                      <div className="font-medium text-sm">MedCore Solutions</div>
                      <div className="text-xs text-muted-foreground">$180K closed</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Health Dashboard</CardTitle>
              <CardDescription>Monitor customer satisfaction and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <h3 className="font-medium text-green-600">Healthy Customers (85%)</h3>
                  <div className="space-y-2">
                    {mockCustomers.filter(c => c.healthScore >= 80).map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">{customer.company}</span>
                        <span className="text-sm font-medium">{customer.healthScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-yellow-600">At Risk (12%)</h3>
                  <div className="space-y-2">
                    {mockCustomers.filter(c => c.healthScore >= 60 && c.healthScore < 80).map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <span className="text-sm">{customer.company}</span>
                        <span className="text-sm font-medium">{customer.healthScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-red-600">Critical (3%)</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">No critical customers</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
              <CardDescription>Track all customer interactions and touchpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Mail className="h-5 w-5 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Email sent to PharmaTech Solutions</div>
                      <div className="text-sm text-muted-foreground">2 hours ago</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Subject: Q1 Compliance Review Meeting</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Phone className="h-5 w-5 mt-1 text-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Call with BioInnovate Corp</div>
                      <div className="text-sm text-muted-foreground">1 day ago</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Duration: 45 minutes - Discussed tool integration</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 mt-1 text-purple-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Meeting scheduled with MedTech Dynamics</div>
                      <div className="text-sm text-muted-foreground">Tomorrow 2:00 PM</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Topic: Expansion opportunities discussion</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}