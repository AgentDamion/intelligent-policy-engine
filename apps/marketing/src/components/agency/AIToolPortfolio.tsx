import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  Plus, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Building,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  vendor: string;
  category: string;
  client: string;
  status: 'approved' | 'pending' | 'rejected' | 'under_review';
  riskLevel: 'low' | 'medium' | 'high';
  usageCount: number;
  lastUsed: string;
  complianceScore: number;
  users: number;
}

// Mock data
const mockTools: AITool[] = [
  {
    id: '1',
    name: 'ChatGPT Enterprise',
    vendor: 'OpenAI',
    category: 'Language Model',
    client: 'Pharma Corp',
    status: 'approved',
    riskLevel: 'low',
    usageCount: 156,
    lastUsed: '2024-01-15',
    complianceScore: 92,
    users: 45
  },
  {
    id: '2',
    name: 'Claude Pro',
    vendor: 'Anthropic',
    category: 'Language Model',
    client: 'BioTech Inc',
    status: 'pending',
    riskLevel: 'medium',
    usageCount: 23,
    lastUsed: '2024-01-14',
    complianceScore: 78,
    users: 12
  },
  {
    id: '3',
    name: 'GitHub Copilot',
    vendor: 'Microsoft',
    category: 'Code Assistant',
    client: 'Pharma Corp',
    status: 'approved',
    riskLevel: 'low',
    usageCount: 89,
    lastUsed: '2024-01-16',
    complianceScore: 88,
    users: 23
  },
  {
    id: '4',
    name: 'Custom ML Model',
    vendor: 'Internal',
    category: 'Machine Learning',
    client: 'MedDevice Co',
    status: 'under_review',
    riskLevel: 'high',
    usageCount: 5,
    lastUsed: '2024-01-10',
    complianceScore: 45,
    users: 3
  }
];

const AIToolPortfolio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredTools = mockTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === 'all' || tool.client === selectedClient;
    const matchesStatus = selectedStatus === 'all' || tool.status === selectedStatus;
    return matchesSearch && matchesClient && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'under_review': return <Shield className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const uniqueClients = [...new Set(mockTools.map(tool => tool.client))];
  const totalTools = mockTools.length;
  const approvedTools = mockTools.filter(tool => tool.status === 'approved').length;
  const pendingReviews = mockTools.filter(tool => tool.status === 'pending' || tool.status === 'under_review').length;
  const avgComplianceScore = Math.round(mockTools.reduce((acc, tool) => acc + tool.complianceScore, 0) / totalTools);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tools</p>
                <p className="text-2xl font-bold">{totalTools}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedTools}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingReviews}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Compliance</p>
                <p className="text-2xl font-bold">{avgComplianceScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                AI Tool Portfolio
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tools, vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTools.map((tool) => (
                  <Card key={tool.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Wrench className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{tool.name}</CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <span>{tool.vendor}</span>
                              <span>•</span>
                              <span>{tool.category}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={getStatusColor(tool.status)} variant="outline">
                          {getStatusIcon(tool.status)}
                          <span className="ml-1 capitalize">{tool.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{tool.client}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{tool.users} users</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Compliance Score</span>
                          <span className="font-medium">{tool.complianceScore}%</span>
                        </div>
                        <Progress value={tool.complianceScore} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className={`h-4 w-4 ${getRiskColor(tool.riskLevel)}`} />
                          <span className="capitalize">{tool.riskLevel} Risk</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{tool.usageCount} uses</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Last used: {new Date(tool.lastUsed).toLocaleDateString()}
                          </span>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Tool Usage Analytics</CardTitle>
              <CardDescription>
                Track adoption, compliance trends, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and reporting features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Manage AI tool vendors and their compliance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Vendor Dashboard</h3>
                <p className="text-muted-foreground">
                  Vendor risk assessment and management features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIToolPortfolio;