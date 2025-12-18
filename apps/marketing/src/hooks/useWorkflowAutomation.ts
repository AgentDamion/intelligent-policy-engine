import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowTrigger {
  id: string;
  type: 'policy_recommendation' | 'conflict_detection' | 'approval_routing' | 'compliance_alert';
  conditions: any;
  actions: any;
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AutomatedAction {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: any;
  triggeredAt: Date;
  completedAt?: Date;
  error?: string;
}

export const useWorkflowAutomation = () => {
  const { toast } = useToast();
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [automatedActions, setAutomatedActions] = useState<AutomatedAction[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize default workflow triggers
  useEffect(() => {
    const defaultTriggers: WorkflowTrigger[] = [
      {
        id: 'policy-recommendations',
        type: 'policy_recommendation',
        conditions: { toolUsageThreshold: 5, clientCount: 2 },
        actions: { generateRecommendation: true, notifyAdmin: true },
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'auto-conflict-detection',
        type: 'conflict_detection',
        conditions: { newToolSubmission: true, riskLevel: 'medium' },
        actions: { runConflictScan: true, alertStakeholders: true },
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'smart-approval-routing',
        type: 'approval_routing',
        conditions: { riskLevel: 'high', clientTier: 'enterprise' },
        actions: { escalateToSenior: true, requireDualApproval: true },
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'compliance-alerts',
        type: 'compliance_alert',
        conditions: { complianceScore: 85, trend: 'declining' },
        actions: { sendAlert: true, scheduleReview: true },
        enabled: true,
        triggerCount: 0
      }
    ];
    setTriggers(defaultTriggers);
  }, []);

  const triggerAutomation = useCallback(async (triggerType: string, data: any) => {
    const trigger = triggers.find(t => t.type === triggerType && t.enabled);
    if (!trigger) return;

    const action: AutomatedAction = {
      id: `action-${Date.now()}`,
      type: triggerType,
      status: 'pending',
      data,
      triggeredAt: new Date()
    };

    setAutomatedActions(prev => [action, ...prev]);

    // Simulate processing
    setTimeout(() => {
      setAutomatedActions(prev => 
        prev.map(a => 
          a.id === action.id 
            ? { ...a, status: 'in_progress' as const }
            : a
        )
      );

      // Complete after another delay
      setTimeout(() => {
        setAutomatedActions(prev => 
          prev.map(a => 
            a.id === action.id 
              ? { ...a, status: 'completed' as const, completedAt: new Date() }
              : a
          )
        );

        // Update trigger count
        setTriggers(prev => 
          prev.map(t => 
            t.id === trigger.id 
              ? { ...t, triggerCount: t.triggerCount + 1, lastTriggered: new Date() }
              : t
          )
        );

        toast({
          title: "Workflow Triggered",
          description: `Automated ${triggerType.replace('_', ' ')} completed successfully.`,
        });
      }, 2000);
    }, 1000);
  }, [triggers, toast]);

  const generatePolicyRecommendation = useCallback((toolUsageData: any) => {
    triggerAutomation('policy_recommendation', {
      toolUsageData,
      recommendation: 'Consider implementing stricter AI tool governance policies',
      priority: 'medium'
    });
  }, [triggerAutomation]);

  const detectConflicts = useCallback((newTool: any) => {
    triggerAutomation('conflict_detection', {
      newTool,
      conflicts: ['Policy version mismatch detected', 'Risk profile conflict'],
      severity: 'medium'
    });
  }, [triggerAutomation]);

  const routeApproval = useCallback((submission: any) => {
    triggerAutomation('approval_routing', {
      submission,
      route: submission.riskLevel === 'high' ? 'senior_admin' : 'standard',
      estimatedTime: submission.riskLevel === 'high' ? '2-3 days' : '1 day'
    });
  }, [triggerAutomation]);

  const sendComplianceAlert = useCallback((complianceData: any) => {
    triggerAutomation('compliance_alert', {
      complianceData,
      alertType: 'declining_compliance',
      actions: ['Schedule review', 'Update policies']
    });
  }, [triggerAutomation]);

  const toggleTrigger = useCallback((triggerId: string) => {
    setTriggers(prev => 
      prev.map(t => 
        t.id === triggerId 
          ? { ...t, enabled: !t.enabled }
          : t
      )
    );
  }, []);

  const clearCompletedActions = useCallback(() => {
    setAutomatedActions(prev => prev.filter(a => a.status !== 'completed'));
  }, []);

  return {
    triggers,
    automatedActions,
    loading,
    // Trigger functions
    generatePolicyRecommendation,
    detectConflicts,
    routeApproval,
    sendComplianceAlert,
    // Management functions
    toggleTrigger,
    clearCompletedActions,
    triggerAutomation
  };
};