import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2, 
  BarChart3, 
  Shield, 
  Bot, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";
import { useCrossTabIntegration } from '@/hooks/useCrossTabIntegration';

const CrossTabIntegrationPanel: React.FC = () => {
  const {
    integratedData,
    loading,
    getIntegratedMetrics,
    getRecentCrossTabEvents,
    refresh
  } = useCrossTabIntegration();

  const [activeTab, setActiveTab] = useState('overview');
  const metrics = getIntegratedMetrics();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'tool_submission':
        return <Bot className="h-4 w-4 text-blue-600" />;
      case 'policy_update':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'conflict_detected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'approval_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'default';
      case 'non_compliant':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Cross-Tab Integration
            </CardTitle>
            <CardDescription>
              Unified data flow and real-time synchronization across dashboard sections
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tools-governance">
              <Shield className="h-4 w-4 mr-2" />
              Tools ↔ Governance
            </TabsTrigger>
            <TabsTrigger value="analytics-workflow">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics ↔ Workflow
            </TabsTrigger>
            <TabsTrigger value="real-time">
              <Activity className="h-4 w-4 mr-2" />
              Real-Time Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Compliance Rate</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{metrics.complianceRate}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Total Conflicts</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{metrics.totalConflicts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Active Workflows</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{metrics.activeWorkflows}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Recent Events</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{metrics.recentEvents}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools-governance" className="space-y-4">
            <div className="space-y-3">
              {integratedData.toolsToGovernanceMapping.map((tool) => (
                <div key={tool.toolId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{tool.toolName}</div>
                      <div className="text-sm text-muted-foreground">
                        {tool.relatedPolicies.length} related policies
                        {tool.conflictCount > 0 && (
                          <span className="ml-2 text-red-600">
                            • {tool.conflictCount} conflicts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getComplianceStatusColor(tool.complianceStatus)}>
                      {tool.complianceStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics-workflow" className="space-y-4">
            <div className="space-y-3">
              {integratedData.analyticsToWorkflowMapping.map((client) => (
                <div key={client.clientId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{client.clientName}</div>
                    <Badge variant="outline">
                      {client.performanceMetrics.complianceScore}% Compliance
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Tool Usage</div>
                      <div className="font-medium">{client.performanceMetrics.toolUsage}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Approval Time</div>
                      <div className="font-medium">{client.performanceMetrics.approvalTime} days</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Active Workflows</div>
                      <div className="font-medium">{client.activeWorkflows.length}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground mb-2">Recommended Actions:</div>
                    <div className="flex gap-1 flex-wrap">
                      {client.recommendedActions.slice(0, 2).map((action, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="real-time" className="space-y-4">
            <div className="space-y-3">
              {integratedData.realTimeEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.type)}
                    <div>
                      <div className="font-medium">
                        {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.timestamp.toLocaleTimeString()}
                        <span className="ml-2">
                          • Affects {event.crossTabImpact.length} sections
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {event.crossTabImpact.map((impact, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {impact.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CrossTabIntegrationPanel;