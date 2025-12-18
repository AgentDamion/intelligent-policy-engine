import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Send, 
  Eye, 
  Edit, 
  Clock,
  Building,
  CheckCircle,
  AlertTriangle,
  Search,
  Calendar
} from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'distributed' | 'archived';
  applicableClients: string[];
  lastModified: string;
  createdBy: string;
  distributionCount: number;
  complianceRate: number;
}

const mockPolicies: Policy[] = [
  {
    id: '1',
    title: 'AI Tool Data Protection Policy',
    description: 'Guidelines for using AI tools with sensitive pharmaceutical data',
    version: '2.1',
    status: 'active',
    applicableClients: ['Pharma Corp', 'BioTech Inc'],
    lastModified: '2024-01-15',
    createdBy: 'Sarah Johnson',
    distributionCount: 12,
    complianceRate: 92
  },
  {
    id: '2',
    title: 'Large Language Model Usage Standards',
    description: 'Standards for ChatGPT, Claude, and other LLM usage in clinical environments',
    version: '1.3',
    status: 'distributed',
    applicableClients: ['Pharma Corp', 'MedDevice Co'],
    lastModified: '2024-01-12',
    createdBy: 'Michael Chen',
    distributionCount: 8,
    complianceRate: 87
  },
  {
    id: '3',
    title: 'Code Generation AI Policy',
    description: 'Guidelines for using AI coding assistants in regulated software development',
    version: '1.0',
    status: 'draft',
    applicableClients: ['BioTech Inc'],
    lastModified: '2024-01-10',
    createdBy: 'Sarah Johnson',
    distributionCount: 0,
    complianceRate: 0
  }
];

interface PolicyDistribution {
  id: string;
  policyId: string;
  policyTitle: string;
  client: string;
  distributedDate: string;
  status: 'sent' | 'acknowledged' | 'implemented' | 'non_compliant';
  acknowledgmentDate?: string;
  implementationDate?: string;
}

const mockDistributions: PolicyDistribution[] = [
  {
    id: '1',
    policyId: '1',
    policyTitle: 'AI Tool Data Protection Policy',
    client: 'Pharma Corp',
    distributedDate: '2024-01-15',
    status: 'implemented',
    acknowledgmentDate: '2024-01-16',
    implementationDate: '2024-01-18'
  },
  {
    id: '2',
    policyId: '1',
    policyTitle: 'AI Tool Data Protection Policy',
    client: 'BioTech Inc',
    distributedDate: '2024-01-15',
    status: 'acknowledged',
    acknowledgmentDate: '2024-01-17'
  },
  {
    id: '3',
    policyId: '2',
    policyTitle: 'Large Language Model Usage Standards',
    client: 'MedDevice Co',
    distributedDate: '2024-01-12',
    status: 'non_compliant',
    acknowledgmentDate: '2024-01-13'
  }
];

const PolicyManagement = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'distributed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      case 'sent': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'acknowledged': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'implemented': return 'bg-green-100 text-green-800 border-green-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'implemented': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'distributed':
      case 'sent':
      case 'acknowledged': return <Send className="h-4 w-4" />;
      case 'non_compliant': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredPolicies = mockPolicies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || policy.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Policy Management</CardTitle>
              <CardDescription>
                Create and manage AI tool governance policies for your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search policies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="distributed">Distributed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Policies List */}
              <div className="space-y-4">
                {filteredPolicies.map((policy) => (
                  <Card key={policy.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{policy.title}</h3>
                            <Badge className={getStatusColor(policy.status)} variant="outline">
                              {getStatusIcon(policy.status)}
                              <span className="ml-1 capitalize">{policy.status}</span>
                            </Badge>
                            <Badge variant="secondary">v{policy.version}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{policy.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{policy.applicableClients.length} clients</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Send className="h-4 w-4" />
                              <span>{policy.distributionCount} distributions</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>{policy.complianceRate}% compliance</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Modified {new Date(policy.lastModified).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {policy.status === 'active' && (
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Distribute
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Applicable Clients */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Applicable Clients:</span>
                            <div className="flex space-x-2 mt-1">
                              {policy.applicableClients.map(client => (
                                <Badge key={client} variant="outline">{client}</Badge>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Created by {policy.createdBy}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Distributions</CardTitle>
              <CardDescription>
                Track policy distribution and client acknowledgment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDistributions.map((distribution) => (
                  <Card key={distribution.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium">{distribution.policyTitle}</h4>
                            <Badge className={getStatusColor(distribution.status)} variant="outline">
                              {getStatusIcon(distribution.status)}
                              <span className="ml-1 capitalize">{distribution.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{distribution.client}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Sent {new Date(distribution.distributedDate).toLocaleDateString()}</span>
                            </div>
                            {distribution.acknowledgmentDate && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4" />
                                <span>Acked {new Date(distribution.acknowledgmentDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {distribution.implementationDate && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Implemented {new Date(distribution.implementationDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {distribution.status === 'non_compliant' && (
                            <Button variant="destructive" size="sm">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Follow Up
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Policy Templates</CardTitle>
              <CardDescription>
                Pre-built policy templates for common AI tool governance scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'AI Data Protection Template',
                    description: 'Standard data protection policy for AI tools handling sensitive data',
                    icon: <FileText className="h-6 w-6" />
                  },
                  {
                    title: 'LLM Usage Guidelines',
                    description: 'Best practices for using large language models in pharmaceutical environments',
                    icon: <FileText className="h-6 w-6" />
                  },
                  {
                    title: 'Vendor Risk Assessment',
                    description: 'Framework for evaluating AI tool vendors and their compliance',
                    icon: <FileText className="h-6 w-6" />
                  },
                  {
                    title: 'Code Generation Policy',
                    description: 'Guidelines for AI-assisted code generation in regulated environments',
                    icon: <FileText className="h-6 w-6" />
                  }
                ].map((template, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-2">{template.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                          <Button variant="outline" size="sm">
                            Use Template
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
      </Tabs>
    </div>
  );
};

export default PolicyManagement;