export interface SpineKeyFacts {
  threadId: string;
  policySnapshotId: string;
  tool: { id: string; name: string; version: string };
  region: string;
  owner: string;
  state: 'Draft' | 'Canary planned' | 'Approved' | 'Escalated' | 'Under Review';
  caseTitle: string;
}

export interface FeatureWeight {
  id: string;
  label: string;
  weight: number; // 0-1
  description?: string;
}

export interface Explainability {
  features: FeatureWeight[];
  confidence: number; // 0-1
  decisionPath: string[];
  modelVersion?: string;
}

export interface ProofMetrics {
  source: string; // "EvidenceAgent·14:33"
  provenance: string;
  toolComparisons: { label: string; percent: number; status: 'pass' | 'fail' | 'warning' }[];
  complianceGap: number;
  totalChecks: number;
  passedChecks: number;
}

export interface CanaryPlan {
  cohortPercent: number;
  durationDays: number;
  successCriteria: string[];
  monitoringMetrics?: string[];
}

export interface ImpactAssessment {
  riskReduction: 'Low' | 'Med' | 'High';
  userDisruption: 'Low' | 'Med' | 'High';
  autoFixAvailable: boolean;
  estimatedEffort?: string;
}

export interface SpineNarrative {
  setup: {
    actors: string[];
    toolsInScope: string[];
    context: string[];
    complianceRequirement: string;
    policyAtoms: string[]; // For pills
  };
  challenge: {
    statement: string; // Single paragraph
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    affectedSystems?: string[];
  };
  proof: ProofMetrics;
  resolution: {
    recommendation: string;
    canaryPlan: CanaryPlan;
    impact: ImpactAssessment;
  };
  explainability: Explainability;
}

export interface SpineData {
  facts: SpineKeyFacts;
  narrative: SpineNarrative;
  proofBundleId?: string;
  timestamp: string;
}

export type SpineDecisionKind = 'Approve' | 'RequestChanges' | 'StartCanary' | 'Escalate';

export interface SpineDecision {
  kind: SpineDecisionKind;
  threadId: string;
  policySnapshotId: string;
  rationale?: string;
  conditions?: string[];
  escalateTo?: 'Legal' | 'Security' | 'Brand' | 'Executive';
  reviewers: string[]; // Required before decision
  canaryConfig?: Partial<CanaryPlan>;
}

export interface SpineDecisionResult {
  success: boolean;
  proofBundleId: string;
  attestationId: string;
  timestamp: string;
}
