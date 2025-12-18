export type ToolSubmission = {
  id: string;
  status: 'draft' | 'submitted' | 'needs_info';
  updatedAt: string;
  // Step 1 - Tool Identification
  tool: { 
    name: string; 
    vendor: string; 
    version?: string; 
    category?: string; 
    site?: string; 
    license?: 'oss' | 'subscription' | 'one_time' | 'usage' | 'enterprise'; 
    costUsd?: number;
    description?: string;
  };
  // Step 2 - Business Context
  model: { 
    type?: 'llm' | 'vision' | 'multimodal' | 'custom'; 
    description?: string; 
    trainingData?: string; 
    useTags?: string[];
  };
  // Step 3 - Use Cases
  purpose: { 
    description?: string; 
    handlesPersonalData?: boolean; 
    generatesRegulatedContent?: boolean; 
    attachments?: string[];
    businessJustification?: string;
    expectedUsers?: number;
    departments?: string[];
  };
  // Step 4 - Data Privacy
  privacy: {
    dataTypes?: string[];
    retentionPeriod?: string;
    geographicRestrictions?: string[];
    complianceFrameworks?: string[];
  };
  // Step 5 - Evidence Upload
  evidence: { 
    files: { key: string; name: string; size: number }[];
  };
  // Step 6 - Technical Requirements
  tech: { 
    hosting?: 'saas' | 'onprem' | 'private' | 'hybrid'; 
    dataFlow?: string;
    integrations?: string[];
    securityRequirements?: string[];
  };
  // Step 7 - Risk & Compliance
  risk: { 
    level?: 'low' | 'medium' | 'high'; 
    knownRisks?: string; 
    mitigations?: string;
    regulatoryRequirements?: string[];
  };
  // Step 8 - Vendor Assessment
  vendor: { 
    contact?: string; 
    securityPage?: string; 
    certs?: string[];
    contractTerms?: string;
    supportLevel?: string;
  };
  // Step 9 - Approval Chain
  approval: { 
    reviewers?: string[]; 
    conditions?: string[];
    timeline?: string;
    escalationPath?: string[];
  };
  // Step 10 - Review & Submit
  attest?: boolean;
  finalComments?: string;
};

export type PrecheckResult = {
  risks: { 
    key: string; 
    label: string; 
    severity: 'low' | 'medium' | 'high'; 
    rationale: string;
  }[];
  confidence: number;     // 0..1
  recommendations: string[];
  overallRisk: 'low' | 'medium' | 'high';
  complianceGaps: string[];
};

export type PolicyHint = { 
  id: string; 
  title: string; 
  body: string; 
  relevance: number;
  category?: string;
  required?: boolean;
};

export type UploadFile = {
  key: string;
  name: string;
  size: number;
  type?: string;
  uploadedAt?: string;
};

export type StepProps = {
  data: ToolSubmission;
  update: (patch: Partial<ToolSubmission>) => void;
  onNext: () => void;
  onPrev: () => void;
  saving?: boolean;
  errors?: Record<string, string>;
  setErrors?: (errors: Record<string, string>) => void;
};

export type SubmissionStep = {
  id: number;
  title: string;
  description: string;
  icon: any; // React component
  required?: string[]; // Required fields for this step
  component: React.ComponentType<StepProps>;
};
