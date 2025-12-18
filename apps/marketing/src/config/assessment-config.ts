export interface AssessmentQuestion {
  id: string;
  text: string;
  helpText?: string;
  weight: number;
}

export interface AssessmentDomain {
  id: string;
  name: string;
  description: string;
  weight: number;
  isMustPass: boolean;
  mustPassThreshold: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentConfig {
  version: string;
  bands: {
    blocked: { min: number; max: number; label: string; description: string };
    cautious: { min: number; max: number; label: string; description: string };
    enabled: { min: number; max: number; label: string; description: string };
    native: { min: number; max: number; label: string; description: string };
  };
  domains: AssessmentDomain[];
  scoring: {
    evidenceBonus: number;
    evidenceThreshold: number;
    mustPassCapScore: number;
  };
}

export const ASSESSMENT_CONFIG_V1: AssessmentConfig = {
  version: "1.0.0",
  bands: {
    blocked: { 
      min: 0, 
      max: 30, 
      label: "Blocked", 
      description: "Critical gaps prevent AI deployment" 
    },
    cautious: { 
      min: 31, 
      max: 60, 
      label: "Cautious", 
      description: "Foundation needs work before scaling" 
    },
    enabled: { 
      min: 61, 
      max: 80, 
      label: "Enabled", 
      description: "Strong compliance posture for deployment" 
    },
    native: { 
      min: 81, 
      max: 100, 
      label: "Native", 
      description: "Audit-ready AI operations at scale" 
    }
  },
  domains: [
    {
      id: "data-governance",
      name: "Data Governance & Privacy",
      description: "Data classification, privacy controls, and retention policies",
      weight: 20,
      isMustPass: true,
      mustPassThreshold: 2.0,
      questions: [
        {
          id: "data-classification",
          text: "Data classification and labeling systems are implemented",
          helpText: "Systematic approach to categorizing data by sensitivity, compliance requirements, and access controls",
          weight: 1
        },
        {
          id: "privacy-impact",
          text: "Privacy impact assessments are conducted for AI systems",
          helpText: "Formal process to evaluate privacy risks before AI deployment",
          weight: 1
        },
        {
          id: "data-retention",
          text: "Data retention and deletion policies are enforced",
          helpText: "Automated systems to manage data lifecycle according to legal and business requirements",
          weight: 1
        }
      ]
    },
    {
      id: "human-in-loop",
      name: "Human-in-the-Loop Controls",
      description: "Human oversight, escalation procedures, and review processes",
      weight: 25,
      isMustPass: true,
      mustPassThreshold: 2.0,
      questions: [
        {
          id: "human-oversight",
          text: "Human oversight is required for critical AI decisions",
          helpText: "Mandatory human review for high-impact or high-risk AI outputs",
          weight: 1
        },
        {
          id: "escalation-procedures",
          text: "Clear escalation procedures exist for AI uncertainty",
          helpText: "Defined workflows when AI confidence falls below thresholds",
          weight: 1
        },
        {
          id: "reviewer-training",
          text: "Human reviewers are trained on AI system limitations",
          helpText: "Ongoing education program for human reviewers on AI capabilities and failure modes",
          weight: 1
        }
      ]
    },
    {
      id: "audit-trail",
      name: "Audit Trail & Documentation",
      description: "Decision logging, model documentation, and traceability",
      weight: 20,
      isMustPass: true,
      mustPassThreshold: 2.0,
      questions: [
        {
          id: "decision-logging",
          text: "All AI decisions are logged with explanations",
          helpText: "Comprehensive audit trail of AI outputs with reasoning and confidence scores",
          weight: 1
        },
        {
          id: "model-documentation",
          text: "Model training data and parameters are documented",
          helpText: "Complete records of training datasets, model architecture, and hyperparameters",
          weight: 1
        },
        {
          id: "audit-accessibility",
          text: "Decision audit trails are easily accessible",
          helpText: "Searchable, exportable audit logs available to authorized reviewers",
          weight: 1
        }
      ]
    },
    {
      id: "security-access",
      name: "Security & Access Controls",
      description: "Authentication, authorization, and security assessments",
      weight: 15,
      isMustPass: true,
      mustPassThreshold: 2.0,
      questions: [
        {
          id: "rbac",
          text: "Role-based access controls for AI systems",
          helpText: "Granular permissions based on user roles and data sensitivity",
          weight: 1
        },
        {
          id: "model-protection",
          text: "AI models are protected from unauthorized access",
          helpText: "Encryption, secure storage, and access logging for AI models",
          weight: 1
        },
        {
          id: "security-assessments",
          text: "Regular security assessments are conducted",
          helpText: "Periodic penetration testing and vulnerability assessments",
          weight: 1
        }
      ]
    },
    {
      id: "model-validation",
      name: "Model Validation & Testing",
      description: "Performance monitoring, bias testing, and validation frameworks",
      weight: 10,
      isMustPass: false,
      mustPassThreshold: 0,
      questions: [
        {
          id: "performance-monitoring",
          text: "Model performance is continuously monitored",
          helpText: "Real-time tracking of accuracy, drift, and performance metrics",
          weight: 1
        },
        {
          id: "bias-testing",
          text: "Regular bias and fairness testing is conducted",
          helpText: "Systematic evaluation for discriminatory outcomes across protected groups",
          weight: 1
        },
        {
          id: "validation-framework",
          text: "Formal model validation framework is in place",
          helpText: "Structured process for testing models before deployment",
          weight: 1
        }
      ]
    },
    {
      id: "risk-management",
      name: "Risk Management",
      description: "Risk assessment, mitigation strategies, and contingency planning",
      weight: 10,
      isMustPass: false,
      mustPassThreshold: 0,
      questions: [
        {
          id: "risk-assessment",
          text: "AI risk assessments are conducted systematically",
          helpText: "Formal evaluation of potential harms and failure modes",
          weight: 1
        },
        {
          id: "mitigation-strategies",
          text: "Risk mitigation strategies are documented and tested",
          helpText: "Proven approaches to reduce identified risks",
          weight: 1
        },
        {
          id: "contingency-planning",
          text: "Contingency plans exist for AI system failures",
          helpText: "Documented procedures for system degradation or failure scenarios",
          weight: 1
        }
      ]
    }
  ],
  scoring: {
    evidenceBonus: 0.2,
    evidenceThreshold: 0.5,
    mustPassCapScore: 60
  }
};