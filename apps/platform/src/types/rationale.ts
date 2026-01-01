/**
 * Rationale Types for AI Governance Decisions
 * 
 * These types define the structure for human-readable and machine-parseable
 * rationales attached to every AI governance decision.
 */

/**
 * Actor types for decision attribution
 */
export type ActorType = 'human' | 'automated' | 'hybrid';

/**
 * Dataset classification levels
 */
export type DatasetClass = 
  | 'no_pii'
  | 'pseudonymous'
  | 'pii'
  | 'phi'
  | 'restricted'
  | 'internal_restricted'
  | 'public'
  | 'confidential';

/**
 * Request types for AI tool usage
 */
export type RequestType = 
  | 'generation'
  | 'analysis'
  | 'transformation'
  | 'classification'
  | 'extraction';

/**
 * Decision types for policy evaluation
 */
export type DecisionType = 'allow' | 'deny' | 'escalate' | 'conditional';

/**
 * Actor information for decision attribution
 */
export interface RationaleActor {
  /** Type of actor making/reviewing the decision */
  type: ActorType;
  /** Human-readable name (for human actors) */
  name?: string;
  /** User ID reference */
  id?: string;
  /** Role of the actor */
  role?: 'reviewer' | 'mlr' | 'compliance' | 'admin' | string;
}

/**
 * Input context for the decision
 */
export interface RationaleInputs {
  /** Tool name */
  tool: string;
  /** Tool version if available */
  tool_version?: string;
  /** Data classification level */
  dataset_class: DatasetClass | string;
  /** Type of request */
  request_type: RequestType | string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Structured rationale for machine parsing
 * Contains all the details needed for compliance queries and audit exports
 */
export interface RationaleStructured {
  /** Policy identifier (e.g., 'eps-1.3') */
  policy_id: string;
  /** Policy version (e.g., 'v2.1') */
  policy_version: string;
  /** Primary rule that was matched */
  rule_matched: string;
  /** Input context for the decision */
  inputs: RationaleInputs;
  /** Actor information */
  actor: RationaleActor;
  /** Confidence score (0.00 - 1.00) */
  confidence_score?: number;
  /** Additional rules that contributed to the decision */
  secondary_rules?: string[];
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Complete rationale pair
 */
export interface Rationale {
  /** Human-readable rationale (≤140 characters) */
  human: string;
  /** Machine-parseable structured rationale */
  structured: RationaleStructured;
}

/**
 * AI Decision with rationale fields
 * Extends the base decision type with rationale information
 */
export interface AIDecisionWithRationale {
  /** Unique decision identifier */
  id: string | number;
  /** Agent that made the decision */
  agent: string;
  /** Action taken */
  action: string;
  /** Decision outcome */
  outcome: 'approved' | 'rejected' | 'flagged' | string;
  /** Risk level */
  risk: 'low' | 'medium' | 'high' | 'critical' | string | null;
  /** Additional details (legacy JSONB) */
  details: Record<string, unknown> | null;
  /** Enterprise context */
  enterprise_id: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Human-readable rationale (≤140 chars) */
  rationale_human: string | null;
  /** Structured rationale for machine parsing */
  rationale_structured: RationaleStructured | null;
}

/**
 * Audit event with rationale fields
 */
export interface AuditEventWithRationale {
  /** Unique event identifier */
  id: string;
  /** Event type */
  event_type: string;
  /** Entity type being audited */
  entity_type: string | null;
  /** Entity identifier */
  entity_id: string | null;
  /** User who triggered the event */
  user_id: string | null;
  /** Workspace context */
  workspace_id: string | null;
  /** Enterprise context */
  enterprise_id: string | null;
  /** Additional details (legacy JSONB) */
  details: Record<string, unknown>;
  /** Creation timestamp */
  created_at: string;
  /** Human-readable rationale (≤140 chars) */
  rationale_human: string | null;
  /** Structured rationale for machine parsing */
  rationale_structured: RationaleStructured | null;
}

/**
 * Proof bundle entry with justification
 */
export interface ProofBundleEntry {
  /** Unique event identifier */
  event_id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Type of event */
  event_type: string;
  /** Decision outcome */
  decision: DecisionType | string;
  /** Justification with both human and structured rationale */
  justification: {
    human_readable: string;
    structured: RationaleStructured;
  };
  /** Evidence references */
  evidence: {
    policy_snapshot_hash: string;
    tool_approval_id?: string;
    data_scan_result?: string;
    human_signoff?: string;
  };
  /** Cryptographic anchor if available */
  anchor?: {
    hash: string;
    timestamp: string;
    method: string;
  };
}

/**
 * Type guard to check if a decision has rationale
 */
export function hasRationale(
  decision: unknown
): decision is AIDecisionWithRationale {
  if (typeof decision !== 'object' || decision === null) return false;
  const d = decision as Record<string, unknown>;
  return (
    typeof d.rationale_human === 'string' ||
    (typeof d.rationale_structured === 'object' && d.rationale_structured !== null)
  );
}

/**
 * Type guard to check if structured rationale is valid
 */
export function isValidRationaleStructured(
  obj: unknown
): obj is RationaleStructured {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.policy_id === 'string' &&
    typeof r.rule_matched === 'string' &&
    typeof r.inputs === 'object' &&
    r.inputs !== null
  );
}








