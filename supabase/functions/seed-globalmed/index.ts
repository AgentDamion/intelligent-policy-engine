import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Verify service-role key is available
    if (!supabaseServiceKey || supabaseServiceKey === 'undefined') {
      console.error('[seed-globalmed] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Service role key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[seed-globalmed] Service role key verified (length:', supabaseServiceKey.length, ')');

    // Create service-role client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const { user_id } = await req.json().catch(() => ({}));

    console.log('[seed-globalmed] Starting GlobalMed ONCAVEX-Persado scenario seeding...');

    let enterpriseId: string;
    let workspaceIds: Record<string, string>;
    let partnerIds: Record<string, string>;

    // Phase 1: Foundation (Enterprise, Workspaces, Members)
    console.log('[seed-globalmed] Phase 1: Foundation - starting');
    console.time('[seed-globalmed] Phase 1 duration');
    try {
      const foundationResult = await seedFoundation(supabaseAdmin, user_id);
      enterpriseId = foundationResult.enterpriseId;
      workspaceIds = foundationResult.workspaceIds;
      partnerIds = foundationResult.partnerIds;
      console.timeEnd('[seed-globalmed] Phase 1 duration');
      console.log('[seed-globalmed] Phase 1: Foundation - completed', {
        enterpriseId,
        workspaceIds,
        partnerIds,
      });
    } catch (phaseError) {
      console.timeEnd('[seed-globalmed] Phase 1 duration');
      console.error('[seed-globalmed] Phase 1: Foundation - FAILED', phaseError);
      throw phaseError;
    }

    // Phase 2: AI Tools
    console.log('[seed-globalmed] Phase 2: AI Tools - starting');
    console.time('[seed-globalmed] Phase 2 duration');
    try {
      await seedAITools(supabaseAdmin);
      console.timeEnd('[seed-globalmed] Phase 2 duration');
      console.log('[seed-globalmed] Phase 2: AI Tools - completed');
    } catch (phaseError) {
      console.timeEnd('[seed-globalmed] Phase 2 duration');
      console.error('[seed-globalmed] Phase 2: AI Tools - FAILED', phaseError);
      throw phaseError;
    }

    // Phase 3: Middleware Requests
    console.log('[seed-globalmed] Phase 3: Middleware Requests - starting');
    console.time('[seed-globalmed] Phase 3 duration');
    try {
      await seedMiddlewareRequests(supabaseAdmin, enterpriseId, partnerIds, workspaceIds);
      console.timeEnd('[seed-globalmed] Phase 3 duration');
      console.log('[seed-globalmed] Phase 3: Middleware Requests - completed');
    } catch (phaseError) {
      console.timeEnd('[seed-globalmed] Phase 3 duration');
      console.error('[seed-globalmed] Phase 3: Middleware Requests - FAILED', phaseError);
      throw phaseError;
    }

    // Phase 4: Inbox Task
    console.log('[seed-globalmed] Phase 4: Inbox Task - starting');
    console.time('[seed-globalmed] Phase 4 duration');
    try {
      await seedInboxTask(supabaseAdmin, enterpriseId, workspaceIds.oncavex, user_id);
      console.timeEnd('[seed-globalmed] Phase 4 duration');
      console.log('[seed-globalmed] Phase 4: Inbox Task - completed');
    } catch (phaseError) {
      console.timeEnd('[seed-globalmed] Phase 4 duration');
      console.error('[seed-globalmed] Phase 4: Inbox Task - FAILED', phaseError);
      throw phaseError;
    }

    // Phase 5: Simulation Run
    console.log('[seed-globalmed] Phase 5: Simulation - starting');
    console.time('[seed-globalmed] Phase 5 duration');
    try {
      await seedSimulation(supabaseAdmin, enterpriseId, workspaceIds.oncavex, user_id);
      console.timeEnd('[seed-globalmed] Phase 5 duration');
      console.log('[seed-globalmed] Phase 5: Simulation - completed');
    } catch (phaseError) {
      console.timeEnd('[seed-globalmed] Phase 5 duration');
      console.error('[seed-globalmed] Phase 5: Simulation - FAILED', phaseError);
      throw phaseError;
    }

    // Phase 6: Agent Decision
    console.log('[seed-globalmed] Phase 6: Agent Decision - starting');
    console.time('[seed-globalmed] Phase 6 duration');
    try {
      await seedDecision(supabaseAdmin, enterpriseId);
      console.timeEnd('[seed-globalmed] Phase 6 duration');
      console.log('[seed-globalmed] Phase 6: Agent Decision - completed');
    } catch (phaseError) {
      console.timeEnd('[seed-globalmed] Phase 6 duration');
      console.error('[seed-globalmed] Phase 6: Agent Decision - FAILED', phaseError);
      throw phaseError;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[seed-globalmed] ✅ Complete in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        enterpriseId,
        workspaceIds,
        partnerIds,
        stats: {
          enterprises: 1,
          workspaces: 3,
          partners: 2,
          tools: 5,
          policies: 2,
          middlewareRequests: 430,
          violations: 17,
          inboxTasks: 1,
          simulations: 1,
          decisions: 1,
        },
        duration: parseFloat(duration),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[seed-globalmed] Error:', error);
    
    // Extract error message from various error formats
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Handle PostgreSQL errors
      if ('message' in error) {
        errorMessage = String(error.message);
      } else if ('error' in error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = JSON.stringify(error);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: typeof error === 'object' ? error : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// PHASE 1: FOUNDATION
// ============================================================================

async function seedFoundation(supabase: any, userId?: string) {
  // Check if GlobalMed already exists
  const { data: existingEnterprise, error: checkError } = await supabase
    .from('enterprises')
    .select('id')
    .eq('name', 'GlobalMed Therapeutics')
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingEnterprise) {
    console.log('[seed-globalmed] Foundation already exists, fetching IDs...');
    const workspaceIds = await getWorkspaceIds(supabase, existingEnterprise.id);
    const partnerIds = getPartnerIds();
    return { enterpriseId: existingEnterprise.id, workspaceIds, partnerIds };
  }

  // Create enterprise
  const { data: enterprise, error: enterpriseError } = await supabase
    .from('enterprises')
    .insert({
      name: 'GlobalMed Therapeutics',
      subscription_tier: 'enterprise',
      enterprise_type: 'pharmaceutical',
      domain: 'globalmed.com',
    })
    .select()
    .single();

  if (enterpriseError) throw enterpriseError;

  // Add user as enterprise member if userId provided
  if (userId) {
    const { error: memberError } = await supabase
      .from('enterprise_members')
      .insert({
        enterprise_id: enterprise.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) throw memberError;
  }

  // Create workspaces
  const workspaceData = [
    {
      enterprise_name: 'GlobalMed Therapeutics',
      enterprise_id: enterprise.id,
      name: 'ONCAVEX™',
      policy_scope: 'brand',
      workspace_type: 'oncology',
    },
    {
      enterprise_name: 'GlobalMed Therapeutics',
      enterprise_id: enterprise.id,
      name: 'HEARTGUARD®',
      policy_scope: 'brand',
      workspace_type: 'cardiology',
    },
    {
      enterprise_name: 'GlobalMed Therapeutics',
      enterprise_id: enterprise.id,
      name: 'GLUCOSTABLE®',
      policy_scope: 'brand',
      workspace_type: 'diabetes',
    },
  ];

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .insert(workspaceData)
    .select();

  if (workspaceError) throw workspaceError;

  // Add user as workspace admin if userId provided
  if (userId) {
    const memberData = workspaces.map((ws: any) => ({
      workspace_id: ws.id,
      user_id: userId,
      role: 'admin',
    }));

    const { error: wsMemberError } = await supabase
      .from('workspace_members')
      .insert(memberData);

    if (wsMemberError) throw wsMemberError;
  }

  const workspaceIds = {
    oncavex: workspaces.find((ws: any) => ws.name === 'ONCAVEX™')?.id,
    heartguard: workspaces.find((ws: any) => ws.name === 'HEARTGUARD®')?.id,
    glucostable: workspaces.find((ws: any) => ws.name === 'GLUCOSTABLE®')?.id,
  };

  const partnerIds = getPartnerIds();

  console.log('[seed-globalmed] Foundation created:', {
    enterpriseId: enterprise.id,
    workspaceCount: workspaces.length,
  });

  return { enterpriseId: enterprise.id, workspaceIds, partnerIds };
}

async function getWorkspaceIds(supabase: any, enterpriseId: string) {
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('enterprise_id', enterpriseId);

  return {
    oncavex: workspaces?.find((ws: any) => ws.name === 'ONCAVEX™')?.id,
    heartguard: workspaces?.find((ws: any) => ws.name === 'HEARTGUARD®')?.id,
    glucostable: workspaces?.find((ws: any) => ws.name === 'GLUCOSTABLE®')?.id,
  };
}

function getPartnerIds() {
  return {
    ipg_health: 'partner-ipg-health-sim-uuid',
    omnicom_health: 'partner-omnicom-health-sim-uuid',
  };
}

// ============================================================================
// PHASE 2: AI TOOLS
// ============================================================================

async function seedAITools(supabase: any) {
  const tools = [
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Persado Motivation AI',
      provider: 'Persado',
      category: 'text_gen',
      risk_tier: 'MEDIUM',
      deployment_status: 'approved',
      jurisdictions: ['GDPR', 'HIPAA'],
      data_sensitivity_used: ['PII'],
      description: 'AI language optimization for patient/caregiver communications',
    },
    {
      id: '89898989-8989-8989-8989-898989898989',
      name: 'AuroraPrime Analytics',
      provider: 'AuroraHealth',
      category: 'analytics',
      risk_tier: 'LOW',
      deployment_status: 'approved',
      jurisdictions: ['HIPAA'],
      data_sensitivity_used: ['PHI'],
      description: 'Patient data analytics engine',
    },
    {
      id: '90909090-9090-9090-9090-909090909090',
      name: 'SmartFigures Designer',
      provider: 'MedViz',
      category: 'data_viz',
      risk_tier: 'LOW',
      deployment_status: 'approved',
      jurisdictions: [],
      data_sensitivity_used: [],
      description: 'Medical publication figure generation',
    },
    {
      id: '91919191-9191-9191-9191-919191919191',
      name: 'Viseven Studio',
      provider: 'Viseven',
      category: 'creative',
      risk_tier: 'LOW',
      deployment_status: 'approved',
      jurisdictions: [],
      data_sensitivity_used: [],
      description: 'Interactive pharma content creation',
    },
    {
      id: '92929292-9292-9292-9292-929292929292',
      name: 'BastionGPT',
      provider: 'Bastion',
      category: 'llm',
      risk_tier: 'MEDIUM',
      deployment_status: 'approved',
      jurisdictions: ['HIPAA', 'GDPR'],
      data_sensitivity_used: ['PHI', 'PII'],
      description: 'HIPAA-compliant medical writing assistant',
    },
  ];

  for (const tool of tools) {
    await supabase
      .from('ai_tool_registry')
      .upsert(tool, { onConflict: 'id' });
  }

  console.log('[seed-globalmed] AI tools seeded:', tools.length);
}

// ============================================================================
// PHASE 3: MIDDLEWARE REQUESTS
// ============================================================================

async function seedMiddlewareRequests(
  supabase: any,
  enterpriseId: string,
  partnerIds: Record<string, string>,
  workspaceIds: Record<string, string>
) {
  // Check if data already exists
  const { data: existing } = await supabase
    .from('middleware_requests')
    .select('id')
    .eq('enterprise_id', enterpriseId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('[seed-globalmed] Middleware requests already exist, skipping...');
    return;
  }

  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  const requests = [];

  // 17 Persado violations
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
          'oncavex.persado.brand_disallowed',
        ],
      },
      context_analysis: {
        brand: 'ONCAVEX™',
        audience: 'HCP',
        channel: 'email',
        content_type: 'subject_line',
        campaign_id: `ONCAVEX-HCP-${i + 1}`,
      },
      proof_bundle: {
        bundle_id: `pb-oncavex-pers-${String(i + 1).padStart(3, '0')}`,
        claim: 'policy_violation',
        tool_declaration_hash: `sha256:${Math.random().toString(36).substring(7)}`,
        tools_declared: ['persado-v2024.3'],
        policy_snapshot_id: 'globalmed-ai-tools-v1',
        violation_count: 3,
        signature: `sha256:${Math.random().toString(36).substring(7)}`,
      },
      response_time_ms: 180 + Math.floor(Math.random() * 100),
      estimated_cost_usd: 0.002,
      created_at: timestamp.toISOString(),
      metadata: {
        is_sample: true,
        scenario: 'globalmed_oncavex_persado',
        violation_type: 'brand_override_audience',
      },
    });
  }

  // 413 clean requests
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
        failed_requirements: [],
      },
      context_analysis: {
        brand: 'ONCAVEX™',
        audience: 'HCP',
        channel: 'email',
        content_type: 'standard_email',
        campaign_id: `ONCAVEX-HCP-CLEAN-${i + 1}`,
      },
      proof_bundle: {
        bundle_id: `pb-oncavex-clean-${String(i + 1).padStart(3, '0')}`,
        claim: 'policy_compliance',
        policy_snapshot_id: 'globalmed-ai-tools-v1',
        checks_passed: 5,
        signature: `sha256:${Math.random().toString(36).substring(7)}`,
      },
      response_time_ms: 120 + Math.floor(Math.random() * 80),
      estimated_cost_usd: 0.0,
      created_at: timestamp.toISOString(),
      metadata: {
        is_sample: true,
        scenario: 'globalmed_oncavex_clean',
      },
    });
  }

  // Insert in batches
  for (let i = 0; i < requests.length; i += 100) {
    const batch = requests.slice(i, i + 100);
    const { error } = await supabase.from('middleware_requests').insert(batch);
    if (error) throw error;
  }

  console.log('[seed-globalmed] Middleware requests seeded:', requests.length);
}

// ============================================================================
// PHASE 4: INBOX TASK
// ============================================================================

async function seedInboxTask(
  supabase: any,
  enterpriseId: string,
  workspaceId: string,
  userId?: string
) {
  const { error } = await supabase.from('agent_activities').insert({
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
        { icon: '📧', label: 'Email' },
      ],
      is_sample: true,
      scenario: 'globalmed_oncavex_persado',
    },
  });

  if (error) throw error;
  console.log('[seed-globalmed] Inbox task created');
}

// ============================================================================
// PHASE 5: SIMULATION
// ============================================================================

async function seedSimulation(
  supabase: any,
  enterpriseId: string,
  workspaceId: string,
  userId?: string
) {
  const { error } = await supabase.from('sandbox_runs').insert({
    workspace_id: workspaceId,
    enterprise_id: enterpriseId,
    run_by: userId,
    scenario_name: 'ONCAVEX + Persado Historical Replay (90 days)',
    inputs_json: {
      policy_profile: 'GlobalMed – AI Tool Usage v1',
      brand: 'ONCAVEX™',
      tool: 'Persado',
      time_period: '90_days',
      requests_analyzed: 430,
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
          affected_count: 17,
        },
        {
          code: 'AUDIENCE_MISMATCH',
          message: 'Persado only allowed for patient/caregiver, not HCP',
          severity: 'high',
          affected_count: 17,
        },
        {
          code: 'MISSING_MLR_REFERENCE',
          message: 'No MLR reference ID provided for AI-generated variants',
          severity: 'high',
          affected_count: 17,
        },
      ],
      simulation_metrics: {
        total_requests: 430,
        persado_requests: 17,
        block_rate: 0.0395,
        decision_flips: 17,
        agencies_involved: ['IPG Health', 'Omnicom Health'],
      },
    },
    status: 'completed',
    validation_result: 'blocked',
    compliance_score: 0,
    metadata: {
      is_sample: true,
      scenario_type: 'globalmed_oncavex_persado',
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  });

  if (error) throw error;
  console.log('[seed-globalmed] Simulation created');
}

// ============================================================================
// PHASE 6: AGENT DECISION
// ============================================================================

async function seedDecision(supabase: any, enterpriseId: string) {
  const { error } = await supabase.from('ai_agent_decisions').insert({
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
      audit_readiness: 40,
    },
    audit_checklist: {
      checks: [
        { id: 'audience_restriction', passed: false },
        { id: 'brand_override', passed: false },
        { id: 'mlr_reference', passed: false },
      ],
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
        scenario: 'globalmed_oncavex_persado',
      },
    },
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  });

  if (error) throw error;
  console.log('[seed-globalmed] Agent decision created');
}
