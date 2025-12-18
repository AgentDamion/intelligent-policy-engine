import { PolicyObjectModel } from './policyObjectModel';

export interface PolicyInstance {
  id: string;
  template_id?: string;
  tool_version_id: string;
  use_case: string;
  jurisdiction: string[];
  audience: string[];
  pom: PolicyObjectModel;
  status: PolicyInstanceStatus;
  created_by?: string;
  updated_by?: string;
  approved_by?: string;
  approved_at?: string;
  expires_at?: string;
  enterprise_id: string;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

export type PolicyInstanceStatus = 'draft' | 'in_review' | 'approved' | 'active' | 'deprecated';

export interface CreatePolicyInstanceInput {
  template_id?: string;
  tool_version_id: string;
  use_case: string;
  jurisdiction: string[];
  audience: string[];
  pom: PolicyObjectModel;
  enterprise_id: string;
  workspace_id?: string;
}

export interface UpdatePolicyInstanceInput {
  use_case?: string;
  jurisdiction?: string[];
  audience?: string[];
  pom?: PolicyObjectModel;
  status?: PolicyInstanceStatus;
  expires_at?: string;
}
