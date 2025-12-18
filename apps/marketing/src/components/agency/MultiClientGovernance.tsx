import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Users, ArrowUpDown, CheckSquare, FileText, Plus } from 'lucide-react';

const MultiClientGovernance = () => {
  const [selectedClient, setSelectedClient] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Sample data
  const clients = [
    { id: '1', name: 'Acme Pharma', tools: 67, policies: 12, compliance: 94 },
    { id: '2', name: 'BioTech Corp', tools: 45, policies: 8, compliance: 87 },
    { id: '3', name: 'MediGen Labs', tools: 52, policies: 10, compliance: 91 },
    { id: '4', name: 'HealthTech Inc', tools: 38, policies: 6, compliance: 89 }
  ];

  const toolRequests = [
    { id: '1', tool: 'Claude 3.5 Sonnet', client: 'Acme Pharma', vendor: 'Anthropic', status: 'pending', risk: 'low', requestDate: '2024-01-15' },
    { id: '2', tool: 'GPT-4 Turbo', client: 'BioTech Corp', vendor: 'OpenAI', status: 'pending', risk: 'medium', requestDate: '2024-01-14' },
    { id: '3', tool: 'Gemini Pro', client: 'MediGen Labs', vendor: 'Google', status: 'pending', risk: 'low', requestDate: '2024-01-13' },
    { id: '4', tool: 'CoPilot Enterprise', client: 'HealthTech Inc', vendor: 'Microsoft', status: 'review', risk: 'high', requestDate: '2024-01-12' },
    { id: '5', tool: 'Perplexity Pro', client: 'Acme Pharma', vendor: 'Perplexity', status: 'pending', risk: 'medium', requestDate: '2024-01-11' }
  ];

  const clientPolicies = [
    { id: '1', name: 'Data Privacy Policy', client: 'Acme Pharma', status: 'active', lastUpdated: '2024-01-10' },
    { id: '2', name: 'AI Model Approval Process', client: 'All Clients', status: 'active', lastUpdated: '2024-01-08' },
    { id: '3', name: 'Vendor Risk Assessment', client: 'BioTech Corp', status: 'draft', lastUpdated: '2024-01-05' }
  ];

  const handleBulkApproval = () => {
    console.log('Bulk approving tools:', selectedTools);
    setSelectedTools([]);
  };

  const handleToolSelection = (toolId: string, checked: boolean) => {
    if (checked) {
      setSelectedTools([...selectedTools, toolId]);
    } else {
      setSelectedTools(selectedTools.filter(id => id !== toolId));
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Client Overview</TabsTrigger>
          <TabsTrigger value="policies">Policy Management</TabsTrigger>
          <TabsTrigger value="bulk-approvals">Bulk Approvals</TabsTrigger>
          <TabsTrigger value="onboarding">Client Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Tool Governance Overview</CardTitle>
              <CardDescription>Compare AI tool usage and compliance across all pharmaceutical clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {clients.map((client) => (
                  <Card key={client.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Tools</span>
                        <Badge variant="outline">{client.tools}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Policies</span>
                        <Badge variant="outline">{client.policies}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Compliance</span>
                        <Badge variant={client.compliance >= 90 ? "default" : "secondary"}>
                          {client.compliance}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Client-Specific Policies</CardTitle>
                <CardDescription>Manage AI tool governance policies for each client</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Search policies..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell>{policy.client}</TableCell>
                      <TableCell>
                        <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                          {policy.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{policy.lastUpdated}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-approvals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bulk Tool Approvals</CardTitle>
                <CardDescription>Approve multiple AI tool requests across clients</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleBulkApproval}
                  disabled={selectedTools.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedTools.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Search tool requests..." 
                    className="max-w-sm"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Tool Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedTools.includes(request.id)}
                          onCheckedChange={(checked) => handleToolSelection(request.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{request.tool}</TableCell>
                      <TableCell>{request.client}</TableCell>
                      <TableCell>{request.vendor}</TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(request.risk)}>
                          {request.risk}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.status}</Badge>
                      </TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Onboarding Workflow</CardTitle>
              <CardDescription>Streamlined process to onboard new pharmaceutical clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">1. Initial Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Company information</li>
                        <li>• Regulatory requirements</li>
                        <li>• AI tool inventory</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">2. Policy Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Custom policy templates</li>
                        <li>• Approval workflows</li>
                        <li>• Risk assessment criteria</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">3. Integration & Testing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• System integration</li>
                        <li>• User training</li>
                        <li>• Pilot testing</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Users className="h-4 w-4 mr-2" />
                    Start New Client Onboarding
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiClientGovernance;