export interface Policy {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  aiTools: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  enterpriseId: string;
}

export interface Agency {
  id: number;
  name: string;
  compliance: number;
  violations: number;
  lastAudit: string;
  status: 'active' | 'warning' | 'inactive';
  enterpriseId: string;
}

export interface Submission {
  id: number;
  agencyId: number;
  agencyName: string;
  type: string;
  aiTools: string[];
  status: 'pending' | 'approved' | 'rejected';
  riskScore: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
  content: {
    title: string;
    description: string;
    policies: number[];
  };
}

export interface PolicyViolation {
  id: string;
  policyId: number;
  agencyId: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: string;
  resolved: boolean;
}

export interface EnterpriseStats {
  activeAgencies: number;
  activePolicies: number;
  pendingReviews: number;
  complianceRate: number;
  totalViolations: number;
}