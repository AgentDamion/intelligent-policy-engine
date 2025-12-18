import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedRequest {
  workspace_id: string;
  enterprise_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workspace_id, enterprise_id }: SeedRequest = await req.json();

    console.log('Seeding training data for workspace:', workspace_id, 'enterprise:', enterprise_id);

    // Check if training data already exists
    const { data: existingData, error: checkError } = await supabase
      .from('agent_activities')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('agent', 'Policy Agent')
      .eq('action', 'evaluate')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing data:', checkError);
    }

    if (existingData && existingData.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Training data already exists',
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sample policy instances with realistic POMs if they don't exist
    const { data: existingPolicies } = await supabase
      .from('policy_instances')
      .select('id')
      .eq('enterprise_id', enterprise_id)
      .limit(1);

    let policyIds: string[] = [];

    if (!existingPolicies || existingPolicies.length === 0) {
      const toolVersionId1 = crypto.randomUUID();
      const toolVersionId2 = crypto.randomUUID();
      const toolVersionId3 = crypto.randomUUID();
      const toolVersionId4 = crypto.randomUUID();
      const toolVersionId5 = crypto.randomUUID();

      const samplePolicies = [
        // Policy 1: ChatGPT 4.0 - Marketing Content (APPROVED)
        {
          tool_version_id: toolVersionId1,
          use_case: 'marketing_content',
          jurisdiction: ['US', 'EU', 'UK'],
          audience: ['marketing', 'communications'],
          pom: {
            policy_id: 'CHATGPT_MARKETING_001',
            version: '1.0',
            scope: ['marketing', 'external_communications'],
            metadata: {
              title: 'ChatGPT 4.0 for Marketing Content',
              description: 'Approved tool for creating marketing materials, social media posts, and blog content',
              created_at: new Date().toISOString(),
              template_type: 'approved_tool',
              compliance_tier: 'standard'
            },
            tools: [{
              tool_name: 'ChatGPT',
              tool_version: '4.0',
              provider: 'OpenAI',
              approval_status: 'approved',
              approval_context: {
                approved_by: 'IT Security & Legal',
                approval_date: new Date().toISOString(),
                expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              }
            }],
            data_controls: {
              data_classes: ['marketing_copy', 'brand_guidelines', 'product_descriptions'],
              prohibited_data: ['patient_data', 'clinical_trial_results', 'financial_data', 'proprietary_research'],
              retention_period: '30_days',
              geographic_restrictions: [],
              encryption_required: true,
              anonymization_required: false
            },
            usage_disclosure: {
              allowed_ai_usage: ['content_generation', 'copywriting', 'ideation'],
              disclosure_required: false,
              opt_out_available: true
            },
            compliance_frameworks: [{
              framework: 'Marketing Data Protection',
              controls: [
                'No confidential research data in prompts',
                'Marketing manager review all external-facing content',
                'Brand guidelines compliance check'
              ],
              evidence_required: ['approval_logs', 'content_review_records']
            }],
            risks: [{
              id: 'marketing-001',
              category: 'brand_consistency',
              severity: 'medium',
              description: 'AI-generated content may not align with brand voice',
              mitigation: 'Marketing manager review before publication',
              likelihood: 'medium'
            }],
            guardrails: {
              output_filters: ['profanity', 'medical_claims'],
              blocked_actions: ['patient_data_upload', 'clinical_data_processing'],
              rate_limits: { requests_per_hour: 100, tokens_per_day: 50000 }
            },
            validation_controls: {
              pre_execution: [{
                check_id: 'marketing_data_check',
                description: 'Verify no confidential data in prompts',
                frequency: 'every_run',
                fail_action: 'reject'
              }],
              post_execution: [{
                check_id: 'brand_review',
                description: 'Marketing manager approval',
                frequency: 'before_publication',
                fail_action: 'reject'
              }],
              monitoring: [{
                check_id: 'usage_tracking',
                description: 'Track content generation and outcomes',
                frequency: 'continuous',
                fail_action: 'log'
              }]
            }
          },
          status: 'active',
          enterprise_id: enterprise_id
        },

        // Policy 2: Claude 3.5 - Code Review (APPROVED WITH CONDITIONS)
        {
          tool_version_id: toolVersionId2,
          use_case: 'code_review',
          jurisdiction: ['Global'],
          audience: ['engineering', 'data_science'],
          pom: {
            policy_id: 'CLAUDE_CODE_REVIEW_001',
            version: '1.0',
            scope: ['development', 'internal'],
            metadata: {
              title: 'Claude 3.5 for Code Review',
              description: 'Approved for non-clinical software development and code review',
              created_at: new Date().toISOString(),
              template_type: 'conditional_approval',
              compliance_tier: 'elevated'
            },
            tools: [{
              tool_name: 'Claude',
              tool_version: '3.5',
              provider: 'Anthropic',
              approval_status: 'approved',
              approval_context: {
                approved_by: 'IT Security',
                approval_date: new Date().toISOString(),
                conditions: ['Non-clinical systems only', 'No production database code']
              }
            }],
            data_controls: {
              data_classes: ['source_code', 'test_data', 'documentation'],
              prohibited_data: ['production_databases', 'patient_records', 'fda_regulated_system_code'],
              retention_period: '90_days',
              geographic_restrictions: [],
              encryption_required: true,
              anonymization_required: false
            },
            usage_disclosure: {
              allowed_ai_usage: ['code_review', 'bug_detection', 'documentation'],
              disclosure_required: false,
              opt_out_available: false
            },
            compliance_frameworks: [{
              framework: 'Software Development Standards',
              controls: [
                'No FDA-regulated system code',
                'Senior engineer review of AI suggestions',
                'Version control all changes'
              ],
              evidence_required: ['code_review_logs', 'change_approvals']
            }],
            risks: [{
              id: 'code-001',
              category: 'code_quality',
              severity: 'low',
              description: 'AI suggestions may introduce bugs',
              mitigation: 'Senior engineer review required',
              likelihood: 'low'
            }],
            guardrails: {
              output_filters: ['credentials', 'api_keys'],
              blocked_actions: ['production_deployment', 'fda_system_modification'],
              rate_limits: { requests_per_hour: 200, tokens_per_day: 100000 }
            },
            validation_controls: {
              pre_execution: [{
                check_id: 'system_classification_check',
                description: 'Verify code is non-clinical',
                frequency: 'every_run',
                fail_action: 'reject'
              }],
              post_execution: [{
                check_id: 'senior_review',
                description: 'Senior engineer approves changes',
                frequency: 'every_suggestion',
                fail_action: 'reject'
              }],
              monitoring: [{
                check_id: 'bug_tracking',
                description: 'Monitor AI-suggested code for issues',
                frequency: 'continuous',
                fail_action: 'alert'
              }]
            }
          },
          status: 'active',
          enterprise_id: enterprise_id
        },

        // Policy 3: Midjourney - Client Presentations (APPROVED)
        {
          tool_version_id: toolVersionId3,
          use_case: 'visual_content',
          jurisdiction: ['Global'],
          audience: ['marketing', 'sales', 'communications'],
          pom: {
            policy_id: 'MIDJOURNEY_VISUAL_001',
            version: '1.0',
            scope: ['marketing', 'sales'],
            metadata: {
              title: 'Midjourney for Visual Content',
              description: 'Approved for creating marketing visuals and presentation graphics',
              created_at: new Date().toISOString(),
              template_type: 'approved_tool',
              compliance_tier: 'standard'
            },
            tools: [{
              tool_name: 'Midjourney',
              tool_version: '6.0',
              provider: 'Midjourney',
              approval_status: 'approved',
              approval_context: {
                approved_by: 'Legal & Marketing',
                approval_date: new Date().toISOString()
              }
            }],
            data_controls: {
              data_classes: ['marketing_visuals', 'presentation_graphics'],
              prohibited_data: ['confidential_research_images', 'patient_photos', 'clinical_data_visualizations'],
              retention_period: '180_days',
              geographic_restrictions: [],
              encryption_required: false,
              anonymization_required: false
            },
            usage_disclosure: {
              allowed_ai_usage: ['image_generation', 'visual_design'],
              disclosure_required: true,
              opt_out_available: false
            },
            compliance_frameworks: [{
              framework: 'IP Protection Standards',
              controls: [
                'Watermark all AI-generated images',
                'Document image sources',
                'Legal review for external use'
              ],
              evidence_required: ['image_metadata', 'usage_logs']
            }],
            risks: [{
              id: 'visual-001',
              category: 'ip_rights',
              severity: 'low',
              description: 'Generated images may have unclear IP ownership',
              mitigation: 'Legal review before external publication',
              likelihood: 'low'
            }],
            guardrails: {
              output_filters: ['inappropriate_content'],
              blocked_actions: ['clinical_visualization', 'patient_imagery'],
              rate_limits: { requests_per_hour: 50, tokens_per_day: 10000 }
            },
            validation_controls: {
              pre_execution: [{
                check_id: 'content_type_check',
                description: 'Ensure non-clinical visual content',
                frequency: 'every_run',
                fail_action: 'reject'
              }],
              post_execution: [{
                check_id: 'watermark_check',
                description: 'Verify watermark applied',
                frequency: 'every_image',
                fail_action: 'alert'
              }],
              monitoring: [{
                check_id: 'usage_audit',
                description: 'Track generated images',
                frequency: 'continuous',
                fail_action: 'log'
              }]
            }
          },
          status: 'active',
          enterprise_id: enterprise_id
        },

        // Policy 4: Unapproved LLM - Clinical Data (REJECTED)
        {
          tool_version_id: toolVersionId4,
          use_case: 'clinical_data_analysis',
          jurisdiction: ['US'],
          audience: ['clinical_research'],
          pom: {
            policy_id: 'UNAPPROVED_CLINICAL_001',
            version: '1.0',
            scope: ['blocked'],
            metadata: {
              title: 'Unapproved LLM - Clinical Data Processing',
              description: 'BLOCKED: Unapproved tools cannot process clinical/patient data',
              created_at: new Date().toISOString(),
              template_type: 'rejection_policy',
              compliance_tier: 'critical'
            },
            tools: [{
              tool_name: 'Generic LLM',
              tool_version: 'any',
              provider: 'Various',
              approval_status: 'rejected',
              approval_context: {
                rejected_by: 'Compliance & IT Security',
                rejection_date: new Date().toISOString(),
                rejection_reason: 'Tool not FDA-validated, no BAA, no HIPAA compliance'
              }
            }],
            data_controls: {
              data_classes: [],
              prohibited_data: ['patient_data', 'phi', 'clinical_trial_data', 'medical_records'],
              retention_period: 'not_applicable',
              geographic_restrictions: ['all'],
              encryption_required: true,
              anonymization_required: true
            },
            usage_disclosure: {
              allowed_ai_usage: [],
              disclosure_required: true,
              opt_out_available: true
            },
            compliance_frameworks: [{
              framework: 'HIPAA & FDA 21 CFR Part 11',
              controls: [
                'Tool must have FDA validation',
                'BAA required for PHI processing',
                'Audit trail required',
                'Data encryption required'
              ],
              evidence_required: ['fda_validation_docs', 'baa_agreement', 'audit_logs']
            }],
            risks: [{
              id: 'clinical-reject-001',
              category: 'regulatory_compliance',
              severity: 'critical',
              description: 'Processing patient data with unapproved tool violates HIPAA',
              mitigation: 'Block all usage, use approved clinical tools only',
              likelihood: 'high'
            }],
            guardrails: {
              output_filters: [],
              blocked_actions: ['all_clinical_data_processing', 'phi_upload', 'patient_analysis'],
              rate_limits: { requests_per_hour: 0, tokens_per_day: 0 }
            },
            validation_controls: {
              pre_execution: [{
                check_id: 'tool_approval_check',
                description: 'Verify tool is in approved registry',
                frequency: 'every_run',
                fail_action: 'reject'
              }],
              post_execution: [],
              monitoring: [{
                check_id: 'violation_detection',
                description: 'Alert on any attempted usage',
                frequency: 'continuous',
                fail_action: 'alert'
              }]
            }
          },
          status: 'deprecated',
          enterprise_id: enterprise_id
        },

        // Policy 5: ChatGPT 4.0 - Clinical Trial Protocol Design (NEEDS REVIEW)
        {
          tool_version_id: toolVersionId5,
          use_case: 'clinical_trial_protocol',
          jurisdiction: ['US', 'EU'],
          audience: ['clinical_research', 'medical_affairs'],
          pom: {
            policy_id: 'CHATGPT_PROTOCOL_001',
            version: '1.0',
            scope: ['clinical_research', 'high_risk'],
            metadata: {
              title: 'ChatGPT 4.0 - Clinical Trial Protocol Drafting',
              description: 'High-risk use case requiring medical review and synthetic data only',
              created_at: new Date().toISOString(),
              template_type: 'conditional_approval',
              compliance_tier: 'critical'
            },
            tools: [{
              tool_name: 'ChatGPT',
              tool_version: '4.0',
              provider: 'OpenAI',
              approval_status: 'conditional',
              approval_context: {
                approved_by: 'Medical Affairs & Compliance',
                approval_date: new Date().toISOString(),
                conditions: ['Synthetic data only', 'Medical director review required', 'FDA compliance check']
              }
            }],
            data_controls: {
              data_classes: ['synthetic_data', 'protocol_templates', 'published_research'],
              prohibited_data: ['real_patient_data', 'unpublished_trial_results', 'proprietary_methods'],
              retention_period: '365_days',
              geographic_restrictions: [],
              encryption_required: true,
              anonymization_required: true
            },
            usage_disclosure: {
              allowed_ai_usage: ['protocol_drafting', 'literature_synthesis'],
              disclosure_required: true,
              opt_out_available: false
            },
            compliance_frameworks: [{
              framework: 'FDA 21 CFR Part 11 & ICH GCP',
              controls: [
                'Use synthetic data only',
                'Medical director approval required',
                'Document all AI-assisted sections',
                'IRB review before implementation'
              ],
              evidence_required: ['medical_review_log', 'data_source_verification', 'irb_approval']
            }],
            risks: [{
              id: 'protocol-001',
              category: 'patient_safety',
              severity: 'high',
              description: 'Incorrect protocol design could impact patient safety',
              mitigation: 'Mandatory medical director review, IRB approval required',
              likelihood: 'medium'
            }],
            guardrails: {
              output_filters: ['patient_identifiers', 'proprietary_data'],
              blocked_actions: ['real_patient_data_upload', 'automated_protocol_submission'],
              rate_limits: { requests_per_hour: 20, tokens_per_day: 20000 },
              human_in_the_loop: true
            },
            validation_controls: {
              pre_execution: [{
                check_id: 'synthetic_data_verification',
                description: 'Verify only synthetic/published data used',
                frequency: 'every_run',
                fail_action: 'reject'
              }],
              post_execution: [{
                check_id: 'medical_director_review',
                description: 'Medical director must review all outputs',
                frequency: 'every_output',
                fail_action: 'reject'
              }, {
                check_id: 'fda_compliance_check',
                description: 'Verify FDA regulatory compliance',
                frequency: 'before_finalization',
                fail_action: 'reject'
              }],
              monitoring: [{
                check_id: 'protocol_audit',
                description: 'Track all protocol modifications',
                frequency: 'continuous',
                fail_action: 'log'
              }]
            }
          },
          status: 'active',
          enterprise_id: enterprise_id
        }
      ];

      const { data: createdPolicies, error: policyError } = await supabase
        .from('policy_instances')
        .insert(samplePolicies)
        .select('id');

      if (policyError) {
        console.error('Error creating sample policies:', policyError);
        throw new Error('Failed to create sample policies');
      }

      policyIds = createdPolicies.map((p: any) => p.id);
      console.log('Created sample policies:', policyIds);
    } else {
      const { data: policies } = await supabase
        .from('policy_instances')
        .select('id')
        .eq('enterprise_id', enterprise_id)
        .limit(10);
      
      policyIds = policies?.map((p: any) => p.id) || [];
    }

    // Generate 20 training examples with POM-specific evaluations
    const trainingExamples = [
      // ============= 5 APPROVED EXAMPLES =============
      
      // Example 1: ChatGPT Marketing - Social Media Post (APPROVED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[0],
            request: {
              tool: 'ChatGPT',
              version: '4.0',
              use_case: 'marketing_content',
              jurisdiction: 'US',
              data_involved: ['brand_guidelines', 'product_descriptions']
            }
          },
          output: {
            decision: { status: 'approved', confidence: 0.95 },
            reasoning: 'Usage complies with policy CHATGPT_MARKETING_001. All data_controls satisfied: requested data_classes [brand_guidelines, product_descriptions] are allowed. No blocked_actions violated. Risk level medium acceptable for marketing use case.',
            policy_reference: {
              policy_instance_id: policyIds[0],
              controls_evaluated: [
                'data_controls.data_classes: approved',
                'data_controls.prohibited_data: none violated',
                'guardrails.blocked_actions: none violated',
                'risks[0].severity: medium - acceptable'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'approved',
              reasoning: 'AI correctly evaluated against POM. Marketing manager confirmed brand guidelines followed. No confidential data in prompts.',
              reviewer: 'john.smith@pharma.com',
              policy_alignment_score: 0.97,
              pom_controls_verified: [
                'data_controls.prohibited_data: no patient_data, clinical_trial_results, or financial_data detected',
                'validation_controls.pre_execution.marketing_data_check: passed',
                'guardrails.blocked_actions: no patient_data_upload or clinical_data_processing'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 2: Claude Code Review - Bug Fix (APPROVED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[1],
            request: {
              tool: 'Claude',
              version: '3.5',
              use_case: 'code_review',
              jurisdiction: 'Global',
              data_involved: ['source_code', 'test_data']
            }
          },
          output: {
            decision: { status: 'approved', confidence: 0.92 },
            reasoning: 'Usage complies with policy CLAUDE_CODE_REVIEW_001. Code is non-clinical internal tool. data_controls allow source_code and test_data. No FDA-regulated systems involved.',
            policy_reference: {
              policy_instance_id: policyIds[1],
              controls_evaluated: [
                'data_controls.prohibited_data: no production_databases or fda_regulated_system_code',
                'guardrails.blocked_actions: not production_deployment',
                'compliance_frameworks[0].controls: non-clinical verified'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'approved',
              reasoning: 'AI evaluation correct. Senior engineer reviewed code suggestions. Non-clinical system confirmed. No GxP concerns.',
              reviewer: 'sarah.chen@pharma.com',
              policy_alignment_score: 0.94,
              pom_controls_verified: [
                'data_controls.prohibited_data: production_databases not involved',
                'validation_controls.pre_execution.system_classification_check: non-clinical verified',
                'validation_controls.post_execution.senior_review: senior engineer approval obtained'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 3: Midjourney - Sales Presentation Graphics (APPROVED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[2],
            request: {
              tool: 'Midjourney',
              version: '6.0',
              use_case: 'visual_content',
              jurisdiction: 'Global',
              data_involved: ['marketing_visuals']
            }
          },
          output: {
            decision: { status: 'approved', confidence: 0.90 },
            reasoning: 'Usage complies with policy MIDJOURNEY_VISUAL_001. Creating marketing visuals is approved use case. No prohibited_data (confidential_research_images, patient_photos) involved.',
            policy_reference: {
              policy_instance_id: policyIds[2],
              controls_evaluated: [
                'usage_disclosure.allowed_ai_usage: image_generation approved',
                'data_controls.prohibited_data: no clinical_data_visualizations',
                'guardrails.blocked_actions: not clinical_visualization or patient_imagery'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'approved',
              reasoning: 'Correct evaluation. Images for internal sales deck. Watermarks applied per policy. Legal reviewed.',
              reviewer: 'marketing.lead@pharma.com',
              policy_alignment_score: 0.91,
              pom_controls_verified: [
                'data_controls.prohibited_data: no confidential_research_images or patient_photos',
                'validation_controls.post_execution.watermark_check: watermark applied',
                'compliance_frameworks[0].controls: legal review completed'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 4: ChatGPT Marketing - Blog Post (APPROVED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[0],
            request: {
              tool: 'ChatGPT',
              version: '4.0',
              use_case: 'marketing_content',
              jurisdiction: 'EU',
              data_involved: ['product_descriptions']
            }
          },
          output: {
            decision: { status: 'approved', confidence: 0.93 },
            reasoning: 'Complies with CHATGPT_MARKETING_001. Product descriptions are allowed data_class. No confidential research data. Marketing review required per validation_controls.post_execution.',
            policy_reference: {
              policy_instance_id: policyIds[0],
              controls_evaluated: [
                'data_controls.data_classes: product_descriptions allowed',
                'risks[0].mitigation: marketing manager review enforced',
                'guardrails.rate_limits: within limits'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'approved',
              reasoning: 'AI assessment accurate. Blog post reviewed by marketing manager. Brand voice maintained. No confidential info disclosed.',
              reviewer: 'content.manager@pharma.com',
              policy_alignment_score: 0.95,
              pom_controls_verified: [
                'validation_controls.post_execution.brand_review: marketing manager approved',
                'data_controls.prohibited_data: no clinical_trial_results or proprietary_research',
                'risks[0].mitigation: brand_consistency risk mitigated'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 5: Claude - Documentation Generation (APPROVED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[1],
            request: {
              tool: 'Claude',
              version: '3.5',
              use_case: 'code_review',
              jurisdiction: 'Global',
              data_involved: ['documentation']
            }
          },
          output: {
            decision: { status: 'approved', confidence: 0.89 },
            reasoning: 'Complies with CLAUDE_CODE_REVIEW_001. Documentation is allowed data_class. Non-clinical system confirmed. Senior engineer review per post_execution controls.',
            policy_reference: {
              policy_instance_id: policyIds[1],
              controls_evaluated: [
                'data_controls.data_classes: documentation allowed',
                'validation_controls.post_execution.senior_review: required',
                'compliance_frameworks[0].controls: version_control enforced'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'approved',
              reasoning: 'Correct. Documentation for internal DevOps tool. Senior engineer verified accuracy. No GxP systems involved.',
              reviewer: 'tech.lead@pharma.com',
              policy_alignment_score: 0.92,
              pom_controls_verified: [
                'data_controls.prohibited_data: no fda_regulated_system_code',
                'validation_controls.pre_execution.system_classification_check: non-clinical confirmed',
                'validation_controls.post_execution.senior_review: tech lead approval obtained'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // ============= 5 REJECTED EXAMPLES =============

      // Example 6: Unapproved LLM - Patient Data (REJECTED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[3],
            request: {
              tool: 'Generic LLM',
              version: 'any',
              use_case: 'clinical_data_analysis',
              jurisdiction: 'US',
              data_involved: ['patient_data']
            }
          },
          output: {
            decision: { status: 'rejected', confidence: 0.98 },
            reasoning: 'REJECTED per policy UNAPPROVED_CLINICAL_001. Tool approval_status is rejected. patient_data is in prohibited_data list. HIPAA violation risk. No BAA with provider.',
            violations: [{
              control: 'tools[0].approval_status',
              severity: 'critical',
              description: 'Tool not in approved registry, lacks FDA validation'
            }, {
              control: 'data_controls.prohibited_data',
              severity: 'critical',
              description: 'Attempting to process patient_data with unapproved tool'
            }],
            policy_reference: {
              policy_instance_id: policyIds[3],
              controls_evaluated: [
                'tools[0].approval_status: rejected',
                'data_controls.prohibited_data: patient_data violated',
                'risks[0].severity: critical HIPAA violation',
                'guardrails.blocked_actions: all_clinical_data_processing blocked'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'rejected',
              reasoning: 'AI rejection correct. Clear HIPAA violation - unapproved tool with patient data. Compliance team confirmed no BAA exists.',
              reviewer: 'compliance.officer@pharma.com',
              policy_alignment_score: 0.99,
              pom_controls_verified: [
                'compliance_frameworks[0].controls: no FDA validation, no BAA',
                'validation_controls.pre_execution.tool_approval_check: tool not in approved registry',
                'risks[0]: critical regulatory_compliance risk detected'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 7: ChatGPT Free - PHI Processing (REJECTED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[3],
            request: {
              tool: 'ChatGPT',
              version: 'Free',
              use_case: 'clinical_data_analysis',
              jurisdiction: 'US',
              data_involved: ['phi', 'medical_records']
            }
          },
          output: {
            decision: { status: 'rejected', confidence: 0.99 },
            reasoning: 'REJECTED. Free version lacks BAA for HIPAA compliance. phi and medical_records in prohibited_data list. No encryption guarantees. Critical compliance risk.',
            violations: [{
              control: 'data_controls.prohibited_data',
              severity: 'critical',
              description: 'PHI and medical_records are prohibited data classes'
            }, {
              control: 'compliance_frameworks[0]',
              severity: 'critical',
              description: 'No BAA for HIPAA compliance'
            }],
            policy_reference: {
              policy_instance_id: policyIds[3],
              controls_evaluated: [
                'data_controls.prohibited_data: phi and medical_records violated',
                'compliance_frameworks[0].controls: BAA required - not present',
                'risks[0].severity: critical',
                'guardrails.rate_limits: 0 requests allowed'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'rejected',
              reasoning: 'Correct rejection. Free tier has no BAA. PHI processing would violate HIPAA. User redirected to approved clinical tools.',
              reviewer: 'hipaa.compliance@pharma.com',
              policy_alignment_score: 0.99,
              pom_controls_verified: [
                'compliance_frameworks[0].evidence_required: no baa_agreement exists',
                'data_controls.prohibited_data: phi explicitly prohibited',
                'validation_controls.monitoring.violation_detection: alert triggered'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 8: Production Database Code with Claude (REJECTED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[1],
            request: {
              tool: 'Claude',
              version: '3.5',
              use_case: 'code_review',
              jurisdiction: 'Global',
              data_involved: ['production_databases']
            }
          },
          output: {
            decision: { status: 'rejected', confidence: 0.96 },
            reasoning: 'REJECTED per CLAUDE_CODE_REVIEW_001. production_databases in prohibited_data list. Policy allows only non-clinical systems. Production database changes require higher controls.',
            violations: [{
              control: 'data_controls.prohibited_data',
              severity: 'high',
              description: 'production_databases explicitly prohibited'
            }],
            policy_reference: {
              policy_instance_id: policyIds[1],
              controls_evaluated: [
                'data_controls.prohibited_data: production_databases violated',
                'tools[0].approval_context.conditions: Non-clinical systems only',
                'validation_controls.pre_execution.system_classification_check: failed'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'rejected',
              reasoning: 'AI correctly rejected. Production database code requires validated tools and stricter controls. User redirected to DBA process.',
              reviewer: 'database.admin@pharma.com',
              policy_alignment_score: 0.97,
              pom_controls_verified: [
                'data_controls.prohibited_data: production_databases not allowed',
                'compliance_frameworks[0].controls: version_control alone insufficient for production',
                'validation_controls.pre_execution.system_classification_check: production system detected'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 9: FDA-Regulated System Modification (REJECTED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[1],
            request: {
              tool: 'Claude',
              version: '3.5',
              use_case: 'code_review',
              jurisdiction: 'US',
              data_involved: ['fda_regulated_system_code']
            }
          },
          output: {
            decision: { status: 'rejected', confidence: 0.97 },
            reasoning: 'REJECTED. fda_regulated_system_code in prohibited_data. FDA-regulated systems require validated tools per 21 CFR Part 11. blocked_actions includes fda_system_modification.',
            violations: [{
              control: 'data_controls.prohibited_data',
              severity: 'critical',
              description: 'FDA-regulated system code explicitly prohibited'
            }, {
              control: 'guardrails.blocked_actions',
              severity: 'critical',
              description: 'fda_system_modification is blocked action'
            }],
            policy_reference: {
              policy_instance_id: policyIds[1],
              controls_evaluated: [
                'data_controls.prohibited_data: fda_regulated_system_code violated',
                'guardrails.blocked_actions: fda_system_modification blocked',
                'compliance_frameworks[0]: non-FDA systems only'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'rejected',
              reasoning: 'Correct rejection. FDA-regulated systems require validated tools with full audit trails. User directed to GxP-compliant development process.',
              reviewer: 'quality.assurance@pharma.com',
              policy_alignment_score: 0.98,
              pom_controls_verified: [
                'data_controls.prohibited_data: fda_regulated_system_code not permitted',
                'guardrails.blocked_actions: fda_system_modification enforcement verified',
                'compliance_frameworks[0].controls: FDA validation requirements not met'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Example 10: Unverified Tool - Clinical Trial Data (REJECTED)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[3],
            request: {
              tool: 'Alpha ML Library',
              version: '0.1.0-alpha',
              use_case: 'clinical_data_analysis',
              jurisdiction: 'US',
              data_involved: ['clinical_trial_data']
            }
          },
          output: {
            decision: { status: 'rejected', confidence: 0.98 },
            reasoning: 'REJECTED. Alpha/pre-release tool not validated for GxP environments. clinical_trial_data in prohibited_data for unapproved tools. Use validated statistical tools (SAS, R with validated packages).',
            violations: [{
              control: 'tools[0].approval_status',
              severity: 'critical',
              description: 'Unvalidated alpha tool not approved for clinical use'
            }, {
              control: 'data_controls.prohibited_data',
              severity: 'critical',
              description: 'clinical_trial_data prohibited for unapproved tools'
            }],
            policy_reference: {
              policy_instance_id: policyIds[3],
              controls_evaluated: [
                'tools[0].approval_status: rejected - no validation',
                'data_controls.prohibited_data: clinical_trial_data violated',
                'compliance_frameworks[0].controls: FDA validation required',
                'risks[0].severity: critical regulatory risk'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'rejected',
              reasoning: 'AI rejection accurate. Alpha software lacks validation documentation required for GxP. Biostatistics team confirmed use of SAS instead.',
              reviewer: 'biostatistics.lead@pharma.com',
              policy_alignment_score: 0.99,
              pom_controls_verified: [
                'compliance_frameworks[0].evidence_required: no fda_validation_docs exist',
                'risks[0]: critical regulatory_compliance risk for unvalidated tool',
                'validation_controls.pre_execution.tool_approval_check: tool not in registry'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // ============= 10 EDGE CASES (NEEDS_REVIEW) =============
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'SPSS Statistics',
            version: '29.0',
            use_case: 'Statistical analysis of de-identified patient outcomes',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Biostatistics',
              data_classification: 'confidential',
              data_controls: ['de-identified', 'aggregated']
            }
          },
          output: {
            decision: 'APPROVED',
            confidence: 0.92,
            reasoning: 'Data is properly de-identified and aggregated. Tool is on approved list for statistical analysis. PHI controls not needed for de-identified data.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved',
              review_notes: 'De-identification verified, appropriate statistical tool',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Tableau',
            version: '2023.3',
            use_case: 'Data visualization for regulatory submission',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Regulatory Affairs',
              data_classification: 'confidential',
              purpose: 'FDA submission package'
            }
          },
          output: {
            decision: 'APPROVED',
            confidence: 0.88,
            reasoning: 'Tableau is approved for regulatory submissions. Data will remain within validated environment. Output will be reviewed by QA before submission.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved',
              review_notes: 'Appropriate tool for regulatory submission, QA review confirmed',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Grammarly',
            version: 'Business',
            use_case: 'Proofreading internal training materials',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Training & Development',
              data_classification: 'internal',
              content_type: 'non-confidential educational materials'
            }
          },
          output: {
            decision: 'APPROVED',
            confidence: 0.90,
            reasoning: 'Business version includes data residency controls. Content is non-confidential training materials. No regulatory or PHI concerns.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved',
              review_notes: 'Appropriate for internal training materials',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'SAS Enterprise Miner',
            version: '15.2',
            use_case: 'Predictive modeling for patient recruitment',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Clinical Operations',
              data_classification: 'confidential',
              data_source: 'de-identified historical trial data'
            }
          },
          output: {
            decision: 'APPROVED',
            confidence: 0.93,
            reasoning: 'SAS is validated tool for clinical analytics. Data is de-identified. Model outputs will be reviewed by Clinical Ops before implementation.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved',
              review_notes: 'Validated tool, appropriate use case, de-identified data confirmed',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // 5 REJECTED examples
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'ChatGPT',
            version: 'Free',
            use_case: 'Summarizing patient medical records',
            policy_instance_id: policyIds[1] || null,
            context: {
              department: 'Clinical Operations',
              data_classification: 'PHI',
              user_role: 'Clinical Coordinator'
            }
          },
          output: {
            decision: 'REJECTED',
            confidence: 0.98,
            reasoning: 'Free version of ChatGPT does not meet HIPAA requirements. PHI data cannot be processed by non-BAA tools. Use approved medical AI tools instead.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'rejected',
              review_notes: 'Clear HIPAA violation - no BAA with OpenAI for free tier',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Consumer AI Image Generator',
            version: 'Free',
            use_case: 'Creating images for patient education materials',
            policy_instance_id: policyIds[1] || null,
            context: {
              department: 'Patient Education',
              data_classification: 'public',
              content_type: 'educational graphics'
            }
          },
          output: {
            decision: 'REJECTED',
            confidence: 0.85,
            reasoning: 'Free AI image tools lack IP protections and usage rights. For patient-facing materials, we need licensed tools with clear IP ownership.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'rejected',
              review_notes: 'IP and licensing concerns for patient-facing materials',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Unverified ML Library',
            version: '0.1.0-alpha',
            use_case: 'Clinical trial data analysis',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Data Science',
              data_classification: 'confidential',
              purpose: 'exploratory analysis'
            }
          },
          output: {
            decision: 'REJECTED',
            confidence: 0.96,
            reasoning: 'Alpha/pre-release tools are not validated for clinical use. Use approved, validated statistical tools like SAS or R with validated packages.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'rejected',
              review_notes: 'Tool not validated, not suitable for GxP environment',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Public Cloud OCR Service',
            version: 'Standard',
            use_case: 'Digitizing patient consent forms',
            policy_instance_id: policyIds[1] || null,
            context: {
              department: 'Clinical Operations',
              data_classification: 'PHI',
              document_type: 'signed consent forms'
            }
          },
          output: {
            decision: 'REJECTED',
            confidence: 0.97,
            reasoning: 'PHI documents cannot be processed by public cloud services without BAA. No data residency guarantees. Use on-premise or HIPAA-compliant OCR solutions.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'rejected',
              review_notes: 'Clear HIPAA violation - PHI to non-compliant third party',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Social Media AI Assistant',
            version: 'Consumer',
            use_case: 'Drafting social media posts about trial results',
            policy_instance_id: policyIds[1] || null,
            context: {
              department: 'Marketing',
              data_classification: 'confidential',
              content: 'trial outcomes, future indications'
            }
          },
          output: {
            decision: 'REJECTED',
            confidence: 0.94,
            reasoning: 'Trial results are confidential until published. Consumer AI tools lack data controls. Risk of premature disclosure. Use approved comms tools with data controls.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'rejected',
              review_notes: 'Risk of premature disclosure, no data controls',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // ============= 10 EDGE CASES (NEEDS_REVIEW) =============
      
      // Example 11: ChatGPT Protocol Design - Synthetic Data (NEEDS_REVIEW)
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[4],
            request: {
              tool: 'ChatGPT',
              version: '4.0',
              use_case: 'clinical_trial_protocol',
              jurisdiction: 'US',
              data_involved: ['synthetic_data', 'protocol_templates']
            }
          },
          output: {
            decision: { status: 'needs_review', confidence: 0.72 },
            reasoning: 'HIGH-RISK use case per CHATGPT_PROTOCOL_001. Synthetic data is allowed, but protocol design impacts patient safety. Required: medical director review, FDA compliance check, IRB approval.',
            required_approvals: ['medical_director', 'regulatory_affairs', 'irb'],
            policy_reference: {
              policy_instance_id: policyIds[4],
              controls_evaluated: [
                'data_controls.data_classes: synthetic_data allowed',
                'risks[0].severity: high patient_safety risk',
                'validation_controls.post_execution.medical_director_review: required',
                'guardrails.human_in_the_loop: true'
              ]
            }
          },
          metadata: {
            policy_version: '1.0',
            evaluation_timestamp: new Date().toISOString(),
            human_review: {
              final_decision: 'approved_with_conditions',
              conditions: ['Medical director reviewed protocol sections', 'FDA compliance verified', 'IRB approval obtained before implementation'],
              reasoning: 'AI correctly flagged high-risk scenario. Medical director confirmed AI-drafted sections clinically sound with modifications. IRB approved final protocol.',
              reviewer: 'medical.director@pharma.com',
              policy_alignment_score: 0.88,
              pom_controls_verified: [
                'data_controls.prohibited_data: no real_patient_data used',
                'validation_controls.pre_execution.synthetic_data_verification: confirmed synthetic only',
                'validation_controls.post_execution.medical_director_review: completed',
                'validation_controls.post_execution.fda_compliance_check: passed',
                'compliance_frameworks[0].evidence_required: medical_review_log and irb_approval documented'
              ],
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },

      // Remaining 9 edge cases with similar POM-focused structure
      {
        agent: 'PolicyAgent',
        action: 'policy_evaluation',
        status: 'completed',
        details: {
          input: {
            policy_instance_id: policyIds[1],
            request: {
              tool: 'Claude',
              version: '3.5',
              use_case: 'code_review',
              context: {
                department: 'Pharmacovigilance',
                data_classification: 'PHI',
                purpose: 'safety signal detection'
              }
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.72,
            reasoning: 'Enterprise version has BAA, but AE narratives contain PHI. Requires additional controls: PHI redaction before processing, and pharmacovigilance SME review of outputs.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Implement PHI redaction preprocessing', 'PV SME review all AI outputs', 'Document all AI-detected signals separately'],
              review_notes: 'Approved with strict controls - PHI redaction mandatory, PV oversight required',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Python Scikit-Learn',
            version: '1.3.0',
            use_case: 'Building predictive model for patient stratification',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Data Science',
              data_classification: 'confidential',
              data_source: 'de-identified patient data'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.68,
            reasoning: 'Open-source library - version is current and widely used. However, model outputs for patient stratification require validation. Needs data science + clinical review.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Clinical SME review of model outputs', 'Document model validation', 'Version lock in production'],
              review_notes: 'Approved for research use with validation requirements',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Notion AI',
            version: 'Enterprise',
            use_case: 'Organizing clinical trial documentation',
            policy_instance_id: policyIds[2] || null,
            context: {
              department: 'Clinical Operations',
              data_classification: 'confidential',
              content_type: 'trial protocols, SOPs'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.65,
            reasoning: 'Enterprise version has data controls, but trial documents may contain confidential IP. Need to verify: data residency, access controls, and what AI features will be used.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Disable AI features that send data to external servers', 'Restrict to internal documents only', 'No protocol text in AI features'],
              review_notes: 'Approved for documentation organization, AI features restricted',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Azure OpenAI Service',
            version: 'GPT-4',
            use_case: 'Generating patient recruitment materials',
            policy_instance_id: policyIds[2] || null,
            context: {
              department: 'Clinical Operations',
              data_classification: 'public',
              purpose: 'patient-facing recruitment materials'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.70,
            reasoning: 'Azure OpenAI has BAA and compliance controls. However, patient-facing materials require regulatory review. AI-generated content needs human oversight for accuracy and appropriateness.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Regulatory Affairs review all outputs', 'Clinical SME verify medical accuracy', 'Legal review of claims'],
              review_notes: 'Approved for drafting only - mandatory review chain before publication',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Transcription AI Service',
            version: '2.0',
            use_case: 'Transcribing patient interviews for qualitative research',
            policy_instance_id: policyIds[1] || null,
            context: {
              department: 'Clinical Research',
              data_classification: 'PHI',
              purpose: 'qualitative analysis'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.64,
            reasoning: 'Interviews contain PHI and sensitive patient information. Service needs BAA verification. Also need to assess: data residency, retention policy, and whether service trains on data.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Verify BAA in place', 'Confirm no training on data', 'Implement data retention limits (30 days)', 'Review transcripts for PHI redaction needs'],
              review_notes: 'Conditional approval pending BAA verification and data controls',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Coding AI Assistant',
            version: 'Enterprise',
            use_case: 'Developing custom data analysis scripts',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Data Science',
              data_classification: 'internal',
              purpose: 'clinical data analysis automation'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.69,
            reasoning: 'AI-generated code for clinical analysis requires validation. Code could introduce errors or biases. Needs: code review by senior data scientist, unit testing, validation against known results.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['All AI-generated code must be peer-reviewed', 'Unit tests required before production use', 'Validate against known test cases'],
              review_notes: 'Approved for development use with mandatory code review process',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Document Translation AI',
            version: '3.2',
            use_case: 'Translating informed consent forms for international trial',
            policy_instance_id: policyIds[2] || null,
            context: {
              department: 'Clinical Operations',
              data_classification: 'confidential',
              purpose: 'ICF translation for EU sites'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.67,
            reasoning: 'ICF translation is critical for patient safety and regulatory compliance. AI can assist but requires: certified translator review, legal/regulatory review, and IRB approval of translations.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Certified translator review all translations', 'Legal/regulatory review', 'IRB approval before use', 'Document translation process'],
              review_notes: 'Approved as translation aid only - certified translator required',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Survey Analysis AI',
            version: '2.5',
            use_case: 'Analyzing patient-reported outcomes surveys',
            policy_instance_id: policyIds[0] || null,
            context: {
              department: 'Clinical Research',
              data_classification: 'confidential',
              data_source: 'PRO surveys (de-identified)'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.71,
            reasoning: 'PRO data is de-identified, which is good. However, AI analysis of clinical endpoints requires validation. Need to verify: analysis methodology, statistical soundness, and clinical interpretation oversight.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Statistician review of methodology', 'Clinical SME interpret results', 'Compare AI results to traditional analysis'],
              review_notes: 'Approved for exploratory analysis with statistical oversight',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Presentation AI',
            version: 'Business',
            use_case: 'Creating investor presentation on trial results',
            policy_instance_id: policyIds[2] || null,
            context: {
              department: 'Corporate Communications',
              data_classification: 'confidential',
              content: 'pre-publication trial data'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.66,
            reasoning: 'Trial results are material non-public information. AI tool poses risks: data leakage, premature disclosure. Need to verify: data handling, output storage, and whether tool trains on data.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['Verify no training on company data', 'Legal review before external sharing', 'Use only for internal draft iterations', 'Final presentation must be manual'],
              review_notes: 'Approved for internal draft only - strict controls on final output',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      },
      {
        agent: 'Policy Agent',
        action: 'evaluate',
        status: 'completed',
        details: {
          input: {
            tool_name: 'Medical Coding AI',
            version: '2.1',
            use_case: 'Auto-coding adverse events to MedDRA terms',
            policy_instance_id: policyIds[1] || null,
            context: {
              department: 'Pharmacovigilance',
              data_classification: 'confidential',
              purpose: 'AE coding efficiency'
            }
          },
          output: {
            decision: 'NEEDS_REVIEW',
            confidence: 0.73,
            reasoning: 'AE coding is GxP critical activity. AI can assist but requires validation. Need: PV SME review of AI codes, error rate monitoring, system validation, and audit trail documentation.'
          },
          metadata: {
            policy_version: '1.0',
            evaluation_date: new Date().toISOString(),
            human_review: {
              reviewer_id: crypto.randomUUID(),
              final_decision: 'approved_with_conditions',
              conditions: ['PV SME review all AI codes', 'Validate system per GxP requirements', 'Monitor error rates monthly', 'Maintain full audit trail'],
              review_notes: 'Approved as coding aid - human review mandatory per GxP',
              reviewed_at: new Date().toISOString()
            }
          }
        }
      }
    ];

    // Insert all training examples
    const trainingData = trainingExamples.map(example => ({
      ...example,
      workspace_id,
      enterprise_id,
      created_at: new Date().toISOString()
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('agent_activities')
      .insert(trainingData)
      .select();

    if (insertError) {
      console.error('Error inserting training data:', insertError);
      throw new Error(`Failed to insert training data: ${insertError.message}`);
    }

    console.log(`Successfully inserted ${insertedData.length} training examples`);

    // Count by decision type
    const approvedCount = trainingData.filter(t => t.details.output.decision === 'APPROVED').length;
    const rejectedCount = trainingData.filter(t => t.details.output.decision === 'REJECTED').length;
    const reviewCount = trainingData.filter(t => t.details.output.decision === 'NEEDS_REVIEW').length;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Training data seeded successfully',
        count: insertedData.length,
        summary: {
          approved: approvedCount,
          rejected: rejectedCount,
          needs_review: reviewCount,
          policies_created: policyIds.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error seeding training data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
