import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Activity,
  TrendingUp
} from "lucide-react";
import { useWorkflowAutomation } from '@/hooks/useWorkflowAutomation';

const WorkflowAutomationPanel: React.FC = () => {
  const {
    triggers,
    automatedActions,
    generatePolicyRecommendation,
    detectConflicts,
    routeApproval,
    sendComplianceAlert,
    toggleTrigger,
    clearCompletedActions
  } = useWorkflowAutomation();

  const [activeTab, setActiveTab] = useState('triggers');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'policy_recommendation':
        return <TrendingUp className="h-4 w-4" />;
      case 'conflict_detection':
        return <AlertTriangle className="h-4 w-4" />;
      case 'approval_routing':
        return <Bot className="h-4 w-4" />;
      case 'compliance_alert':
        return <Activity className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const formatTriggerName = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Workflow Automation
            </CardTitle>
            <CardDescription>
              Automated triggers and intelligent workflow routing
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearCompletedActions}>
              Clear Completed
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="triggers">
              <Zap className="h-4 w-4 mr-2" />
              Triggers
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Activity className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="demo">
              <Bot className="h-4 w-4 mr-2" />
              Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="triggers" className="space-y-4">
            <div className="space-y-3">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTriggerIcon(trigger.type)}
                    <div>
                      <div className="font-medium">{formatTriggerName(trigger.type)}</div>
                      <div className="text-sm text-muted-foreground">
                        Triggered {trigger.triggerCount} times
                        {trigger.lastTriggered && (
                          <span className="ml-2">
                            • Last: {trigger.lastTriggered.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={trigger.enabled ? "default" : "secondary"}>
                      {trigger.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={() => toggleTrigger(trigger.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-3">
              {automatedActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No automated actions yet. Triggers will appear here when activated.
                </div>
              ) : (
                automatedActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(action.status)}
                      <div>
                        <div className="font-medium">{formatTriggerName(action.type)}</div>
                        <div className="text-sm text-muted-foreground">
                          Triggered at {action.triggeredAt.toLocaleTimeString()}
                          {action.completedAt && (
                            <span className="ml-2">
                              • Completed at {action.completedAt.toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        action.status === 'completed' ? 'default' :
                        action.status === 'failed' ? 'destructive' : 'secondary'
                      }
                    >
                      {action.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Demo Triggers</CardTitle>
                  <CardDescription>Test automated workflows</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => generatePolicyRecommendation({ toolCount: 15, riskLevel: 'medium' })}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Policy Recommendation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => detectConflicts({ toolName: 'New AI Tool', riskLevel: 'high' })}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Trigger Conflict Detection
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => routeApproval({ toolName: 'Critical Tool', riskLevel: 'high' })}
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Test Approval Routing
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => sendComplianceAlert({ score: 82, trend: 'declining' })}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Send Compliance Alert
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Automation Stats</CardTitle>
                  <CardDescription>Current automation performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Triggers</span>
                      <span className="font-medium">{triggers.filter(t => t.enabled).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Actions</span>
                      <span className="font-medium">{automatedActions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-medium text-green-600">
                        {automatedActions.filter(a => a.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-medium">
                        {automatedActions.length > 0 ? 
                          Math.round((automatedActions.filter(a => a.status === 'completed').length / automatedActions.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WorkflowAutomationPanel;