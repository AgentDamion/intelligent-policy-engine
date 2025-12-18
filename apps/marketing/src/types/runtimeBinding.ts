// Runtime Bindings - Approved Policy Instances to Workspaces/Partners

export interface RuntimeBinding {
  id: string;
  policy_instance_id: string;
  partner_id?: string;
  workspace_id?: string;
  enterprise_id: string;
  status: RuntimeBindingStatus;
  activated_at: string;
  deactivated_at?: string;
  last_verified_at?: string;
  violation_count: number;
  created_at: string;
  updated_at: string;
}

export type RuntimeBindingStatus = 'active' | 'suspended' | 'deprecated';

export interface CreateRuntimeBindingInput {
  policy_instance_id: string;
  workspace_id?: string;
  partner_id?: string;
  enterprise_id: string;
}

export interface UpdateRuntimeBindingInput {
  status?: RuntimeBindingStatus;
  deactivated_at?: string;
}
