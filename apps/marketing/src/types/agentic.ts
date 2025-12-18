import { Database } from '@/integrations/supabase/types';

// Extract agent_activities type from Supabase
export type AgentActivityRow = Database['public']['Tables']['agent_activities']['Row'];

// Enhanced type with parsed details
export interface AgentActivity {
  id: number;
  agent: string;
  action: string;
  status: string | null;
  details: {
    reasoning?: string;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    pattern?: string;
    evidence_count?: number;
    root_cause?: string;
    harmonization_status?: string;
    action_taken?: string;
    mentioned_users?: string[];
  } | null;
  workspace_id: string | null;
  enterprise_id: string | null;
  created_at: string;
}

export interface AgentThread {
  id: string;
  title: string;
  activities: AgentActivity[];
  participants: string[];
  activityCount: number;
  lastActivityTime: string;
  status: 'active' | 'complete' | 'error';
  meta: {
    policyId?: string;
    decisionId?: string;
    workflowId?: string;
  };
}

export interface TransformedMessage {
  id: string;
  agent: string;
  time: string;
  text: string;
  chips?: { label: string; kind?: 'agent' | 'status' | 'fact' }[];
}
