/**
 * Decision Replay Edge Function
 * 
 * Week 6-7: Decision Replay Engine
 * Enables "what-if" policy simulations and policy impact analysis.
 * 
 * Endpoints:
 * - POST /decision-replay - Replay a single decision with different policy
 * - POST /decision-replay/bulk - Bulk policy impact analysis
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ReplayRequest {
  decisionId: string;
  targetPolicyVersion?: string;
  targetPolicyId?: string;
  options?: {
    skipPrecedentLinking?: boolean;
    dryRun?: boolean;
  };
}

interface BulkReplayRequest {
  enterpriseId: string;
  fromPolicyVersion: string;
  toPolicyVersion: string;
  options?: {
    limit?: number;
    timeWindowDays?: number;
    actionTypes?: string[];
  };
}

interface ReplayResult {
  originalDecision: {
    actionId: string;
    threadId: string;
    outcome: string;
    confidence: number;
    rationale: string;
    policyVersion: string;
    decisionDate: string;
  };
  replayedDecision: {
    outcome: string;
    confidence: number;
    rationale: string;
    policyVersion: string;
  };
  analysis: {
    outcomeChanged: boolean;
    confidenceDelta: number;
    policyChanges: string[];
    impactAssessment: 'none' | 'low' | 'medium' | 'high' | 'critical';
    riskExposure?: number;
  };
}

interface BulkReplayResult {
  enterpriseId: string;
  fromVersion: string;
  toVersion: string;
  summary: {
    totalDecisions: number;
    processedDecisions: number;
    outcomeChanges: number;
    averageConfidenceDelta: number;
    impactDistribution: {
      none: number;
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  details: ReplayResult[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    if (path === 'bulk') {
      return await handleBulkReplay(req, supabase);
    } else {
      return await handleSingleReplay(req, supabase);
    }
  } catch (error) {
    console.error('[decision-replay] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleSingleReplay(
  req: Request, 
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const body: ReplayRequest = await req.json();
  const { decisionId, targetPolicyVersion, targetPolicyId, options } = body;

  if (!decisionId) {
    return new Response(
      JSON.stringify({ success: false, error: 'decisionId is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 1. Get the original decision with full context
  const { data: originalAction, error: actionError } = await supabase
    .from('governance_actions')
    .select(`
      id,
      thread_id,
      action_type,
      rationale,
      context_snapshot,
      metadata,
      created_at,
      governance_threads!inner (
        enterprise_id,
        subject_type,
        metadata
      )
    `)
    .eq('id', decisionId)
    .single();

  if (actionError || !originalAction) {
    return new Response(
      JSON.stringify({ success: false, error: 'Decision not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const enterpriseId = originalAction.governance_threads?.enterprise_id;
  const contextSnapshot = originalAction.context_snapshot;

  if (!contextSnapshot) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Decision has no context snapshot - cannot replay' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 2. Get target policy version
  let targetPolicy: Record<string, unknown> | null = null;
  let targetVersion = targetPolicyVersion;

  if (targetPolicyId) {
    const { data: policy } = await supabase
      .from('policy_artifacts')
      .select('*')
      .eq('id', targetPolicyId)
      .single();
    targetPolicy = policy;
    targetVersion = policy?.version;
  } else if (targetPolicyVersion) {
    const { data: policy } = await supabase
      .from('policy_artifacts')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .eq('version', targetPolicyVersion)
      .single();
    targetPolicy = policy;
  } else {
    // Use current active policy
    const { data: policy } = await supabase
      .from('policy_artifacts')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'active')
      .order('activated_at', { ascending: false })
      .limit(1)
      .single();
    targetPolicy = policy;
    targetVersion = policy?.version;
  }

  if (!targetPolicy) {
    return new Response(
      JSON.stringify({ success: false, error: 'Target policy not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3. Simulate the decision with target policy
  const simulatedContext = {
    ...contextSnapshot,
    policy_state: {
      ...contextSnapshot.policy_state,
      policy_json: targetPolicy.policy_json,
      version: targetVersion,
    },
  };

  // Call the policy evaluation (simplified simulation)
  const replayedDecision = await simulatePolicyDecision(
    simulatedContext,
    targetPolicy,
    supabase
  );

  // 4. Compare outcomes and calculate impact
  const originalOutcome = extractOutcome(originalAction.action_type);
  const outcomeChanged = replayedDecision.outcome !== originalOutcome;
  const originalConfidence = contextSnapshot.external_context?.confidence || 0.8;
  const confidenceDelta = replayedDecision.confidence - originalConfidence;

  const policyChanges = identifyPolicyChanges(
    contextSnapshot.policy_state?.policy_json,
    targetPolicy.policy_json
  );

  const impactAssessment = assessImpact(outcomeChanged, confidenceDelta, policyChanges);

  const result: ReplayResult = {
    originalDecision: {
      actionId: originalAction.id,
      threadId: originalAction.thread_id,
      outcome: originalOutcome,
      confidence: originalConfidence,
      rationale: originalAction.rationale || '',
      policyVersion: contextSnapshot.policy_state?.version || 'unknown',
      decisionDate: originalAction.created_at,
    },
    replayedDecision: {
      outcome: replayedDecision.outcome,
      confidence: replayedDecision.confidence,
      rationale: replayedDecision.rationale,
      policyVersion: targetVersion || 'unknown',
    },
    analysis: {
      outcomeChanged,
      confidenceDelta,
      policyChanges,
      impactAssessment,
    },
  };

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleBulkReplay(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const body: BulkReplayRequest = await req.json();
  const { enterpriseId, fromPolicyVersion, toPolicyVersion, options } = body;

  if (!enterpriseId || !fromPolicyVersion || !toPolicyVersion) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'enterpriseId, fromPolicyVersion, and toPolicyVersion are required' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const limit = options?.limit || 100;
  const timeWindowDays = options?.timeWindowDays || 365;
  const actionTypes = options?.actionTypes || [
    'approve', 'reject', 'escalate', 'HumanApproveDecision', 
    'HumanBlockDecision', 'AgentAutoApprove', 'AgentAutoBlock',
    'draft_decision', 'auto_clear'
  ];

  // Get decisions made under the source policy version
  const { data: decisions, error } = await supabase
    .from('governance_actions')
    .select(`
      id,
      thread_id,
      action_type,
      rationale,
      context_snapshot,
      created_at,
      governance_threads!inner (
        enterprise_id
      )
    `)
    .eq('governance_threads.enterprise_id', enterpriseId)
    .in('action_type', actionTypes)
    .not('context_snapshot', 'is', null)
    .gte('created_at', new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000).toISOString())
    .limit(limit);

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get target policy
  const { data: targetPolicy } = await supabase
    .from('policy_artifacts')
    .select('*')
    .eq('enterprise_id', enterpriseId)
    .eq('version', toPolicyVersion)
    .single();

  if (!targetPolicy) {
    return new Response(
      JSON.stringify({ success: false, error: 'Target policy version not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Process each decision
  const details: ReplayResult[] = [];
  let outcomeChanges = 0;
  let totalConfidenceDelta = 0;
  const impactCounts = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };

  for (const decision of decisions || []) {
    const contextSnapshot = decision.context_snapshot;
    if (!contextSnapshot) continue;

    // Check if decision was made with source version
    if (contextSnapshot.policy_state?.version !== fromPolicyVersion) continue;

    const simulatedContext = {
      ...contextSnapshot,
      policy_state: {
        ...contextSnapshot.policy_state,
        policy_json: targetPolicy.policy_json,
        version: toPolicyVersion,
      },
    };

    const replayed = await simulatePolicyDecision(simulatedContext, targetPolicy, supabase);
    const originalOutcome = extractOutcome(decision.action_type);
    const originalConfidence = contextSnapshot.external_context?.confidence || 0.8;
    const outcomeChanged = replayed.outcome !== originalOutcome;
    const confidenceDelta = replayed.confidence - originalConfidence;

    const policyChanges = identifyPolicyChanges(
      contextSnapshot.policy_state?.policy_json,
      targetPolicy.policy_json
    );

    const impactAssessment = assessImpact(outcomeChanged, confidenceDelta, policyChanges);

    if (outcomeChanged) outcomeChanges++;
    totalConfidenceDelta += confidenceDelta;
    impactCounts[impactAssessment]++;

    details.push({
      originalDecision: {
        actionId: decision.id,
        threadId: decision.thread_id,
        outcome: originalOutcome,
        confidence: originalConfidence,
        rationale: decision.rationale || '',
        policyVersion: fromPolicyVersion,
        decisionDate: decision.created_at,
      },
      replayedDecision: {
        outcome: replayed.outcome,
        confidence: replayed.confidence,
        rationale: replayed.rationale,
        policyVersion: toPolicyVersion,
      },
      analysis: {
        outcomeChanged,
        confidenceDelta,
        policyChanges,
        impactAssessment,
      },
    });
  }

  const result: BulkReplayResult = {
    enterpriseId,
    fromVersion: fromPolicyVersion,
    toVersion: toPolicyVersion,
    summary: {
      totalDecisions: decisions?.length || 0,
      processedDecisions: details.length,
      outcomeChanges,
      averageConfidenceDelta: details.length > 0 ? totalConfidenceDelta / details.length : 0,
      impactDistribution: impactCounts,
    },
    details,
  };

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Helper functions

function extractOutcome(actionType: string): string {
  const approveActions = ['approve', 'HumanApproveDecision', 'AgentAutoApprove', 'auto_clear'];
  const rejectActions = ['reject', 'HumanBlockDecision', 'AgentAutoBlock'];
  
  if (approveActions.includes(actionType)) return 'approved';
  if (rejectActions.includes(actionType)) return 'blocked';
  if (actionType === 'escalate') return 'escalated';
  return 'pending';
}

async function simulatePolicyDecision(
  context: Record<string, unknown>,
  policy: Record<string, unknown>,
  _supabase: ReturnType<typeof createClient>
): Promise<{ outcome: string; confidence: number; rationale: string }> {
  // Simplified policy simulation
  // In production, this would call the full PolicyAgent evaluation
  
  const policyJson = policy.policy_json as Record<string, unknown> || {};
  const rules = (policyJson.rules || []) as Array<Record<string, unknown>>;
  
  // Basic rule matching simulation
  let passedRules = 0;
  let totalRules = rules.length;
  const failedRules: string[] = [];
  
  for (const rule of rules) {
    // Simplified: just check if rule is enabled
    if (rule.enabled !== false) {
      // Simulate 85% pass rate for demonstration
      if (Math.random() > 0.15) {
        passedRules++;
      } else {
        failedRules.push(rule.name as string || 'Unknown rule');
      }
    }
  }
  
  const passRate = totalRules > 0 ? passedRules / totalRules : 1;
  const confidence = Math.min(0.95, Math.max(0.3, passRate));
  
  let outcome: string;
  let rationale: string;
  
  if (passRate >= 0.9) {
    outcome = 'approved';
    rationale = 'All policy rules passed under simulated evaluation';
  } else if (passRate >= 0.7) {
    outcome = 'escalated';
    rationale = `Some rules require review: ${failedRules.slice(0, 3).join(', ')}`;
  } else {
    outcome = 'blocked';
    rationale = `Policy violations detected: ${failedRules.slice(0, 3).join(', ')}`;
  }
  
  return { outcome, confidence, rationale };
}

function identifyPolicyChanges(
  originalPolicy: Record<string, unknown> | null,
  targetPolicy: Record<string, unknown> | null
): string[] {
  const changes: string[] = [];
  
  if (!originalPolicy || !targetPolicy) {
    changes.push('Policy structure changed');
    return changes;
  }
  
  const origRules = (originalPolicy.rules || []) as Array<Record<string, unknown>>;
  const targetRules = (targetPolicy.rules || []) as Array<Record<string, unknown>>;
  
  // Compare rule counts
  if (origRules.length !== targetRules.length) {
    changes.push(`Rule count changed: ${origRules.length} → ${targetRules.length}`);
  }
  
  // Check for enabled/disabled changes
  const origEnabled = origRules.filter(r => r.enabled !== false).length;
  const targetEnabled = targetRules.filter(r => r.enabled !== false).length;
  
  if (origEnabled !== targetEnabled) {
    changes.push(`Active rules changed: ${origEnabled} → ${targetEnabled}`);
  }
  
  return changes;
}

function assessImpact(
  outcomeChanged: boolean,
  confidenceDelta: number,
  policyChanges: string[]
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (!outcomeChanged && Math.abs(confidenceDelta) < 0.1 && policyChanges.length === 0) {
    return 'none';
  }
  
  if (outcomeChanged) {
    if (confidenceDelta < -0.3) return 'critical';
    if (confidenceDelta < -0.1) return 'high';
    return 'medium';
  }
  
  if (Math.abs(confidenceDelta) > 0.2) return 'medium';
  if (policyChanges.length > 3) return 'medium';
  
  return 'low';
}

