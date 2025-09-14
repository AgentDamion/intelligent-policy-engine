/**
 * Deterministic Input/Output Contracts
 * Schema-first approach to prevent agent drift and ensure reliability
 * Based on lessons from Mohit Aggarwal's hackathon experience
 */

import { z } from "zod";

// ===== INPUT CONTRACTS =====

export const PolicyDocIn = z.object({
  enterpriseId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  mimeType: z.enum(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  blobUrl: z.string().url().optional(),
  checksumSha256: z.string().length(64),
  sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB limit
  redactionStatus: z.enum(["none", "partial", "full"]).default("none"),
  phiToggle: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium")
});

export const ToolSubmissionIn = z.object({
  enterpriseId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  toolName: z.string().min(1).max(255),
  toolDescription: z.string().min(10).max(2000),
  toolCategory: z.enum(["content_generation", "data_analysis", "communication", "automation", "other"]),
  dataTypes: z.array(z.enum(["text", "images", "audio", "video", "structured_data", "personal_data"])),
  usageContext: z.string().min(10).max(1000),
  clientFacing: z.boolean(),
  regulatoryRequirements: z.array(z.enum(["GDPR", "HIPAA", "SOX", "PCI-DSS", "FDA", "other"])),
  urgencyLevel: z.number().min(0).max(1).default(0.5)
});

export const ComplianceRequestIn = z.object({
  enterpriseId: z.string().uuid(),
  requestType: z.enum(["policy_review", "audit_request", "violation_report", "approval_request"]),
  context: z.string().min(10).max(5000),
  attachments: z.array(PolicyDocIn).optional(),
  deadline: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium")
});

// ===== OUTPUT CONTRACTS =====

export const ParsedDocOut = z.object({
  docId: z.string().uuid(),
  pages: z.number().int().min(1),
  tables: z.array(z.object({ 
    rows: z.number().int().min(1), 
    cols: z.number().int().min(1),
    content: z.array(z.array(z.string()))
  })),
  text: z.string().min(1),
  method: z.enum(["gdocai", "textract", "template", "fallback"]),
  confidence: z.number().min(0).max(1),
  entities: z.array(z.object({
    text: z.string(),
    type: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  processingTimeMs: z.number().int().min(0),
  errorDetails: z.string().optional()
});

export const PolicyDecision = z.object({
  decision: z.enum(["approve", "reject", "needs_info", "conditional_approval"]),
  rationale: z.string().min(20).max(2000),
  requiredControls: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  complianceStatus: z.enum(["compliant", "non_compliant", "conditional", "unknown"]),
  humanReviewRequired: z.boolean(),
  estimatedReviewTime: z.string().optional()
});

export const ToolAnalysis = z.object({
  toolId: z.string().uuid(),
  approvalStatus: z.enum(["approved", "rejected", "pending_review", "conditional"]),
  riskAssessment: z.object({
    overallRisk: z.enum(["low", "medium", "high", "critical"]),
    riskFactors: z.array(z.string()),
    mitigationStrategies: z.array(z.string())
  }),
  complianceCheck: z.object({
    gdpr: z.enum(["compliant", "non_compliant", "conditional", "not_applicable"]),
    hipaa: z.enum(["compliant", "non_compliant", "conditional", "not_applicable"]),
    industry: z.enum(["compliant", "non_compliant", "conditional", "not_applicable"])
  }),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  humanReviewRequired: z.boolean()
});

export const AuditTrailEntry = z.object({
  traceId: z.string().uuid(),
  timestamp: z.string().datetime(),
  agentName: z.string(),
  action: z.string(),
  input: z.record(z.any()),
  output: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  processingTimeMs: z.number().int().min(0),
  errorDetails: z.string().optional(),
  schemaVersion: z.string().default("v1")
});

// ===== VALIDATION CONTRACTS =====

export const RuleEngineResult = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  outcome: z.enum(["STRICT_PASS", "STRICT_FAIL", "SOFT_WARN"]),
  message: z.string(),
  confidence: z.number().min(0).max(1),
  applicable: z.boolean()
});

export const ValidationResult = z.object({
  overall: z.enum(["STRICT_PASS", "STRICT_FAIL", "SOFT_WARN"]),
  rules: z.array(RuleEngineResult),
  confidence: z.number().min(0).max(1),
  humanReviewRequired: z.boolean(),
  recommendations: z.array(z.string())
});

export const ConfidenceCalculation = z.object({
  parserMethod: z.number().min(0).max(1),
  schemaConformance: z.number().min(0).max(1),
  ruleOutcome: z.number().min(0).max(1),
  modelReliability: z.number().min(0).max(1),
  historicalAgreement: z.number().min(0).max(1),
  finalConfidence: z.number().min(0).max(1),
  breakdown: z.record(z.number())
});

// ===== ORCHESTRATION CONTRACTS =====

export const ProcessingBudget = z.object({
  maxLatencyMs: z.number().int().min(100).max(30000),
  maxSteps: z.number().int().min(1).max(10),
  maxTokens: z.number().int().min(100).max(10000),
  maxCostUsd: z.number().min(0.01).max(10.0)
});

export const ProcessingContext = z.object({
  traceId: z.string().uuid(),
  schemaVersion: z.string().default("v1"),
  model: z.string(),
  toolVersions: z.record(z.string()),
  inputHash: z.string().length(64),
  budget: ProcessingBudget,
  startTime: z.string().datetime(),
  enterpriseId: z.string().uuid(),
  userId: z.string().uuid().optional()
});

export const ProcessingResult = z.object({
  success: z.boolean(),
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  traceId: z.string().uuid(),
  processingTimeMs: z.number().int().min(0),
  budgetUsed: z.object({
    latencyMs: z.number().int().min(0),
    steps: z.number().int().min(0),
    tokens: z.number().int().min(0),
    costUsd: z.number().min(0)
  }),
  confidence: z.number().min(0).max(1),
  humanReviewRequired: z.boolean()
});

// ===== OBSERVABILITY CONTRACTS =====

export const SLOMetrics = z.object({
  parsingSuccessRate: z.number().min(0).max(1),
  schemaValidationPassRate: z.number().min(0).max(1),
  ruleEngineStrictPassRate: z.number().min(0).max(1),
  humanReviewRate: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  timeWindow: z.string().default("1h")
});

export const DriftMetrics = z.object({
  agentSchemaFailRate: z.number().min(0).max(1),
  humanInterventionRate: z.number().min(0).max(1),
  confidenceDrift: z.number().min(-1).max(1),
  processingTimeDrift: z.number().min(-1).max(1),
  timestamp: z.string().datetime(),
  timeWindow: z.string().default("1h")
});

// ===== HELPER TYPES =====

export type PolicyDocInType = z.infer<typeof PolicyDocIn>;
export type ToolSubmissionInType = z.infer<typeof ToolSubmissionIn>;
export type ComplianceRequestInType = z.infer<typeof ComplianceRequestIn>;

export type ParsedDocOutType = z.infer<typeof ParsedDocOut>;
export type PolicyDecisionType = z.infer<typeof PolicyDecision>;
export type ToolAnalysisType = z.infer<typeof ToolAnalysis>;
export type AuditTrailEntryType = z.infer<typeof AuditTrailEntry>;

export type RuleEngineResultType = z.infer<typeof RuleEngineResult>;
export type ValidationResultType = z.infer<typeof ValidationResult>;
export type ConfidenceCalculationType = z.infer<typeof ConfidenceCalculation>;

export type ProcessingBudgetType = z.infer<typeof ProcessingBudget>;
export type ProcessingContextType = z.infer<typeof ProcessingContext>;
export type ProcessingResultType = z.infer<typeof ProcessingResult>;

export type SLOMetricsType = z.infer<typeof SLOMetrics>;
export type DriftMetricsType = z.infer<typeof DriftMetrics>;

// ===== VALIDATION HELPERS =====

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Schema validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function validateOutput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Output validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// ===== SCHEMA VERSIONING =====

export const SCHEMA_VERSIONS = {
  v1: "2024-01-01",
  v2: "2024-02-01", // Future version
} as const;

export type SchemaVersion = keyof typeof SCHEMA_VERSIONS;

export function getSchemaVersion(): SchemaVersion {
  return "v1";
}

export function isSchemaVersionSupported(version: string): version is SchemaVersion {
  return version in SCHEMA_VERSIONS;
}