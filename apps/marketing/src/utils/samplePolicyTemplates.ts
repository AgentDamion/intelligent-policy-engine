import { supabase } from "@/integrations/supabase/client";
import { PolicyObjectModel } from "@/types/policyObjectModel";

const aiUsagePOM: any = {
  metadata: {
    created_by: "AI Governance Team",
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    tags: ["ai-usage", "governance", "compliance"]
  },
  rules: [
    {
      id: "ai-usage-1",
      category: "data-protection",
      description: "All AI tools must process data in compliance with GDPR and data localization requirements",
      enforcement: "mandatory",
      conditions: [
        "AI tool must have data processing agreement",
        "Data residency requirements must be met",
        "User consent must be obtained for data processing"
      ],
      exceptions: []
    },
    {
      id: "ai-usage-2",
      category: "model-governance",
      description: "AI models must be validated and approved before production use",
      enforcement: "mandatory",
      conditions: [
        "Model must undergo bias testing",
        "Model performance metrics must meet minimum thresholds",
        "Model documentation must be complete"
      ],
      exceptions: ["Research and development environments"]
    },
    {
      id: "ai-usage-3",
      category: "transparency",
      description: "AI-generated content must be clearly labeled and traceable",
      enforcement: "mandatory",
      conditions: [
        "All outputs must include AI-generation metadata",
        "Audit logs must capture AI usage context",
        "Users must be informed when interacting with AI"
      ],
      exceptions: []
    }
  ],
  controls: {
    hitl: {
      required: true,
      reviewers: ["data-scientist", "compliance-officer"],
      review_types: ["technical", "compliance"]
    },
    validation: {
      factual_check: true,
      reference_required: true,
      multi_source_verification: true
    },
    testing: {
      regression: true,
      bias_testing: true,
      accuracy_benchmarks: true
    }
  },
  approvalWorkflow: {
    stages: [
      {
        name: "Technical Review",
        approvers: ["data-scientist", "ml-engineer"],
        requiredApprovals: 1
      },
      {
        name: "Compliance Review",
        approvers: ["compliance-officer", "legal"],
        requiredApprovals: 1
      },
      {
        name: "Executive Approval",
        approvers: ["cto", "ciso"],
        requiredApprovals: 1
      }
    ]
  }
};

const dataProcessingPOM: any = {
  metadata: {
    created_by: "Data Protection Team",
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    tags: ["data-processing", "privacy", "gdpr"]
  },
  rules: [
    {
      id: "data-proc-1",
      category: "data-minimization",
      description: "Only collect and process data necessary for stated purpose",
      enforcement: "mandatory",
      conditions: [
        "Data collection must have documented business justification",
        "Retention periods must be defined and enforced",
        "Data deletion procedures must be in place"
      ],
      exceptions: []
    },
    {
      id: "data-proc-2",
      category: "encryption",
      description: "All sensitive data must be encrypted at rest and in transit",
      enforcement: "mandatory",
      conditions: [
        "Use approved encryption algorithms (AES-256 or equivalent)",
        "Encryption keys must be properly managed",
        "TLS 1.2+ required for data in transit"
      ],
      exceptions: []
    },
    {
      id: "data-proc-3",
      category: "access-control",
      description: "Data access must follow principle of least privilege",
      enforcement: "mandatory",
      conditions: [
        "Role-based access controls must be implemented",
        "Access logs must be maintained",
        "Quarterly access reviews must be conducted"
      ],
      exceptions: []
    }
  ],
  controls: {
    hitl: {
      required: true,
      reviewers: ["security-engineer", "dpo"],
      review_types: ["security", "privacy"]
    },
    validation: {
      factual_check: true,
      reference_required: true
    }
  },
  approvalWorkflow: {
    stages: [
      {
        name: "Security Review",
        approvers: ["security-engineer", "ciso"],
        requiredApprovals: 1
      },
      {
        name: "Privacy Review",
        approvers: ["dpo", "privacy-officer"],
        requiredApprovals: 1
      }
    ]
  }
};

const vendorRiskPOM: any = {
  metadata: {
    created_by: "Vendor Management Team",
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    tags: ["vendor-risk", "third-party", "supply-chain"]
  },
  rules: [
    {
      id: "vendor-1",
      category: "due-diligence",
      description: "All vendors must undergo security assessment before onboarding",
      enforcement: "mandatory",
      conditions: [
        "Vendor security questionnaire must be completed",
        "SOC 2 Type II or equivalent certification required",
        "Data processing agreement must be signed"
      ],
      exceptions: ["Low-risk vendors with minimal data access"]
    },
    {
      id: "vendor-2",
      category: "monitoring",
      description: "Vendor security posture must be continuously monitored",
      enforcement: "mandatory",
      conditions: [
        "Annual security reassessments required",
        "Vendor breach notifications must be tracked",
        "Service level agreements must be monitored"
      ],
      exceptions: []
    }
  ],
  controls: {
    hitl: {
      required: true,
      reviewers: ["vendor-risk-manager", "legal-counsel"],
      review_types: ["risk-assessment", "legal"]
    },
    validation: {
      factual_check: true,
      reference_required: true
    }
  },
  approvalWorkflow: {
    stages: [
      {
        name: "Procurement Review",
        approvers: ["procurement-manager"],
        requiredApprovals: 1
      },
      {
        name: "Security Review",
        approvers: ["vendor-risk-manager", "ciso"],
        requiredApprovals: 1
      },
      {
        name: "Legal Review",
        approvers: ["legal-counsel"],
        requiredApprovals: 1
      }
    ]
  }
};

const regulatoryCompliancePOM: any = {
  metadata: {
    created_by: "Compliance Team",
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    tags: ["regulatory", "compliance", "pharma"]
  },
  rules: [
    {
      id: "reg-1",
      category: "fda-compliance",
      description: "AI systems must comply with FDA 21 CFR Part 11 for electronic records",
      enforcement: "mandatory",
      conditions: [
        "Electronic signatures must be validated",
        "Audit trails must be tamper-proof",
        "System access controls must be enforced"
      ],
      exceptions: []
    },
    {
      id: "reg-2",
      category: "validation",
      description: "AI systems must undergo validation per regulatory requirements",
      enforcement: "mandatory",
      conditions: [
        "Installation Qualification (IQ) required",
        "Operational Qualification (OQ) required",
        "Performance Qualification (PQ) required"
      ],
      exceptions: []
    }
  ],
  controls: {
    hitl: {
      required: true,
      reviewers: ["qa-manager", "regulatory-affairs"],
      review_types: ["quality", "regulatory"]
    },
    validation: {
      factual_check: true,
      reference_required: true,
      multi_source_verification: true
    }
  },
  approvalWorkflow: {
    stages: [
      {
        name: "QA Review",
        approvers: ["qa-manager", "quality-engineer"],
        requiredApprovals: 1
      },
      {
        name: "Regulatory Review",
        approvers: ["regulatory-affairs"],
        requiredApprovals: 1
      },
      {
        name: "Executive Approval",
        approvers: ["vp-quality", "ceo"],
        requiredApprovals: 1
      }
    ]
  }
};

const modelGovernancePOM: any = {
  metadata: {
    created_by: "AI Governance Team",
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    tags: ["model-governance", "ml-ops", "ai-ethics"]
  },
  rules: [
    {
      id: "model-1",
      category: "bias-testing",
      description: "All AI models must undergo bias and fairness testing",
      enforcement: "mandatory",
      conditions: [
        "Disparate impact analysis required",
        "Fairness metrics must meet defined thresholds",
        "Bias mitigation strategies must be documented"
      ],
      exceptions: []
    },
    {
      id: "model-2",
      category: "explainability",
      description: "AI models must provide explainable outputs for high-risk decisions",
      enforcement: "mandatory",
      conditions: [
        "SHAP or LIME explanations required for predictions",
        "Decision rationale must be documentable",
        "Human review required for threshold decisions"
      ],
      exceptions: ["Low-risk automated decisions"]
    }
  ],
  controls: {
    hitl: {
      required: true,
      reviewers: ["lead-data-scientist", "ai-ethics-board"],
      review_types: ["technical", "ethics"]
    },
    validation: {
      factual_check: true,
      reference_required: true
    },
    bias: {
      detection_required: true,
      mitigation_required: true
    }
  },
  approvalWorkflow: {
    stages: [
      {
        name: "Data Science Review",
        approvers: ["lead-data-scientist"],
        requiredApprovals: 1
      },
      {
        name: "Ethics Review",
        approvers: ["ai-ethics-board"],
        requiredApprovals: 1
      },
      {
        name: "Executive Approval",
        approvers: ["chief-ai-officer"],
        requiredApprovals: 1
      }
    ]
  }
};

export const samplePolicyTemplates = [
  {
    title: "AI Usage Governance",
    policy_type: "ai_governance",
    industry: "Technology",
    compliance_frameworks: ["GDPR", "SOC2", "ISO27001"],
    base_pom: aiUsagePOM,
    description: "Comprehensive policy for governing AI tool usage across the organization"
  },
  {
    title: "Data Processing & Privacy",
    policy_type: "data_protection",
    industry: "General",
    compliance_frameworks: ["GDPR", "CCPA", "HIPAA"],
    base_pom: dataProcessingPOM,
    description: "Policies for data collection, processing, storage, and protection"
  },
  {
    title: "Third-Party Vendor Risk",
    policy_type: "vendor_management",
    industry: "General",
    compliance_frameworks: ["SOC2", "ISO27001"],
    base_pom: vendorRiskPOM,
    description: "Risk management policies for third-party vendors and suppliers"
  },
  {
    title: "Pharmaceutical Regulatory Compliance",
    policy_type: "regulatory_compliance",
    industry: "Pharmaceutical",
    compliance_frameworks: ["FDA_21CFR11", "GxP", "GDPR"],
    base_pom: regulatoryCompliancePOM,
    description: "FDA and regulatory compliance policies for pharmaceutical AI systems"
  },
  {
    title: "AI Model Governance & Ethics",
    policy_type: "model_governance",
    industry: "Technology",
    compliance_frameworks: ["EU_AI_Act", "NIST_AI_RMF"],
    base_pom: modelGovernancePOM,
    description: "Policies for AI model development, bias testing, and ethical AI deployment"
  }
];

export async function insertSamplePolicyTemplates() {
  try {
    const { data: existing } = await supabase
      .from('policy_templates')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('Policy templates already exist, skipping seed');
      return;
    }

    const { data, error } = await supabase
      .from('policy_templates')
      .insert(samplePolicyTemplates)
      .select();

    if (error) {
      console.error('Error inserting sample policy templates:', error);
      throw error;
    }

    console.log(`Inserted ${data?.length || 0} policy templates`);
    return data;
  } catch (error) {
    console.error('Error in insertSamplePolicyTemplates:', error);
    throw error;
  }
}
