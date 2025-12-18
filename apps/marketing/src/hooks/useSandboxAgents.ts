import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  confidence?: number;
  riskLevel?: string;
  reasoning?: string;
  metadata?: any;
  timestamp: Date;
}

export const useSandboxAgents = () => {
  const [agentActivity, setAgentActivity] = useState<AgentActivity[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addActivity = (agent: string, action: string): string => {
    const id = `${agent}-${action}-${Date.now()}`;
    const activity: AgentActivity = {
      id,
      agent,
      action,
      status: 'pending',
      timestamp: new Date(),
    };
    setAgentActivity(prev => [...prev, activity]);
    return id;
  };

  const updateActivity = (id: string, updates: Partial<AgentActivity>) => {
    setAgentActivity(prev => 
      prev.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  };

  const runIntelligentSimulation = async (params: {
    policy_id: string;
    test_scenario: any;
    control_level: string;
    workspace_id: string;
    enterprise_id: string;
  }) => {
    setIsProcessing(true);
    setAgentActivity([]);

    try {
      // Step 1: Policy Validation
      const policyActivityId = addActivity('policy', 'validate');
      updateActivity(policyActivityId, { status: 'processing' });
      
      // Step 2: Sandbox Simulation
      const sandboxActivityId = addActivity('sandbox', 'simulate_policy_execution');
      updateActivity(sandboxActivityId, { status: 'processing' });
      
      // Step 3: Compliance Scoring
      const complianceActivityId = addActivity('compliance', 'score');
      updateActivity(complianceActivityId, { status: 'processing' });
      
      // Step 4: Risk Assessment
      const riskActivityId = addActivity('sandbox', 'detect_anomalies');
      updateActivity(riskActivityId, { status: 'processing' });

      // Execute the actual simulation via sandbox-run edge function
      const { data, error } = await supabase.functions.invoke('sandbox-run', {
        body: params
      });

      if (error) throw error;

      // Update all activities as success
      updateActivity(policyActivityId, { 
        status: 'success',
        confidence: data.outputs?.agent_confidence || 0.7,
        riskLevel: data.outputs?.risk_flags?.length > 0 ? 'high' : 'low'
      });
      
      updateActivity(sandboxActivityId, { 
        status: 'success',
        confidence: data.outputs?.agent_confidence || 0.7,
        metadata: data.outputs?.agent_metadata?.simulation_details
      });
      
      updateActivity(complianceActivityId, { 
        status: 'success',
        confidence: data.outputs?.agent_confidence || 0.7,
        metadata: { score: data.outputs?.compliance_score }
      });
      
      updateActivity(riskActivityId, { 
        status: 'success',
        confidence: data.outputs?.agent_confidence || 0.7,
        metadata: { flags: data.outputs?.risk_flags }
      });

      setIsProcessing(false);
      return { success: true, data };

    } catch (error) {
      console.error('Intelligent simulation failed:', error);
      
      // Mark all activities as failed
      agentActivity.forEach(activity => {
        if (activity.status !== 'success') {
          updateActivity(activity.id, { 
            status: 'failed',
            reasoning: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
      
      setIsProcessing(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const generateTestScenarios = async (policyId: string) => {
    const activityId = addActivity('sandbox', 'generate_test_scenarios');
    updateActivity(activityId, { status: 'processing' });

    try {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agentName: 'sandbox',
          action: 'generate_test_scenarios',
          input: { policy: { id: policyId } },
          context: {}
        }
      });

      if (error) throw error;

      updateActivity(activityId, {
        status: 'success',
        confidence: data.result?.confidence || 0.8,
        metadata: data.result?.metadata
      });

      return {
        success: true,
        scenarios: data.result?.metadata?.scenarios || []
      };
    } catch (error) {
      updateActivity(activityId, {
        status: 'failed',
        reasoning: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const clearActivity = () => {
    setAgentActivity([]);
  };

  return {
    agentActivity,
    isProcessing,
    runIntelligentSimulation,
    generateTestScenarios,
    clearActivity
  };
};
