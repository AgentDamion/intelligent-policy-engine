import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  ArrowRight,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'approval' | 'review' | 'automation' | 'notification';
  title: string;
  assignedTo?: string;
  condition?: string;
  timeoutHours?: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'active' | 'draft' | 'paused';
  triggerCount: number;
}

export const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([
    {
      id: 'wf-001',
      name: 'Policy Review & Approval',
      description: 'Multi-stage review process for new policy submissions',
      status: 'active',
      triggerCount: 23,
      steps: [
        {
          id: 'step-1',
          type: 'review',
          title: 'Initial Policy Review',
          assignedTo: 'Compliance Team',
          timeoutHours: 48
        },
        {
          id: 'step-2',
          type: 'approval',
          title: 'Legal Department Approval',
          assignedTo: 'Legal Team',
          timeoutHours: 72
        },
        {
          id: 'step-3',
          type: 'automation',
          title: 'Policy Distribution',
          condition: 'status === "approved"'
        }
      ]
    },
    {
      id: 'wf-002',
      name: 'High-Risk Tool Assessment',
      description: 'Automated escalation for tools with risk scores > 70',
      status: 'active',
      triggerCount: 8,
      steps: [
        {
          id: 'step-1',
          type: 'automation',
          title: 'Risk Score Calculation',
          condition: 'riskScore > 70'
        },
        {
          id: 'step-2',
          type: 'notification',
          title: 'Alert Security Team',
          assignedTo: 'Security Team'
        },
        {
          id: 'step-3',
          type: 'review',
          title: 'Manual Security Review',
          assignedTo: 'CISO',
          timeoutHours: 24
        }
      ]
    }
  ]);

  const getStepIcon = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'approval': return <CheckCircle2 className="h-4 w-4" />;
      case 'review': return <Users className="h-4 w-4" />;
      case 'automation': return <Settings className="h-4 w-4" />;
      case 'notification': return <Clock className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: wf.status === 'active' ? 'paused' : 'active' }
        : wf
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Workflow Builder
          </h2>
          <p className="text-muted-foreground">
            Create and manage automated compliance workflows
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {workflow.triggerCount} triggers
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWorkflowStatus(workflow.id)}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {workflow.steps.map((step, index) => (
                      <React.Fragment key={step.id}>
                        <div className="flex items-center gap-2 min-w-max bg-secondary rounded-lg px-3 py-2">
                          {getStepIcon(step.type)}
                          <span className="text-sm font-medium">{step.title}</span>
                          {step.timeoutHours && (
                            <Badge variant="outline" className="text-xs">
                              {step.timeoutHours}h
                            </Badge>
                          )}
                        </div>
                        {index < workflow.steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Visual Workflow Designer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Drag-and-drop workflow builder coming soon</p>
                <p className="text-sm">Create complex approval chains with visual editing</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.filter(w => w.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.triggerCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2h</div>
                <p className="text-xs text-muted-foreground">Per workflow</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};