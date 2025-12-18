// ================================
// PROOF REQUIREMENTS TYPES
// ================================
// Type definitions for Proof Requirements Agent

export type AtomStatus = "missing" | "present" | "waived" | "invalid";

export interface ContextProfile {
  submissionId: string;
  enterpriseId: string;
  organizationId: string;
  jurisdictions: string[]; // e.g. ["EU", "US"]
  channels: string[];       // e.g. ["public", "paid_social"]
  assetTypes: string[];    // e.g. ["image", "video"]
  categories: string[];    // e.g. ["pharma_promo"]
  aiUsed: boolean;
}

export interface ProofAtom {
  id: string;
  label: string;
  description: string | null;
  category: string;
  dataType: "string" | "number" | "boolean" | "enum" | "object" | "array";
  schema?: any;
  collectionMethod: "auto" | "manual" | "hybrid";
  sensitivityLevel: "low" | "medium" | "high";
  version: string;
  enterpriseId: string | null;
}

export interface ProofPack {
  id: string;
  enterpriseId: string | null;
  organizationId: string | null;
  label: string;
  description: string | null;
  priority: number;
  appliesWhen: {
    jurisdictions?: string[];
    channels?: string[];
    assetTypes?: string[];
    categories?: string[];
    aiUsed?: boolean;
  };
  severity: "regulatory" | "contractual" | "advisory";
  version: string;
}

export interface ProofPackAtom {
  proofPackId: string;
  atomId: string;
  required: boolean;
  constraints?: AtomConstraints;
}

export interface AtomConstraints {
  allowedValues?: string[];
  forbiddenValues?: string[];
  min?: number;
  max?: number;
}

export interface RequirementsProfile {
  id: string;
  enterpriseId: string;
  organizationId: string;
  submissionId: string;
  profileKey: string;
  sourcePacks: string[];
  requiredAtoms: string[];
  optionalAtoms: string[];
  constraints: Record<string, AtomConstraints>;
  conflicts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAtomState {
  id: string;
  enterpriseId: string;
  organizationId: string;
  submissionId: string;
  atomId: string;
  status: AtomStatus;
  value?: any;
  sourcePacks: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface TransitionCheckResult {
  allowed: boolean;
  missingAtoms: string[];
  invalidAtoms: string[];
  conflicts?: string[];
}

export class ProofRequirementsError extends Error {
  constructor(
    message: string,
    public code: 'PROFILE_NOT_FOUND' | 'INVALID_ATOM' | 'CONFLICT_DETECTED' | 'TRANSITION_BLOCKED' | 'INVALID_INPUT',
    public details?: any
  ) {
    super(message);
    this.name = 'ProofRequirementsError';
  }
}

