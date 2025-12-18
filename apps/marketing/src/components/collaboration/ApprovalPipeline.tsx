import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Users,
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useEnhancedCollaboration, ApprovalWorkflow } from '@/hooks/useEnhancedCollaboration';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalPipelineProps {
  documentId: string;
  documentType: string;
  workspaceId?: string;
  enterpriseId?: string;
  className?: string;
}

interface ApprovalStage {
  name: string;
  assignees: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

export const ApprovalPipeline: React.FC<ApprovalPipelineProps> = ({
  documentId,
  documentType,
  workspaceId,
  enterpriseId,
  className = ''
}) => {
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  const {
    currentUserSession
  } = useEnhancedCollaboration({
    documentId,
    documentType,
    workspaceId
  });

  // Load approval workflows
  useEffect(() => {
    const loadApprovalWorkflows = async () => {
      try {
        const { data: workflows, error } = await supabase
          .from('approval_workflows')
          .select('*')
          .eq('document_id', documentId)
          .eq('document_type', documentType)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const approvalWorkflows: ApprovalWorkflow[] = workflows.map(workflow => ({
          id: workflow.id,
          documentId: workflow.document_id,
          documentType: workflow.document_type,
          workflowName: workflow.workflow_name,
          currentStage: workflow.current_stage,
          stages: workflow.stages as ApprovalWorkflow['stages'],
          progressPercentage: workflow.progress_percentage,
          estimatedCompletion: workflow.estimated_completion,
          bottleneckDetected: workflow.bottleneck_detected,
          escalationTriggered: workflow.escalation_triggered
        }));

        setApprovalWorkflows(approvalWorkflows);
      } catch (error) {
        console.error('Failed to load approval workflows:', error);
      }
    };

    loadApprovalWorkflows();

    // Set up real-time subscription
    const channel = supabase
      .channel(`approval_workflows:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_workflows',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          loadApprovalWorkflows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, documentType]);

  const createStandardWorkflow = async () => {
    try {
      setIsCreatingWorkflow(true);

      // Get intelligent assignments based on enterprise setup
      const { data: assignments } = await supabase
        .rpc('assign_reviewers_by_expertise', {
          policy_content: '',
          enterprise_id_param: enterpriseId,
          workflow_type: 'standard'
        });

      const intelligentStages = (assignments as any)?.stages || [
        {
          name: 'Initial Review',
          assignees: ['system'],
          status: 'pending',
          estimatedDuration: 24,
          required_approvals: 1
        },
        {
          name: 'Technical Validation',
          assignees: ['system'],
          status: 'pending',
          estimatedDuration: 48,
          required_approvals: 1
        },
        {
          name: 'Compliance Check',
          assignees: ['system'],
          status: 'pending',
          estimatedDuration: 72,
          required_approvals: 1
        },
        {
          name: 'Final Approval',
          assignees: ['system'],
          status: 'pending',
          estimatedDuration: 24,
          required_approvals: 1
        }
      ];

      const workflowData = {
        document_id: documentId,
        document_type: documentType,
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        workflow_name: `${documentType} Approval Pipeline`,
        current_stage: intelligentStages[0].name,
        stages: intelligentStages,
        assignees: intelligentStages[0].assignees,
        progress_percentage: 0,
        priority_level: 'normal',
        sla_hours: 48,
        auto_assignment_rules: assignments || {},
        escalation_rules: {
          auto_escalate_hours: 24,
          escalation_roles: ['owner', 'admin']
        }
      };

      const { error } = await supabase
        .from('approval_workflows')
        .insert(workflowData);

      if (error) throw error;

      // Log workflow creation
      await supabase.from('audit_events').insert({
        event_type: 'approval_workflow_created',
        entity_type: 'approval_workflow',
        entity_id: documentId,
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        details: {
          document_type: documentType,
          total_stages: intelligentStages.length,
          workflow_type: 'standard'
        }
      });

    } catch (error) {
      console.error('Failed to create approval workflow:', error);
    } finally {
      setIsCreatingWorkflow(false);
    }
  };

  const updateWorkflowStage = async (workflowId: string, newStage: string) => {
    try {
      const workflow = approvalWorkflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const currentStageIndex = workflow.stages.findIndex(s => s.name === workflow.currentStage);
      const newStageIndex = workflow.stages.findIndex(s => s.name === newStage);
      
      if (newStageIndex === -1) return;

      // Mark current stage as completed
      const updatedStages = [...workflow.stages];
      if (currentStageIndex >= 0) {
        updatedStages[currentStageIndex] = {
          ...updatedStages[currentStageIndex],
          status: 'completed',
          completedAt: new Date().toISOString()
        };
      }

      // Mark new stage as in progress
      updatedStages[newStageIndex] = {
        ...updatedStages[newStageIndex],
        status: 'in_progress'
      };

      const progressPercentage = Math.round(((newStageIndex + 1) / workflow.stages.length) * 100);

      const { error } = await supabase
        .from('approval_workflows')
        .update({
          current_stage: newStage,
          stages: updatedStages,
          progress_percentage: progressPercentage,
          assignees: updatedStages[newStageIndex].assignees,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update workflow stage:', error);
    }
  };

  const getStageIcon = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-warning animate-pulse" />;
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStageColor = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return 'border-success bg-success/10';
      case 'in_progress':
        return 'border-warning bg-warning/10';
      case 'blocked':
        return 'border-destructive bg-destructive/10';
      default:
        return 'border-muted bg-muted/10';
    }
  };

  const calculateEstimatedCompletion = (workflow: ApprovalWorkflow) => {
    const currentStageIndex = workflow.stages.findIndex(s => s.name === workflow.currentStage);
    const remainingStages = workflow.stages.slice(currentStageIndex);
    const remainingHours = remainingStages.reduce((total, stage) => {
      return total + (stage.estimatedDuration || 24);
    }, 0);
    
    return new Date(Date.now() + remainingHours * 60 * 60 * 1000);
  };

  const detectBottlenecks = (workflow: ApprovalWorkflow) => {
    const currentStage = workflow.stages.find(s => s.name === workflow.currentStage);
    if (!currentStage) return false;

    // Simple bottleneck detection: stage running longer than estimated
    if (currentStage.status === 'in_progress' && currentStage.estimatedDuration) {
      // In a real app, you'd track when the stage started
      // For now, we'll just mark as bottleneck if it's been in progress for more than estimated duration
      return workflow.bottleneckDetected;
    }

    return false;
  };

  if (approvalWorkflows.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Approval Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-4">
              No approval workflow has been set up for this document.
            </div>
            <Button 
              onClick={createStandardWorkflow}
              disabled={isCreatingWorkflow}
            >
              <Zap className="w-4 h-4 mr-2" />
              Create Standard Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {approvalWorkflows.map((workflow) => (
        <Card key={workflow.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {workflow.workflowName}
              </CardTitle>
              <div className="flex items-center gap-2">
                {workflow.bottleneckDetected && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Bottleneck
                  </Badge>
                )}
                {workflow.escalationTriggered && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Escalated
                  </Badge>
                )}
                <Badge variant="outline">
                  {workflow.progressPercentage}% Complete
                </Badge>
              </div>
            </div>
            <Progress value={workflow.progressPercentage} className="w-full" />
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {workflow.stages.map((stage, index) => (
                  <div key={stage.name} className="flex items-center gap-4 mb-4 last:mb-0">
                    {/* Stage indicator */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getStageColor(stage.status)}`}>
                      {getStageIcon(stage.status)}
                    </div>

                    {/* Stage content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{stage.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{stage.assignees.length} assignee{stage.assignees.length > 1 ? 's' : ''}</span>
                            {stage.estimatedDuration && (
                              <>
                                <Calendar className="w-3 h-3 ml-2" />
                                <span>~{stage.estimatedDuration}h</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Assignees */}
                        <div className="flex items-center gap-1">
                          {stage.assignees.slice(0, 3).map((assignee, idx) => (
                            <Avatar key={idx} className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {assignee.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {stage.assignees.length > 3 && (
                            <Badge variant="secondary" className="w-6 h-6 p-0 text-xs">
                              +{stage.assignees.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stage actions */}
                      {stage.status === 'pending' && workflow.currentStage === stage.name && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateWorkflowStage(workflow.id, stage.name)}
                          >
                            Start Stage
                          </Button>
                        </div>
                      )}

                      {stage.status === 'in_progress' && workflow.currentStage === stage.name && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const nextStageIndex = workflow.stages.findIndex(s => s.name === stage.name) + 1;
                              if (nextStageIndex < workflow.stages.length) {
                                updateWorkflowStage(workflow.id, workflow.stages[nextStageIndex].name);
                              }
                            }}
                          >
                            Complete & Continue
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      )}

                      {stage.completedAt && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Completed {formatDistanceToNow(new Date(stage.completedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>

                    {/* Connector line */}
                    {index < workflow.stages.length - 1 && (
                      <div className="absolute left-5 top-10 w-0.5 h-8 bg-muted" style={{
                        top: `${(index + 1) * 64 + 10}px`
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Workflow insights */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">Estimated Completion</div>
                  <div className="text-sm text-muted-foreground">
                    {workflow.estimatedCompletion ? 
                      formatDistanceToNow(new Date(workflow.estimatedCompletion), { addSuffix: true }) :
                      'Not estimated'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Current Assignees</div>
                  <div className="flex items-center gap-1 mt-1">
                    {workflow.stages
                      .find(s => s.name === workflow.currentStage)
                      ?.assignees.slice(0, 3)
                      .map((assignee, idx) => (
                        <Avatar key={idx} className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {assignee.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};