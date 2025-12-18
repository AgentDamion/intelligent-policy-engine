import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceMetrics {
  tools_approved: number;
  tools_flagged: number;
  metaloop_learnings: number;
  compliance_score: number;
}

export interface AgentStatus {
  agent_name: string;
  status: string;
  last_activity: string;
}

export interface ActiveWorkflow {
  workflow_name: string;
  progress: number;
  status: string;
}

export interface QuickAction {
  label: string;
  count: number;
  action: string;
  target: string;
}

export const useComplianceData = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [workflows, setWorkflows] = useState<ActiveWorkflow[]>([]);
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data since compliance tables don't exist yet
      const mockMetrics: ComplianceMetrics = {
        tools_approved: 85,
        tools_flagged: 12,
        metaloop_learnings: 247,
        compliance_score: 94
      };

      const mockAgents: AgentStatus[] = [
        { agent_name: 'Policy Validator', status: 'active', last_activity: '2 minutes ago' },
        { agent_name: 'Risk Assessor', status: 'active', last_activity: '5 minutes ago' },
        { agent_name: 'Compliance Monitor', status: 'idle', last_activity: '15 minutes ago' }
      ];

      const mockWorkflows: ActiveWorkflow[] = [
        { workflow_name: 'Tool Approval Process', progress: 75, status: 'in_progress' },
        { workflow_name: 'Risk Assessment Review', progress: 100, status: 'completed' },
        { workflow_name: 'Policy Distribution', progress: 45, status: 'in_progress' }
      ];

      const mockActions: QuickAction[] = [
        { label: 'Review Pending Submissions', count: 8, action: 'navigate', target: '/submissions' },
        { label: 'Update Policy Templates', count: 3, action: 'navigate', target: '/policies' },
        { label: 'Generate Compliance Report', count: 0, action: 'generate', target: '/reports' }
      ];

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));

      setMetrics(mockMetrics);
      setAgents(mockAgents);
      setWorkflows(mockWorkflows);
      setActions(mockActions);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscriptions would be set up here once the tables exist
    // For now, just fetch initial mock data
  }, []);

  return {
    metrics,
    agents,
    workflows: workflows,
    actions,
    loading,
    error,
    refetch: fetchData
  };
};