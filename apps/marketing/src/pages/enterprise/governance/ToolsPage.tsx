import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Wrench, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useGovernanceData } from '@/hooks/useGovernanceData';

const ToolsPage: React.FC = () => {
  const { entities, loading } = useGovernanceData({
    timeRange: '30d',
    segment: 'all',
    riskTiers: [],
    statuses: [],
    search: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const tools = entities.filter(e => e.type === 'tool' || e.type === 'client').slice(0, 10);

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskLevel = (openRisks: number): 'high' | 'medium' | 'low' => {
    if (openRisks >= 10) return 'high';
    if (openRisks >= 5) return 'medium';
    return 'low';
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return { variant: 'destructive' as const, icon: AlertTriangle };
      case 'medium':
        return { variant: 'secondary' as const, icon: AlertTriangle };
      case 'low':
        return { variant: 'outline' as const, icon: CheckCircle };
      default:
        return { variant: 'outline' as const, icon: CheckCircle };
    }
  };

  const getComplianceBadge = (compliance: number) => {
    if (compliance >= 90) return { variant: 'default' as const, text: 'Compliant' };
    if (compliance >= 70) return { variant: 'secondary' as const, text: 'Review Needed' };
    return { variant: 'destructive' as const, text: 'Non-Compliant' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Tools Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage AI tools across your organization
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Request Tool
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tools.filter(t => t.compliance >= 90).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {tools.filter(t => getRiskLevel(t.openRisks) === 'high').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(tools.reduce((acc, t) => acc + t.compliance, 0) / tools.length || 0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tool Registry</CardTitle>
              <CardDescription>Search and filter AI tools</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.map((tool) => {
                const riskLevel = getRiskLevel(tool.openRisks);
                const riskBadge = getRiskBadge(riskLevel);
                const complianceBadge = getComplianceBadge(tool.compliance);
                const RiskIcon = riskBadge.icon;

                return (
                  <Card key={tool.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                        </div>
                        <Badge variant={riskBadge.variant}>
                          <RiskIcon className="h-3 w-3 mr-1" />
                          {riskLevel}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Compliance</span>
                          <Badge variant={complianceBadge.variant}>
                            {complianceBadge.text} ({Math.round(tool.compliance)}%)
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Open Risks</span>
                          <Badge variant="outline">{tool.openRisks}</Badge>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            Review
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No tools found</p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Request a tool to get started with the AI tools inventory'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolsPage;
