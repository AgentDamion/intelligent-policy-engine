export type SandboxProjectStatus = 'active' | 'completed' | 'archived';
export type SandboxProjectMode = 'tool_evaluation' | 'policy_adaptation' | 'partner_governance';

export interface SandboxProject {
  id: string;
  project_name: string;
  project_description?: string;
  project_goal?: string;
  workspace_id: string;
  enterprise_id: string;
  created_by?: string;
  status: SandboxProjectStatus;
  mode?: SandboxProjectMode;
  started_at: string;
  target_completion_date?: string;
  completed_at?: string;
  tags?: string[];
  settings?: Record<string, unknown>;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSandboxProjectInput {
  project_name: string;
  project_description?: string;
  project_goal?: string;
  workspace_id: string;
  enterprise_id: string;
  target_completion_date?: string;
  tags?: string[];
  mode?: SandboxProjectMode;
}

export interface UpdateSandboxProjectInput {
  project_name?: string;
  project_description?: string;
  project_goal?: string;
  status?: SandboxProjectStatus;
  target_completion_date?: string;
  completed_at?: string;
  tags?: string[];
  settings?: Record<string, unknown>;
}
