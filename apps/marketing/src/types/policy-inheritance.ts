export type ScopeType = 'enterprise' | 'region' | 'country' | 'brand';

export type PolicyInheritanceMode = 'replace' | 'merge' | 'append';

export interface Scope {
  id: string;
  scope_name: string;
  scope_type: string;
  scope_path: unknown;
  enterprise_id: string;
  parent_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  compliance_frameworks?: string[];
  region?: string;
  country_code?: string;
  data_class?: string;
  children?: Scope[];
  policy_count?: number;
  // Computed properties
  name?: string;
  parent_scope_id?: string;
}

export interface PolicyConflict {
  id: string;
  policy_id: string;
  parent_policy_id: string;
  conflict_type: 'stricter' | 'looser' | 'incompatible';
  severity: 'info' | 'warning' | 'error';
  conflicting_rule: string;
  parent_value: any;
  child_value: any;
  description: string;
  resolution_status: 'unresolved' | 'resolved' | 'acknowledged';
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface ScopedPolicy {
  id: string;
  scope_id: string;
  scope_path: string;
  scope_name: string;
  scope_type: ScopeType;
  policy_name: string;
  inheritance_mode: PolicyInheritanceMode;
  rules: Record<string, any>;
  override_rules?: Record<string, any>;
  enterprise_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  parent_policy_id?: string;
  conflict_count?: number;
}

export interface EffectivePolicy {
  scope_id: string;
  scope_path: string;
  effective_rules: Record<string, any>;
  rule_provenance: {
    [ruleKey: string]: {
      value: any;
      source_scope_id: string;
      source_scope_path: string;
      source_scope_type: ScopeType;
      inheritance_mode: PolicyInheritanceMode;
    };
  };
  contributing_policies: {
    policy_id: string;
    scope_path: string;
    inheritance_mode: PolicyInheritanceMode;
    rules_contributed: string[];
  }[];
  computed_at: string;
}

export interface PolicyTreeNode {
  policy: ScopedPolicy;
  children: PolicyTreeNode[];
  hasConflicts: boolean;
  effectiveRules?: Record<string, any>;
}

export interface ScopeHierarchy {
  enterprise: Scope;
  regions: Scope[];
  countries: Scope[];
  brands: Scope[];
  tree: Scope;
}
