import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

export const PolicyFindingSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  code: z.string().optional(),
})

export const ComplianceMetadataSchema = z.object({
  aicomplyr: z.object({
    version: z.string(),
    generated_at: z.string(),
    project_id: z.string(),
    organization_id: z.string(),
    activity_id: z.string().optional(),
  }),
  compliance: z.object({
    status: z.enum(['compliant', 'warning', 'violation']),
    score: z.number().min(0).max(100),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    last_checked: z.string(),
    next_check_due: z.string().optional(),
  }),
  ai_tools: z.array(z.object({
    tool_name: z.string(),
    tool_version: z.string().optional(),
    usage_type: z.string(),
    approval_status: z.enum(['approved', 'pending', 'denied']),
    evidence_files: z.array(z.string()),
    usage_timestamp: z.string(),
  })),
  policy_checks: z.array(z.object({
    policy_id: z.string(),
    policy_name: z.string(),
    policy_version: z.string(),
    status: z.enum(['passed', 'failed', 'warning']),
    findings: z.array(PolicyFindingSchema),
    checked_at: z.string(),
  })),
  violations: z.array(z.object({
    violation_id: z.string(),
    violation_type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    corrective_actions: z.array(z.string()),
    detected_at: z.string(),
  })),
  references: z.object({
    detailed_report_url: z.string(),
    audit_trail_url: z.string(),
    compliance_certificate_url: z.string().optional(),
    source_activity_url: z.string().optional(),
  }),
  platform_specific: z.record(z.any()).optional(),
})

export const PlatformCredentialsSchema = z.object({
  platform: z.string(),
  auth_type: z.enum(['oauth2', 'api_key', 'basic', 'session', 'jwt']),
  credentials: z.object({
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    api_key: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    session_id: z.string().optional(),
    jwt_token: z.string().optional(),
    custom_fields: z.record(z.string()).optional(),
  }),
  endpoints: z.object({
    base_url: z.string(),
    auth_url: z.string().optional(),
    token_url: z.string().optional(),
    api_version: z.string().optional(),
  }),
  expires_at: z.string().optional(),
})

export const FileUploadRequestSchema = z.object({
  file: z.object({
    name: z.string(),
    content: z.union([z.string(), z.instanceof(Uint8Array)]),
    mime_type: z.string(),
    size: z.number().nonnegative(),
  }),
  metadata: ComplianceMetadataSchema,
  project_id: z.string().optional(),
  folder_path: z.string().optional(),
  overwrite: z.boolean().optional(),
  lifecycle_state: z.string().optional(),
})


