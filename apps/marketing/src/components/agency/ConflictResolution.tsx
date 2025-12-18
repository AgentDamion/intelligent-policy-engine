import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Building,
  FileText,
  User,
  Calendar,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Settings,
  TrendingUp
} from 'lucide-react';

interface PolicyConflict {
  id: string;
  type: 'data_handling' | 'vendor_compliance' | 'usage_restriction' | 'security_requirement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'under_review' | 'resolved' | 'escalated';
  title: string;
  description: string;
  affectedClients: string[];
  affectedTools: string[];
  conflictingPolicies: string[];
  detectedDate: string;
  assignedTo?: string;
  resolvedDate?: string;
  resolution?: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  businessRisk: string;
}

const mockConflicts: PolicyConflict[] = [
  {
    id: '1',
    type: 'data_handling',
    severity: 'high',
    status: 'under_review',
    title: 'Data Residency Conflict for EU Client',
    description: 'ChatGPT Enterprise data processing conflicts with GDPR data residency requirements for EU-based pharmaceutical client',
    affectedClients: ['EuroPharma GmbH'],
    affectedTools: ['ChatGPT Enterprise', 'Claude Pro'],
    conflictingPolicies: ['EU Data Protection Policy v2.1', 'AI Tool Data Handling Standard v1.3'],
    detectedDate: '2024-01-15',
    assignedTo: 'Sarah Johnson',
    estimatedImpact: 'high',
    businessRisk: 'Potential GDPR violation, could impact €2M contract'
  },
  {
    id: '2',
    type: 'vendor_compliance',
    severity: 'medium',
    status: 'detected',
    title: 'SOC 2 Certificate Mismatch',
    description: 'New vendor compliance requirements conflict with existing tool approvals for multiple clients',
    affectedClients: ['Pharma Corp', 'BioTech Inc'],
    affectedTools: ['Custom Analytics Tool', 'ML Model v2.1'],
    conflictingPolicies: ['Vendor Risk Assessment Policy v1.2', 'Security Compliance Standard v2.0'],
    detectedDate: '2024-01-14',
    estimatedImpact: 'medium',
    businessRisk: 'May require tool replacement, potential 2-week project delays'
  },
  {
    id: '3',
    type: 'usage_restriction',
    severity: 'critical',
    status: 'escalated',
    title: 'Clinical Data Usage Violation',
    description: 'AI tool being used for clinical data analysis without proper approval from regulatory affairs',
    affectedClients: ['MedDevice Co'],
    affectedTools: ['Advanced Analytics Suite'],
    conflictingPolicies: ['Clinical Data Handling Policy v3.0', 'AI Tool Approval Workflow v1.1'],
    detectedDate: '2024-01-12',
    assignedTo: 'Dr. Michael Chen',
    estimatedImpact: 'high',
    businessRisk: 'FDA compliance risk, potential audit findings'
  },
  {
    id: '4',
    type: 'security_requirement',
    severity: 'low',
    status: 'resolved',
    title: 'Multi-Factor Authentication Gap',
    description: 'Legacy tools missing MFA requirements per updated security policy',
    affectedClients: ['BioTech Inc'],
    affectedTools: ['Legacy Document System'],
    conflictingPolicies: ['Security Access Policy v2.2'],
    detectedDate: '2024-01-10',
    assignedTo: 'IT Security Team',
    resolvedDate: '2024-01-13',
    resolution: 'MFA implementation completed for all legacy systems',
    estimatedImpact: 'low',
    businessRisk: 'Minor security vulnerability, resolved'
  }
];

const ConflictResolution = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'data_handling': return <FileText className="h-4 w-4" />;
      case 'vendor_compliance': return <Building className="h-4 w-4" />;
      case 'usage_restriction': return <AlertTriangle className="h-4 w-4" />;
      case 'security_requirement': return <Settings className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected': return <AlertTriangle className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'escalated': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredConflicts = mockConflicts.filter(conflict => {
    const matchesSearch = conflict.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conflict.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || conflict.severity === selectedSeverity;
    const matchesType = selectedType === 'all' || conflict.type === selectedType;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && ['detected', 'under_review', 'escalated'].includes(conflict.status)) ||
                      (activeTab === 'resolved' && conflict.status === 'resolved');
    return matchesSearch && matchesSeverity && matchesType && matchesTab;
  });

  // Stats calculations
  const totalConflicts = mockConflicts.length;
  const activeConflicts = mockConflicts.filter(c => ['detected', 'under_review', 'escalated'].includes(c.status)).length;
  const criticalConflicts = mockConflicts.filter(c => c.severity === 'critical' && c.status !== 'resolved').length;
  const resolvedConflicts = mockConflicts.filter(c => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalConflicts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have {criticalConflicts} critical policy conflicts that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conflicts</p>
                <p className="text-2xl font-bold">{totalConflicts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-orange-600">{activeConflicts}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalConflicts}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedConflicts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active">Active Conflicts</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Run Conflict Scan
          </Button>
        </div>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Conflict Detection & Resolution</CardTitle>
              <CardDescription>
                Identify and resolve conflicts between client policies and AI tool requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conflicts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Conflict Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="data_handling">Data Handling</SelectItem>
                    <SelectItem value="vendor_compliance">Vendor Compliance</SelectItem>
                    <SelectItem value="usage_restriction">Usage Restriction</SelectItem>
                    <SelectItem value="security_requirement">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conflicts List */}
              <div className="space-y-4">
                {filteredConflicts.map((conflict) => (
                  <Card key={conflict.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="p-1 bg-muted rounded">
                              {getTypeIcon(conflict.type)}
                            </div>
                            <h3 className="text-lg font-semibold">{conflict.title}</h3>
                            <Badge className={getSeverityColor(conflict.severity)} variant="outline">
                              {conflict.severity.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(conflict.status)} variant="outline">
                              {getStatusIcon(conflict.status)}
                              <span className="ml-1 capitalize">{conflict.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{conflict.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Affected Clients:</span>
                              </div>
                              <div className="flex flex-wrap gap-1 ml-6">
                                {conflict.affectedClients.map(client => (
                                  <Badge key={client} variant="outline" className="text-xs">{client}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Affected Tools:</span>
                              </div>
                              <div className="flex flex-wrap gap-1 ml-6">
                                {conflict.affectedTools.map(tool => (
                                  <Badge key={tool} variant="outline" className="text-xs">{tool}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          {conflict.status === 'detected' && (
                            <Button size="sm">
                              <User className="h-4 w-4 mr-2" />
                              Assign
                            </Button>
                          )}
                          {conflict.status === 'under_review' && (
                            <Button size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Update
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Business Impact */}
                      <div className="border-t pt-4 space-y-3">
                        <div className="bg-muted p-3 rounded-md">
                          <div className="flex items-center space-x-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium">Business Risk:</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{conflict.businessRisk}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Detected {new Date(conflict.detectedDate).toLocaleDateString()}</span>
                            </div>
                            {conflict.assignedTo && (
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Assigned to {conflict.assignedTo}</span>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className={`${conflict.estimatedImpact === 'high' ? 'text-red-600' : conflict.estimatedImpact === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {conflict.estimatedImpact.toUpperCase()} IMPACT
                          </Badge>
                        </div>

                        {conflict.resolution && (
                          <div className="bg-green-50 p-3 rounded-md border border-green-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Resolution:</span>
                            </div>
                            <p className="text-sm text-green-700">{conflict.resolution}</p>
                            {conflict.resolvedDate && (
                              <p className="text-xs text-green-600 mt-1">
                                Resolved on {new Date(conflict.resolvedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Conflicts</CardTitle>
              <CardDescription>
                Review previously resolved policy conflicts and their solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockConflicts.filter(c => c.status === 'resolved').map((conflict) => (
                  <Card key={conflict.id} className="hover:shadow-md transition-shadow border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h4 className="font-medium">{conflict.title}</h4>
                            <Badge className={getSeverityColor(conflict.severity)} variant="outline">
                              {conflict.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{conflict.description}</p>
                          {conflict.resolution && (
                            <p className="text-sm text-green-700 font-medium">{conflict.resolution}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Resolved {conflict.resolvedDate && new Date(conflict.resolvedDate).toLocaleDateString()}</p>
                          <p>by {conflict.assignedTo}</p>
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
              <CardTitle>Conflict Analytics</CardTitle>
              <CardDescription>
                Analyze conflict patterns and resolution trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Conflict Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Advanced analytics and trending data coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConflictResolution;