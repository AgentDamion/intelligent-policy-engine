// ================================
// AGO (AI Governance Officer) TYPES
// ================================
// Type definitions for AGO Orchestrator Agent (Alexi)

export type AgoTaskType =
  | 'EVALUATE_SUBMISSION'
  | 'RUN_AUDIT'
  | 'HANDLE_NEW_TOOL'
  | 'GENERATE_BOUNDARY_BRIEF';

export interface AgoTaskBase {
  taskId: string;
  enterpriseId: string;
  requestedByUserId: string;
  taskType: AgoTaskType;
  createdAt: string; // ISO
}

export interface EvaluateSubmissionTask extends AgoTaskBase {
  taskType: 'EVALUATE_SUBMISSION';
  submissionId: string;
}

export interface RunAuditTask extends AgoTaskBase {
  taskType: 'RUN_AUDIT';
  brands?: string[];
  regions?: string[];
  channels?: string[];
  agencyIds?: string[];
  toolIds?: string[];
  from: string; // ISO
  to: string;   // ISO
}

export interface HandleNewToolTask extends AgoTaskBase {
  taskType: 'HANDLE_NEW_TOOL';
  toolId: string;
  firstSeenContext: {
    submissionId: string;
    agencyId: string;
    brand: string;
    region: string;
    channel: string;
  };
}

export interface GenerateBoundaryBriefTask extends AgoTaskBase {
  taskType: 'GENERATE_BOUNDARY_BRIEF';
  from: string;
  to: string;
}

export type AgoTask =
  | EvaluateSubmissionTask
  | RunAuditTask
  | HandleNewToolTask
  | GenerateBoundaryBriefTask;

// ==== Data structures AGO uses ====

export interface SubmissionContext {
  submissionId: string;
  enterpriseId: string;
  agencyId: string;
  brand: string;
  region: string;
  channel: string;
  createdAt: string;
}

export interface ToolUsageEvent {
  eventId: string;
  submissionId: string;
  toolId: string;
  toolKey: string; // normalized tool identifier
  vendor: string;
  modelVersion: string | null;
  purposeTag: string | null; // e.g. "copy_drafting", "concept_art"
  calledAt: string; // ISO
  callerRole: string; // role claim, not PII
  epsSnapshotId: string | null;
}

export type PolicyDecisionStatus =
  | 'AUTO_COMPLIANT'
  | 'COMPLIANT_WITH_WARNING'
  | 'REQUIRES_HUMAN_DECISION'
  | 'NON_COMPLIANT';

export type VeraMode = 'disabled' | 'shadow' | 'enforcement';

export interface ToolRuleContext {
  brand: string;
  region: string;
  channel: string;
  status: 'ALLOWED' | 'DENIED' | 'ALLOWED_WITH_GUARDRAILS';
  guardrails?: string[];
  epsId: string;
}

export interface ToolRuleSet {
  toolId: string;
  toolKey: string;
  ruleContexts: ToolRuleContext[];
}

export interface EffectivePolicySnapshot {
  epsId: string;
  enterpriseId: string;
  version: number;
  payload: any; // JSONB policy payload
  sha256Hash: string;
  createdAt: string;
}

// What Alexi writes as the usage-only evidence bundle
export interface ProofBundle {
  proofBundleId: string;
  submissionId: string;
  enterpriseId: string;
  agencyId: string;
  brand: string;
  region: string;
  channel: string;
  epsId: string;
  toolUsage: Array<{
    toolId: string;
    toolKey: string;
    vendor: string;
    modelVersion: string | null;
    purposeTag: string | null;
    timestamp: string;
    callerRole: string;
  }>;
  policyDecision: PolicyDecisionStatus;
  policyReasons: string[];
  anchors: {
    epsHash: string;
    bundleHash: string;
    anchoredAt: string | null;
  };
  // VERA draft seal fields
  is_draft_seal?: boolean;
  draft_decision?: 'would_allow' | 'would_block';
  draft_reasoning?: string;
  tool_attestation?: {
    tools: Array<{
      toolId: string;
      toolKey: string;
      vendor: string;
      modelVersion?: string | null;
      purposeTag?: string | null;
    }>;
    data_scope?: string[];
    attestation_text?: string;
    submitted_at?: string;
  };
}

export interface NewToolIntakePacket {
  intakePacketId: string;
  toolId: string;
  toolKey: string;
  vendor: string;
  firstSeenContext: {
    submissionId: string;
    agencyId: string;
    brand: string;
    region: string;
    channel: string;
  };
  typicalUses: string[];
  relevantPolicyClauses: string[];
  riskSummary: string;
  recommendation: 'ALLOW' | 'DENY' | 'ALLOW_WITH_GUARDRAILS' | 'NEEDS_MORE_INFO';
  rationale: string;
  proposedGuardrails?: string[];
  escalatedToUserId: string;
  createdAt: string;
}

// ==== Orchestrator result envelope ====

export interface AgoResultBase {
  taskId: string;
  enterpriseId: string;
  taskType: AgoTaskType;
  completedAt: string;
}

export interface EvaluateSubmissionResult extends AgoResultBase {
  taskType: 'EVALUATE_SUBMISSION';
  submissionId: string;
  policyDecision: PolicyDecisionStatus;
  explanation: string; // human-readable
  proofBundleId: string;
  requiresHumanReview: boolean;
}

export interface RunAuditResult extends AgoResultBase {
  taskType: 'RUN_AUDIT';
  summary: {
    totalSubmissions: number;
    totalToolEvents: number;
    toolsUsed: Array<{ toolKey: string; count: number }>;
    agencies: Array<{ agencyId: string; submissions: number }>;
    violations: number;
    escalations: number;
  };
  affectedProofBundleIds: string[];
  narrativeSummary: string; // what Alexi will display in the brief
}

export interface HandleNewToolResult extends AgoResultBase {
  taskType: 'HANDLE_NEW_TOOL';
  toolId: string;
  toolKey: string;
  recommendation: 'ALLOW' | 'DENY' | 'ALLOW_WITH_GUARDRAILS' | 'NEEDS_MORE_INFO';
  rationale: string;
  proposedGuardrails?: string[];
  intakePacketId: string;
  escalatedToUserId: string;
}

export interface GenerateBoundaryBriefResult extends AgoResultBase {
  taskType: 'GENERATE_BOUNDARY_BRIEF';
  timeRange: { from: string; to: string };
  briefMarkdown: string; // for inbox / email
}

export type AgoResult =
  | EvaluateSubmissionResult
  | RunAuditResult
  | HandleNewToolResult
  | GenerateBoundaryBriefResult;

export interface VelocityMetrics {
  events_30d: number;
  auto_cleared: number;
  auto_clear_rate: number;
  revenue_protected_usd: number;
  days_saved: number;
}

export interface EvaluateToolUsageInput {
  enterpriseId: string;
  partnerId: string;
  toolUsage: Array<{
    toolId: string;
    toolKey: string;
    vendor: string;
    modelVersion?: string;
    purposeTag?: string;
    dataScope?: string[];
  }>;
  source?: 'api' | 'manual_preflight';
}

export interface EvaluateToolUsageResult {
  action: 'allow' | 'block';
  seal: {
    id: string;
    is_draft_seal: boolean;
    draft_decision?: 'would_allow' | 'would_block';
    status?: 'draft' | 'verified' | 'blocked' | 'pending_verification';
  };
  mode: VeraMode;
  reasoning?: string;
  violations?: string[];
}

export class AgoError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_INPUT' | 'SUBMISSION_NOT_FOUND' | 'EPS_NOT_FOUND' | 'LLM_ERROR' | 'DB_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AgoError';
  }
}

