// Proof Bundle Types for Immutable Audit Records

export interface ProofBundle {
  id: string;
  claim: string;
  scope: ProofBundleScope;
  policy_basis_hash?: string;
  actors: ProofBundleActors;
  evidence_manifest: EvidenceManifest;
  signature?: string;
  signed_by?: string;
  signed_at?: string;
  enterprise_id: string;
  workspace_id?: string;
  created_at: string;
}

export interface ProofBundleScope {
  policy_instance_id: string;
  tool_version_id: string;
  run_ids: string[];
}

export interface ProofBundleActors {
  approvers: string[];
  testers: string[];
  reviewers?: string[];
}

export interface EvidenceManifest {
  sandbox_results: SandboxEvidence;
  logs: LogEvidence[];
  approvals: ApprovalEvidence[];
  runtime_metrics?: Record<string, any>;
  tool_attestation?: ToolAttestationEvidence;
}

export interface SandboxEvidence {
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  flagged_runs: number;
  scenarios_tested: string[];
  completion_time: string;
}

export interface LogEvidence {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, any>;
}

export interface ApprovalEvidence {
  approver_id: string;
  decision: 'approved' | 'rejected' | 'conditional';
  timestamp: string;
  rationale?: string;
  conditions?: string[];
}

// Tool Attestation Evidence for Asset Governance (Gate 4)
export interface ToolAttestationEvidence {
  declared_tools: DeclaredTool[];
  policy_validation: PolicyValidationResult;
  attestation_metadata: AttestationMetadata;
}

export interface DeclaredTool {
  tool_id: string;
  tool_name: string;
  provider: string;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deployment_status: 'approved' | 'banned' | 'waitlist' | 'deprecated';
  how_used: string;
  version?: string;
}

export interface PolicyValidationResult {
  all_tools_approved: boolean;
  aggregated_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  policy_violations: PolicyViolation[];
  validated_at: string;
}

export interface PolicyViolation {
  tool_id: string;
  tool_name: string;
  violation_type: 'banned_tool' | 'unapproved_jurisdiction' | 'risk_tier_exceeded' | 'missing_approval';
  violation_message: string;
  policy_reference?: string;
}

export interface AttestationMetadata {
  attested_by: string;
  role_credential?: string;
  signature: string;
  timestamp: string;
  asset_hash?: string;
  project_id?: string;
}

export type ProofBundleClaim = 
  | 'sandbox_validation'
  | 'runtime_compliance'
  | 'policy_approval'
  | 'partner_verification'
  | 'tool_attestation';

export interface CreateProofBundleInput {
  claim: ProofBundleClaim;
  policy_instance_id: string;
  run_ids: string[];
  enterprise_id: string;
  workspace_id?: string;
}
