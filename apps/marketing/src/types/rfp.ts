export type RFPQuestionLane = 
  | 'governance_compliance'
  | 'security_access'
  | 'integration_scalability'
  | 'business_ops';

export interface RFPQuestion {
  id: string;
  category: 'Data Privacy' | 'Model Governance' | 'Bias Testing' | 'Security' | 'Transparency';
  question: string;
  requirement: string;
  evidence_types: string[];
  question_lane?: RFPQuestionLane;
  lane_confidence?: number;
  auto_answerable?: boolean;
  linked_policy_id?: string;
  linked_policy_clause?: string;
  answer_template_type?: string;
  routing_rationale?: string;
  scoring: {
    excellent: { threshold: number; description: string };
    good: { threshold: number; description: string };
    acceptable: { threshold: number; description: string };
    insufficient: { threshold: number; description: string };
  };
  weight: number;
}

export interface RFPTemplateData {
  questions: RFPQuestion[];
  overall_scoring: {
    passing_threshold: number;
    excellence_threshold: number;
  };
}

export interface ComplianceScoringProfile {
  domains: {
    name: string;
    weight: number;
    criteria: {
      name: string;
      weight: number;
      thresholds: {
        excellent: number;
        good: number;
        acceptable: number;
        insufficient: number;
      };
    }[];
  }[];
  overall_passing_score: number;
}

export interface RFPResponseData {
  answers: {
    question_id: string;
    answer: string;
    evidence: {
      type: string;
      description: string;
      file_url?: string;
    }[];
    self_assessment_score?: number;
  }[];
  metadata: {
    respondent_name: string;
    respondent_email: string;
    response_date: string;
    organization_name?: string;
  };
}

export interface RFPDistributionConfig {
  workspace_ids: string[];
  response_deadline: string;
  include_auto_scoring: boolean;
  custom_message?: string;
}

export interface LaneStatistics {
  governance_compliance: number;
  security_access: number;
  integration_scalability: number;
  business_ops: number;
}

// Tool Disclosure & Policy Validation Types
export interface ToolDisclosure {
  id?: string;
  distribution_id: string;
  tool_id?: string;
  tool_name: string;
  version?: string;
  provider?: string;
  intended_use?: string;
  data_scope?: {
    pii?: boolean;
    hipaa?: boolean;
    regions?: string[];
    data_types?: string[];
  };
  connectors?: string[];
  created_at?: string;
  updated_at?: string;
}

export type PolicyCheckStatus = 'COMPLIANT' | 'PENDING' | 'RESTRICTED';

export interface PolicyResolutionItem {
  tool_name: string;
  version?: string;
  provider?: string;
  status: PolicyCheckStatus;
  reasons: string[];
  failed_controls: string[];
}

export interface PolicyResolutionResult {
  id: string;
  distribution_id: string;
  overall_score: number;
  items: PolicyResolutionItem[];
  created_at: string;
}

export interface PolicyPack {
  id: string;
  client_id?: string;
  name: string;
  tool_whitelist: Array<{
    name: string;
    provider: string;
    versions: string[];
    data_scope: {
      pii: boolean;
      hipaa: boolean;
      regions: string[];
    };
  }>;
  control_mappings: Record<string, string>;
  jurisdictions: string[];
  created_at?: string;
  updated_at?: string;
}
