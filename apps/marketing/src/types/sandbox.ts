export type ControlLevel = 'strict' | 'standard' | 'permissive';
export type ApprovalAction = 'approve' | 'reject' | 'request_changes';
export type ApproverRole = 'admin' | 'reviewer' | 'compliance_officer';
export type ExportFormat = 'pdf' | 'excel' | 'json';
export type RecipientRole = 'internal' | 'external';
export type SandboxStatus = 'pending' | 'running' | 'completed' | 'failed' | 'pending_approval' | 'approved' | 'rejected' | 'changes_requested';

export interface TestScenario {
  description: string;
  inputs: Record<string, unknown>;
  expected_outcome: 'approve' | 'reject' | 'conditional';
}

export interface SandboxRunInput {
  policy_id: string;
  test_scenario: TestScenario;
  control_level: ControlLevel;
  workspace_id: string;
  enterprise_id: string;
}

export interface SimulationOutputs {
  compliance_score: number;
  validation_result: 'pass' | 'fail';
  risk_flags: string[];
  policy_matched: boolean;
  controls_applied: string;
  processing_time_ms: number;
}

export interface SandboxRun {
  id: string;
  policy_id: string;
  project_id?: string | null;
  workspace_id: string;
  enterprise_id: string;
  run_by: string;
  inputs_json: Record<string, unknown>;
  outputs_json: SimulationOutputs;
  control_level: ControlLevel;
  proof_hash: string;
  status: SandboxStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    is_sample?: boolean;
    [key: string]: unknown;
  };
}

export interface ApprovalInput {
  run_id: string;
  approval_action: ApprovalAction;
  approver_role: ApproverRole;
  comments?: string;
  conditions?: string;
  workspace_id: string;
}

export interface SandboxApproval {
  id: string;
  run_id: string;
  approver_id: string;
  approver_role: ApproverRole;
  approval_action: ApprovalAction;
  comments?: string;
  conditions?: string;
  created_at: string;
}

export interface ExportInput {
  run_id: string;
  format: ExportFormat;
  include_sections?: string[];
  recipient_role: RecipientRole;
  workspace_id: string;
}

export interface ExportResult {
  export_id: string;
  download_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
  duration_ms: number;
}

export interface GovernanceEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  metadata: Record<string, unknown>;
  workspace_id?: string;
  enterprise_id?: string;
  actor_id?: string;
  created_at: string;
}
