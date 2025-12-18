import { PolicyObjectModel } from './policyObjectModel';

export type ProvenanceSourceType = 'template' | 'instance' | 'scoped_policy' | 'client_clause';

export interface FieldProvenance {
  source_type: ProvenanceSourceType;
  source_id: string;
  source_path?: string;
  clause_id?: string;
  confidence?: number;
  applied_at?: string;
}

export interface EffectivePolicySnapshot {
  id: string;
  policy_instance_id: string;
  scope_id?: string;
  effective_pom: PolicyObjectModel;
  content_hash: string;
  field_provenance: Record<string, FieldProvenance>;
  version: number;
  created_at: string;
  activated_at?: string;
  enterprise_id: string;
  workspace_id?: string;
}

export interface ValidationEvent {
  id: string;
  timestamp: string;
  tool_version_id: string;
  workspace_id: string;
  enterprise_id: string;
  policy_instance_id: string;
  eps_id: string;
  eps_hash: string;
  scope_path?: string;
  decision: 'allowed' | 'blocked' | 'warn';
  violations: any[];
  warnings: any[];
  usage_context: Record<string, any>;
  response_time_ms?: number;
}
