import { z } from 'zod';

/**
 * Policy Object Model (POM) - Structured policy data for RFP responses
 * Maps 1:1 to common RFP questions about AI governance
 */

// ============================================
// Sub-schemas for nested structures
// ============================================

export const ToolContextSchema = z.object({
  client_data_allowed: z.boolean(),
  public_data_only: z.boolean().optional(),
  pii_allowed: z.boolean().optional(),
});

export const ToolApprovalSchema = z.object({
  status: z.enum(['preapproved', 'conditional', 'requires_review', 'rejected']),
  by: z.string(),
  date: z.string(),
  conditions: z.array(z.string()).optional(),
});

export const AIToolSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  provider: z.string().optional(),
  purpose: z.array(z.string()),
  approval: ToolApprovalSchema,
  contexts: ToolContextSchema,
});

export const UsageDisclosureSchema = z.object({
  allowed_ai_usage: z.array(z.string()),
  disclosure_required: z.boolean(),
  disclosure_templates: z.array(z.string()).optional(),
});

export const DataControlsSchema = z.object({
  data_classes: z.array(z.string()),
  isolation: z.object({
    per_client_workspace: z.boolean(),
    per_project: z.boolean().optional(),
  }),
  retention: z.object({
    policy_days: z.number(),
    auto_delete: z.boolean().optional(),
  }).optional(),
  third_parties: z.object({
    llm_training_opt_out: z.boolean(),
    data_sharing_allowed: z.boolean().optional(),
  }).optional(),
});

export const ControlsSchema = z.object({
  hitl: z.object({
    required: z.boolean(),
    reviewers: z.array(z.string()),
    review_types: z.array(z.string()).optional(),
  }),
  validation: z.object({
    factual_check: z.boolean(),
    reference_required: z.boolean(),
    multi_source_verification: z.boolean().optional(),
  }),
  testing: z.object({
    regression: z.boolean().optional(),
    bias_testing: z.boolean().optional(),
    accuracy_benchmarks: z.boolean().optional(),
  }).optional(),
  bias: z.object({
    monitoring: z.boolean(),
    mitigation_strategies: z.array(z.string()).optional(),
  }).optional(),
  redaction: z.object({
    pii_redaction: z.boolean(),
    auto_redaction: z.boolean().optional(),
  }).optional(),
});

export const ClientPolicyRefSchema = z.object({
  client: z.string(),
  policy: z.string(),
  id: z.string(),
  version: z.string().optional(),
});

export const AlignmentSchema = z.object({
  client_policy_refs: z.array(ClientPolicyRefSchema),
  contractual_addenda: z.array(z.object({
    msa_clause: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export const AuditabilitySchema = z.object({
  log_scope: z.array(z.string()),
  signature: z.string(),
  export_formats: z.array(z.string()),
  retention_period_days: z.number().optional(),
});

export const GovernanceRoleSchema = z.object({
  role: z.string(),
  approves: z.array(z.string()),
  notification_required: z.boolean().optional(),
});

export const GovernanceSchema = z.object({
  roles: z.array(GovernanceRoleSchema),
  exceptions: z.object({
    process: z.string(),
    approver_role: z.string(),
  }).optional(),
  escalation_procedures: z.array(z.string()).optional(),
});

// ============================================
// Main Policy Object Model Schema
// ============================================

// Updated PolicyObjectModel Schema - Instance-Scoped
export const PolicyObjectModelSchema = z.object({
  policy_id: z.string(),
  version: z.string(),
  
  // Tool+Version binding (instance-specific)
  tool: z.object({
    name: z.string(),
    provider: z.string(),
    version: z.string(),
    id: z.string(), // tool_version_id
  }).optional(),
  
  // Use case definition (instance-specific)
  use_case: z.object({
    category: z.string(),
    jurisdiction: z.array(z.string()),
    audience: z.array(z.string()),
  }).optional(),
  
  // Data profile (instance-specific)
  data_profile: z.object({
    classes: z.array(z.string()), // ['PII', 'PHI', etc.]
    sources: z.array(z.string()),
    transfers: z.array(z.string()),
  }).optional(),
  
  // Risks (explicit)
  risks: z.array(z.object({
    id: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().optional(),
  })).optional(),
  
  // Existing fields
  scope: z.array(z.string()),
  usage_disclosure: UsageDisclosureSchema,
  tools: z.array(AIToolSchema), // Keep for multi-tool scenarios
  data_controls: DataControlsSchema,
  controls: ControlsSchema,
  
  // Guardrails (instance-specific)
  guardrails: z.object({
    blocked_actions: z.array(z.string()),
    override_protocol: z.string().optional(),
  }).optional(),
  
  // Evidence requirements (instance-specific)
  evidence: z.object({
    required_signals: z.array(z.string()),
  }).optional(),
  
  // Lifecycle (instance-specific)
  lifecycle: z.object({
    status: z.enum(['draft', 'in_review', 'approved', 'deprecated']),
    expires_at: z.string().optional(),
  }).optional(),
  
  alignment: AlignmentSchema,
  auditability: AuditabilitySchema,
  governance: GovernanceSchema,
  metadata: z.object({
    created_by: z.string(),
    created_at: z.string(),
    last_updated: z.string().optional(),
  }),
});

// ============================================
// Type Exports
// ============================================

export type ToolContext = z.infer<typeof ToolContextSchema>;
export type ToolApproval = z.infer<typeof ToolApprovalSchema>;
export type AITool = z.infer<typeof AIToolSchema>;
export type UsageDisclosure = z.infer<typeof UsageDisclosureSchema>;
export type DataControls = z.infer<typeof DataControlsSchema>;
export type Controls = z.infer<typeof ControlsSchema>;
export type ClientPolicyRef = z.infer<typeof ClientPolicyRefSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type Auditability = z.infer<typeof AuditabilitySchema>;
export type GovernanceRole = z.infer<typeof GovernanceRoleSchema>;
export type Governance = z.infer<typeof GovernanceSchema>;
export type PolicyObjectModel = z.infer<typeof PolicyObjectModelSchema>;

// ============================================
// Additional types for related entities
// ============================================

export interface PolicyGap {
  id: string;
  policy_id: string;
  field_path: string;
  gap_type: 'missing' | 'invalid' | 'incomplete';
  severity: 1 | 2 | 3 | 4 | 5;
  hint?: string;
  detected_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface PolicyAlignment {
  id: string;
  policy_id: string;
  client_id?: string;
  client_enterprise_id?: string;
  external_policy_id?: string;
  external_policy_name?: string;
  snapshot_id: string;
  harmonized_pom: PolicyObjectModel;
  conflicts: Array<{
    field_path: string;
    agency_value: any;
    client_value: any;
    severity: 'high' | 'medium' | 'low';
  }>;
  created_at: string;
  updated_at: string;
}

export interface RFPProfile {
  id: string;
  profile_id: string;
  name: string;
  description?: string;
  client_name?: string;
  requires: string[];
  theme_weights: {
    disclosure?: number;
    tools?: number;
    data?: number;
    controls?: number;
    audit?: number;
    alignment?: number;
    governance?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ProofBundle {
  bundle_id: string;
  client_name: string;
  rfp_id?: string;
  workflow_trace: Array<{
    timestamp: string;
    event_type: string;
    actor_id?: string;
    details: any;
  }>;
  artifacts: {
    submission?: any;
    policy_snapshot?: PolicyObjectModel;
    audit_trail?: any[];
    approval_record?: any;
  };
  hash: string;
  created_by?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface PolicyIngestMapping {
  id: string;
  source_type: string;
  extractor_version: string;
  mapping_rules: Record<string, any>;
  field_extractors?: Record<string, any>;
  validation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// Validation Helper Functions
// ============================================

export function validatePOM(pom: unknown): { valid: boolean; errors?: z.ZodError } {
  const result = PolicyObjectModelSchema.safeParse(pom);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, errors: result.error };
}

export function isPOMComplete(pom: PolicyObjectModel, requiredFields: string[]): boolean {
  // Simple implementation - can be enhanced with JSONPath queries
  const pomJson = JSON.stringify(pom);
  return requiredFields.every(field => {
    // Basic check - should use proper JSONPath library for production
    return pomJson.includes(field.split('.')[0]);
  });
}
