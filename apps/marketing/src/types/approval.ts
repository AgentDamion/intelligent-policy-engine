// Generic Approval Types

export interface Approval {
  id: string;
  object_type: ApprovalObjectType;
  object_id: string;
  stage: string;
  required_roles: string[];
  decision?: ApprovalDecision;
  decided_by?: string;
  decided_at?: string;
  rationale?: string;
  conditions: string[];
  created_at: string;
}

export type ApprovalObjectType = 
  | 'policy_instance'
  | 'sandbox_run'
  | 'policy_template'
  | 'runtime_binding';

export type ApprovalDecision = 'approved' | 'rejected' | 'conditional';

export interface CreateApprovalInput {
  object_type: ApprovalObjectType;
  object_id: string;
  stage: string;
  required_roles?: string[];
}

export interface SubmitApprovalDecisionInput {
  decision: ApprovalDecision;
  rationale?: string;
  conditions?: string[];
}
