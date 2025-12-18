import { PolicyObjectModel } from "@/types/policyObjectModel";
import { SandboxProjectMode } from "@/types/sandboxProject";

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  mode: SandboxProjectMode;
  template: Partial<PolicyObjectModel>;
  tags: string[];
}

/**
 * Service for managing policy templates across different project modes
 * Templates are stored as code since we don't have a templates table yet
 */
export class PolicyTemplateService {
  private static templates: PolicyTemplate[] = [
    {
      id: 'tool_evaluation_baseline',
      name: 'Tool Evaluation Baseline',
      description: 'Minimal controls for AI tool testing and evaluation',
      mode: 'tool_evaluation',
      template: {
        policy_id: 'template-tool-evaluation',
        version: '1.0',
        scope: ['internal', 'testing'],
        metadata: {
          created_by: 'system',
          created_at: new Date().toISOString(),
        },
        tools: [],
        usage_disclosure: {
          allowed_ai_usage: ['testing', 'evaluation'],
          disclosure_required: false,
        },
        data_controls: {
          data_classes: ['text', 'code'],
          isolation: {
            per_client_workspace: true,
            per_project: true,
          },
          retention: {
            policy_days: 30,
            auto_delete: true,
          },
        },
        controls: {
          hitl: {
            required: false,
            reviewers: [],
          },
          validation: {
            factual_check: false,
            reference_required: false,
          },
        },
        alignment: {
          client_policy_refs: [],
        },
        auditability: {
          log_scope: ['runs', 'outputs'],
          signature: 'SHA256',
          export_formats: ['json', 'csv'],
        },
        governance: {
          roles: [
            {
              role: 'tester',
              approves: ['test_runs'],
            },
          ],
        },
        risks: [
          {
            id: crypto.randomUUID(),
            severity: 'low',
            description: 'Test data may inadvertently contain sensitive information',
          },
        ],
        guardrails: {
          blocked_actions: ['production_deployment'],
        },
      },
      tags: ['testing', 'evaluation', 'internal'],
    },
    {
      id: 'policy_adaptation_fda',
      name: 'FDA Pharmaceutical Compliance',
      description: 'Pharma-ready policy with 21 CFR Part 11 compliance',
      mode: 'policy_adaptation',
      template: {
        policy_id: 'template-fda-pharma',
        version: '1.0',
        scope: ['clinical', 'regulatory', 'manufacturing'],
        metadata: {
          created_by: 'system',
          created_at: new Date().toISOString(),
        },
        tools: [],
        usage_disclosure: {
          allowed_ai_usage: [
            'clinical_decision_support',
            'drug_discovery',
            'adverse_event_monitoring',
          ],
          disclosure_required: true,
        },
        data_controls: {
          data_classes: ['clinical_data', 'patient_records', 'trial_data'],
          isolation: {
            per_client_workspace: true,
            per_project: true,
          },
          retention: {
            policy_days: 36500, // Indefinite (100 years)
            auto_delete: false,
          },
          third_parties: {
            llm_training_opt_out: true,
            data_sharing_allowed: false,
          },
        },
        controls: {
          hitl: {
            required: true,
            reviewers: ['clinical_specialist', 'regulatory_officer'],
            review_types: ['pre_approval', 'post_execution'],
          },
          validation: {
            factual_check: true,
            reference_required: true,
            multi_source_verification: true,
          },
          testing: {
            regression: true,
            bias_testing: true,
            accuracy_benchmarks: true,
          },
          redaction: {
            pii_redaction: true,
            auto_redaction: true,
          },
        },
        alignment: {
          client_policy_refs: [],
        },
        auditability: {
          log_scope: ['inputs', 'outputs', 'decisions', 'reviews'],
          signature: 'SHA256_WITH_TIMESTAMP',
          export_formats: ['pdf', 'json'],
          retention_period_days: 36500,
        },
        governance: {
          roles: [
            {
              role: 'clinical_reviewer',
              approves: ['clinical_outputs'],
              notification_required: true,
            },
            {
              role: 'regulatory_approver',
              approves: ['production_deployment'],
              notification_required: true,
            },
          ],
          exceptions: {
            process: 'escalation_to_qara',
            approver_role: 'quality_assurance',
          },
        },
        risks: [
          {
            id: crypto.randomUUID(),
            severity: 'high',
            description: 'Non-compliant AI usage may result in FDA warning letters',
          },
          {
            id: crypto.randomUUID(),
            severity: 'high',
            description: 'Incorrect AI predictions could lead to patient harm',
          },
        ],
        guardrails: {
          blocked_actions: [
            'automated_clinical_decisions_without_review',
            'patient_data_export_without_approval',
          ],
        },
      },
      tags: ['pharma', 'fda', 'clinical', 'regulatory'],
    },
    {
      id: 'partner_governance_shared',
      name: 'Partner Governance',
      description: 'Multi-tenant safe defaults for agency-client partnerships',
      mode: 'partner_governance',
      template: {
        policy_id: 'template-partner-governance',
        version: '1.0',
        scope: ['partner', 'client', 'shared'],
        metadata: {
          created_by: 'system',
          created_at: new Date().toISOString(),
        },
        tools: [],
        usage_disclosure: {
          allowed_ai_usage: [
            'content_generation',
            'brand_compliance_checking',
            'creative_ideation',
          ],
          disclosure_required: true,
        },
        data_controls: {
          data_classes: ['shared_assets', 'brand_materials', 'campaign_data'],
          isolation: {
            per_client_workspace: true,
            per_project: true,
          },
          retention: {
            policy_days: 730, // 2 years
            auto_delete: false,
          },
          third_parties: {
            llm_training_opt_out: true,
            data_sharing_allowed: false,
          },
        },
        controls: {
          hitl: {
            required: true,
            reviewers: ['client_approver', 'agency_lead'],
            review_types: ['dual_approval'],
          },
          validation: {
            factual_check: true,
            reference_required: false,
          },
        },
        alignment: {
          client_policy_refs: [],
        },
        auditability: {
          log_scope: ['all_actions', 'cross_tenant_access'],
          signature: 'DUAL_SIGNATURE',
          export_formats: ['pdf', 'json'],
          retention_period_days: 2555, // 7 years
        },
        governance: {
          roles: [
            {
              role: 'client_approver',
              approves: ['final_outputs'],
              notification_required: true,
            },
            {
              role: 'agency_lead',
              approves: ['workflow_changes'],
              notification_required: true,
            },
          ],
          exceptions: {
            process: 'dual_approval_required',
            approver_role: 'both',
          },
        },
        risks: [
          {
            id: crypto.randomUUID(),
            severity: 'high',
            description: 'Client data may leak to other clients via shared AI context',
          },
          {
            id: crypto.randomUUID(),
            severity: 'medium',
            description: 'AI may generate content similar to competitor IP',
          },
        ],
        guardrails: {
          blocked_actions: [
            'cross_client_data_sharing_without_approval',
            'partner_policy_override_without_dual_approval',
          ],
        },
      },
      tags: ['agency', 'partner', 'multi-tenant', 'shared'],
    },
  ];

  /**
   * Get all available templates
   */
  static getAllTemplates(): PolicyTemplate[] {
    return this.templates;
  }

  /**
   * Get templates filtered by project mode
   */
  static getTemplatesByMode(mode: SandboxProjectMode): PolicyTemplate[] {
    return this.templates.filter(t => t.mode === mode);
  }

  /**
   * Get a specific template by ID
   */
  static getTemplateById(id: string): PolicyTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Get template by mode with fallback
   */
  static getDefaultTemplateForMode(mode: SandboxProjectMode): PolicyTemplate {
    const modeTemplates = this.getTemplatesByMode(mode);
    if (modeTemplates.length > 0) {
      return modeTemplates[0];
    }
    
    // Fallback to tool evaluation baseline
    return this.templates[0];
  }

  /**
   * Search templates by tags
   */
  static searchTemplatesByTag(tag: string): PolicyTemplate[] {
    return this.templates.filter(t => t.tags.includes(tag.toLowerCase()));
  }

  /**
   * Clone a template for customization
   */
  static cloneTemplate(templateId: string): Partial<PolicyObjectModel> | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    // Deep clone the template
    const cloned: Partial<PolicyObjectModel> = JSON.parse(JSON.stringify(template.template));
    
    // Update metadata
    if (cloned.metadata) {
      cloned.policy_id = crypto.randomUUID();
      cloned.metadata.created_at = new Date().toISOString();
    }

    return cloned;
  }
}