import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Seed GlobalMed middleware request history:
 * - 430 total ONCAVEX HCP emails (90 days)
 * - 17 Persado violations
 * - 413 clean requests
 */
export async function seedGlobalMedMiddlewareData(
  enterpriseId: string,
  partnerIds: Record<string, string>,
  workspaceIds: Record<string, string>
) {
  console.log('[GlobalMed] Starting middleware data seeding...');

  try {
    // Check if data already exists
    const { data: existingRequests } = await supabase
      .from('middleware_requests')
      .select('id')
      .eq('enterprise_id', enterpriseId)
      .limit(1);

    if (existingRequests && existingRequests.length > 0) {
      console.log('[GlobalMed] Middleware data already exists, skipping...');
      return;
    }

    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    const requests = [];

    // Generate 17 Persado violations
    for (let i = 0; i < 17; i++) {
      const timestamp = new Date(ninetyDaysAgo + Math.random() * (now - ninetyDaysAgo));
      const partner = i % 2 === 0 ? 'ipg_health' : 'omnicom_health';
      
      requests.push({
        enterprise_id: enterpriseId,
        partner_id: partnerIds[partner],
        model: 'persado-v2024.3',
        endpoint: '/v1/optimize/email-subject',
        policy_decision: 'block',
        policy_evaluation: {
          checks_run: 3,
          checks_passed: 0,
          failed_requirements: [
            'globalmed.persado.allowed_audience_patient_only',
            'globalmed.persado.requires_reference_content',
            'oncavex.persado.brand_disallowed'
          ]
        },
        context_analysis: {
          brand: 'ONCAVEX™',
          audience: 'HCP',
          channel: 'email',
          content_type: 'subject_line',
          campaign_id: `ONCAVEX-HCP-${i + 1}`
        },
        proof_bundle: {
          bundle_id: `pb-oncavex-pers-${String(i + 1).padStart(3, '0')}`,
          claim: 'policy_violation',
          tool_declaration_hash: `sha256:${Math.random().toString(36).substring(7)}`,
          tools_declared: ['persado-v2024.3'],
          policy_snapshot_id: 'globalmed-ai-tools-v1',
          violation_count: 3,
          signature: `sha256:${Math.random().toString(36).substring(7)}`
        },
        response_time_ms: 180 + Math.floor(Math.random() * 100),
        estimated_cost_usd: 0.002,
        created_at: timestamp.toISOString(),
        metadata: {
          is_sample: true,
          scenario: 'globalmed_oncavex_persado',
          violation_type: 'brand_override_audience'
        }
      });
    }

    // Generate 413 clean requests (no Persado)
    for (let i = 0; i < 413; i++) {
      const timestamp = new Date(ninetyDaysAgo + Math.random() * (now - ninetyDaysAgo));
      const partner = i % 2 === 0 ? 'ipg_health' : 'omnicom_health';
      
      requests.push({
        enterprise_id: enterpriseId,
        partner_id: partnerIds[partner],
        model: 'native-email-system',
        endpoint: '/v1/email/send',
        policy_decision: 'allow',
        policy_evaluation: {
          checks_run: 5,
          checks_passed: 5,
          failed_requirements: []
        },
        context_analysis: {
          brand: 'ONCAVEX™',
          audience: 'HCP',
          channel: 'email',
          content_type: 'standard_email',
          campaign_id: `ONCAVEX-HCP-CLEAN-${i + 1}`
        },
        proof_bundle: {
          bundle_id: `pb-oncavex-clean-${String(i + 1).padStart(3, '0')}`,
          claim: 'policy_compliance',
          policy_snapshot_id: 'globalmed-ai-tools-v1',
          checks_passed: 5,
          signature: `sha256:${Math.random().toString(36).substring(7)}`
        },
        response_time_ms: 120 + Math.floor(Math.random() * 80),
        estimated_cost_usd: 0.0,
        created_at: timestamp.toISOString(),
        metadata: {
          is_sample: true,
          scenario: 'globalmed_oncavex_clean'
        }
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < requests.length; i += 100) {
      const batch = requests.slice(i, i + 100);
      const { error } = await supabase
        .from('middleware_requests')
        .insert(batch);

      if (error) {
        console.error('[GlobalMed] Error inserting batch:', error);
        throw error;
      }
    }

    console.log('[GlobalMed] Middleware data seeded: 430 requests (17 violations, 413 clean)');
  } catch (error) {
    console.error('[GlobalMed] Error seeding middleware data:', error);
    toast.error('Failed to seed GlobalMed middleware data');
    throw error;
  }
}

export async function seedGlobalMedInboxTask(
  enterpriseId: string,
  workspaceId: string
) {
  console.log('[GlobalMed] Creating inbox task...');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Store in agent_activities as a task notification
    const { error } = await supabase
      .from('agent_activities')
      .insert({
        agent: 'PolicyAgent',
        action: 'policy_violation_detected',
        status: 'pending_review',
        severity: 'high',
        enterprise_id: enterpriseId,
        workspace_id: workspaceId,
        details: {
          thread_id: 'globalmed-oncavex-persado-violation',
          title: 'ONCAVEX – Persado used on HCP emails',
          summary: 'Brand override violation: 17 HCP emails optimized with Persado despite ONCAVEX block.',
          policy_id: 'globalmed-ai-tools-v1',
          brand: 'ONCAVEX™',
          tool: 'Persado',
          violation_count: 17,
          metadata_badges: [
            { icon: '🏢', label: 'GlobalMed' },
            { icon: '💊', label: 'ONCAVEX™' },
            { icon: '🤖', label: 'Persado' },
            { icon: '👨‍⚕️', label: 'HCP' },
            { icon: '📧', label: 'Email' }
          ],
          is_sample: true,
          scenario: 'globalmed_oncavex_persado'
        }
      });

    if (error) throw error;
    console.log('[GlobalMed] Inbox task created');
  } catch (error) {
    console.error('[GlobalMed] Error creating inbox task:', error);
    throw error;
  }
}

/**
 * Seed simulation run for Weave
 */
export async function seedGlobalMedSimulation(
  enterpriseId: string,
  workspaceId: string
) {
  console.log('[GlobalMed] Creating simulation run...');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('sandbox_runs')
      .insert({
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        run_by: user.id,
        scenario_name: 'ONCAVEX + Persado Historical Replay (90 days)',
        inputs_json: {
          policy_profile: 'GlobalMed – AI Tool Usage v1',
          brand: 'ONCAVEX™',
          tool: 'Persado',
          time_period: '90_days',
          requests_analyzed: 430
        },
        outputs_json: {
          compliance_score: 0,
          validation_result: 'fail',
          allowed: false,
          violations: [
            {
              code: 'BRAND_OVERRIDE_VIOLATION',
              message: 'ONCAVEX brand override explicitly disallows Persado for all audiences',
              severity: 'critical',
              affected_count: 17
            },
            {
              code: 'AUDIENCE_MISMATCH',
              message: 'Persado only allowed for patient/caregiver, not HCP',
              severity: 'high',
              affected_count: 17
            },
            {
              code: 'MISSING_MLR_REFERENCE',
              message: 'No MLR reference ID provided for AI-generated variants',
              severity: 'high',
              affected_count: 17
            }
          ],
          simulation_metrics: {
            total_requests: 430,
            persado_requests: 17,
            block_rate: 0.0395,
            decision_flips: 17,
            agencies_involved: ['IPG Health', 'Omnicom Health']
          }
        },
        status: 'completed',
        validation_result: 'blocked',
        compliance_score: 0,
        metadata: {
          is_sample: true,
          scenario_type: 'globalmed_oncavex_persado'
        },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      });

    if (error) throw error;
    console.log('[GlobalMed] Simulation run created');
  } catch (error) {
    console.error('[GlobalMed] Error creating simulation:', error);
    throw error;
  }
}

/**
 * Seed agent decision for Decisions tab
 */
export async function seedGlobalMedDecision(enterpriseId: string) {
  console.log('[GlobalMed] Creating agent decision...');

  try {
    const { error } = await supabase
      .from('ai_agent_decisions')
      .insert({
        agent: 'PolicyAgent',
        action: 'evaluate_tool_usage',
        outcome: 'blocked',
        risk: 'high',
        enterprise_id: enterpriseId,
        agency: 'IPG Health',
        risk_profile_tier: 'tier_1',
        dimension_scores: {
          policy_compliance: 0,
          brand_alignment: 0,
          regulatory_risk: 95,
          audit_readiness: 40
        },
        audit_checklist: {
          checks: [
            { id: 'audience_restriction', passed: false },
            { id: 'brand_override', passed: false },
            { id: 'mlr_reference', passed: false }
          ]
        },
        details: {
          thread_id: 'globalmed-oncavex-persado-violation',
          policy_snapshot_id: 'EPS-131',
          tool_name: 'Persado Motivation AI',
          brand: 'ONCAVEX™',
          audience: 'HCP',
          violations: 17,
          metadata: {
            is_sample: true,
            scenario: 'globalmed_oncavex_persado'
          }
        },
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
      });

    if (error) throw error;
    console.log('[GlobalMed] Agent decision created');
  } catch (error) {
    console.error('[GlobalMed] Error creating decision:', error);
    throw error;
  }
}
