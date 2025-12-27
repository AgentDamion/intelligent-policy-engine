import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, respond, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient, getUserId } from "../_shared/db.ts";

// Type definitions
const ViolationSchema = z.object({
  rule_id: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  field: z.string().optional(),
});

const VerdictSchema = z.object({
  allowed: z.boolean(),
  violations: z.array(ViolationSchema),
  warnings: z.array(ViolationSchema),
  confidence: z.number(),
  evaluated_at: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ToolUsageEventSchema = z.object({
  tool_id: z.string().uuid(),
  tool_version: z.string(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  timestamp: z.string(),
  usage_context: z.object({
    use_case: z.string().optional(),
    jurisdiction: z.array(z.string()).optional(),
    data_classification: z.array(z.string()).optional(),
    therapeutic_area: z.string().optional(),
    intended_use: z.string().optional(),
    output_type: z.string().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const CompileRequestSchema = z.object({
  event: ToolUsageEventSchema,
  verdict: VerdictSchema,
  extra: z.record(z.string(), z.string()).optional(),
});

type ToolUsageEvent = z.infer<typeof ToolUsageEventSchema>;
type Verdict = z.infer<typeof VerdictSchema>;

interface EvidenceItem {
  type: 'policy_rule' | 'validation_result' | 'usage_context' | 'approval_record' | 'audit_trail' | 'metadata';
  source: string;
  timestamp: string;
  data: any;
  hash?: string;
}

interface RationaleStructured {
  policy_id: string;
  policy_version: string;
  rule_matched: string;
  inputs: {
    tool: string;
    tool_version?: string;
    dataset_class: string;
    request_type: string;
  };
  actor: {
    type: 'human' | 'automated' | 'hybrid';
    name?: string;
    id?: string;
    role?: string;
  };
  confidence_score?: number;
  secondary_rules?: string[];
  timestamp: string;
}

interface Justification {
  human_readable: string;
  structured: RationaleStructured;
}

interface ProofBundle {
  bundle_id: string;
  tool_id: string;
  tool_version: string;
  workspace_id: string;
  verdict: {
    allowed: boolean;
    confidence: number;
  };
  // NEW: Justification for audit compliance
  justification?: Justification;
  evidence: EvidenceItem[];
  metadata: {
    created_at: string;
    created_by?: string;
    policy_version?: string;
    compliance_status: 'compliant' | 'non_compliant' | 'requires_review';
    chain_of_custody: string[];
  };
  signatures?: {
    evidence_hash: string;
    timestamp: string;
  };
}

// Compile proof bundle from event and verdict
async function compileProofBundle(
  event: ToolUsageEvent,
  verdict: Verdict,
  extra: Record<string, string> = {},
  supabaseClient: any,
  userId: string
): Promise<ProofBundle> {
  const bundle_id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`Compiling proof bundle ${bundle_id} for tool ${event.tool_id}`);
  
  const evidence: EvidenceItem[] = [];
  
  // 1. Add usage context as evidence
  evidence.push({
    type: 'usage_context',
    source: 'tool_usage_event',
    timestamp: event.timestamp,
    data: {
      tool_id: event.tool_id,
      tool_version: event.tool_version,
      workspace_id: event.workspace_id,
      usage_context: event.usage_context,
    },
  });
  
  // 2. Add validation result as evidence
  evidence.push({
    type: 'validation_result',
    source: 'policy_evaluate',
    timestamp: verdict.evaluated_at,
    data: {
      allowed: verdict.allowed,
      violations: verdict.violations,
      warnings: verdict.warnings,
      confidence: verdict.confidence,
    },
  });
  
  // 3. Fetch policy rules that were applied
  try {
    const { data: policyBindings } = await supabaseClient
      .from('runtime_bindings')
      .select(`
        id,
        effective_pom,
        policy_instances!inner(
          id,
          policy_template_id,
          version,
          status
        )
      `)
      .eq('tool_version_id', event.tool_id)
      .eq('workspace_id', event.workspace_id)
      .eq('status', 'active')
      .limit(5);
    
    if (policyBindings && policyBindings.length > 0) {
      evidence.push({
        type: 'policy_rule',
        source: 'runtime_bindings',
        timestamp: timestamp,
        data: {
          active_policies: policyBindings.map(pb => ({
            binding_id: pb.id,
            policy_instance_id: pb.policy_instances.id,
            policy_version: pb.policy_instances.version,
            status: pb.policy_instances.status,
            effective_pom: pb.effective_pom,
          })),
        },
      });
    }
  } catch (error) {
    console.error('Failed to fetch policy bindings:', error);
  }
  
  // 4. Fetch recent approval records
  try {
    const { data: approvals } = await supabaseClient
      .from('approval_workflows')
      .select('id, workflow_name, current_stage, status, created_at')
      .eq('workspace_id', event.workspace_id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (approvals && approvals.length > 0) {
      evidence.push({
        type: 'approval_record',
        source: 'approval_workflows',
        timestamp: timestamp,
        data: {
          recent_approvals: approvals,
        },
      });
    }
  } catch (error) {
    console.error('Failed to fetch approvals:', error);
  }
  
  // 5. Fetch audit trail events
  try {
    const { data: auditEvents } = await supabaseClient
      .from('audit_events')
      .select('id, event_type, entity_type, entity_id, created_at')
      .eq('workspace_id', event.workspace_id)
      .in('entity_type', ['ai_tool', 'policy', 'validation'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (auditEvents && auditEvents.length > 0) {
      evidence.push({
        type: 'audit_trail',
        source: 'audit_events',
        timestamp: timestamp,
        data: {
          recent_events: auditEvents,
        },
      });
    }
  } catch (error) {
    console.error('Failed to fetch audit events:', error);
  }
  
  // 6. Add extra metadata if provided
  if (Object.keys(extra).length > 0) {
    evidence.push({
      type: 'metadata',
      source: 'extra_context',
      timestamp: timestamp,
      data: extra,
    });
  }
  
  // Calculate evidence hash for integrity
  const evidenceHash = await calculateHash(JSON.stringify(evidence));
  
  // Determine compliance status
  const complianceStatus = verdict.allowed 
    ? 'compliant' 
    : verdict.violations.length > 0 
      ? 'non_compliant' 
      : 'requires_review';
  
  // Build justification for audit compliance
  const justification = buildJustification(event, verdict, complianceStatus, userId, timestamp);
  
  const bundle: ProofBundle = {
    bundle_id,
    tool_id: event.tool_id,
    tool_version: event.tool_version,
    workspace_id: event.workspace_id,
    verdict: {
      allowed: verdict.allowed,
      confidence: verdict.confidence,
    },
    // NEW: Justification for audit compliance
    justification,
    evidence,
    metadata: {
      created_at: timestamp,
      created_by: userId,
      compliance_status: complianceStatus,
      chain_of_custody: [
        `created:${userId}:${timestamp}`,
        `evaluated:policy_evaluate:${verdict.evaluated_at}`,
      ],
    },
    signatures: {
      evidence_hash: evidenceHash,
      timestamp: timestamp,
    },
  };
  
  // Store proof bundle in policy_evidence_bundles
  try {
    await supabaseClient.from('policy_evidence_bundles').insert({
      tenant_id: userId,
      policy_snapshot_id: event.usage_context?.intended_use || 'unknown',
      body: bundle,
    });
    
    console.log(`Policy evidence bundle ${bundle_id} stored successfully`);
  } catch (error) {
    console.error('Failed to store policy evidence bundle:', error);
  }
  
  return bundle;
}

/**
 * Build justification object for proof bundle
 * Includes human-readable (≤140 chars) and structured rationale
 */
function buildJustification(
  event: ToolUsageEvent,
  verdict: Verdict,
  complianceStatus: string,
  userId: string,
  timestamp: string
): Justification {
  // Decision verb based on verdict
  const decisionVerb = verdict.allowed 
    ? 'Allowed under'
    : verdict.violations.length > 0 
      ? 'Denied per'
      : 'Flagged per';
  
  // Build human-readable rationale
  const policyId = event.usage_context?.policy_id || 'tool-validation';
  const toolName = event.tool_id || 'unknown';
  const dataClass = event.usage_context?.data_class || 'internal';
  
  let humanReadable = `${decisionVerb} ${policyId}: tool=${toolName}, data=${dataClass}`;
  
  // Append actor info
  if (userId) {
    humanReadable += `, reviewer=${userId.slice(0, 8)}`;
  } else {
    humanReadable += ', auto-check';
  }
  
  // Enforce 140 char limit
  if (humanReadable.length > 140) {
    humanReadable = humanReadable.substring(0, 137) + '...';
  }
  
  // Build structured rationale
  const structured: RationaleStructured = {
    policy_id: policyId,
    policy_version: event.usage_context?.policy_version || 'v1.0',
    rule_matched: verdict.violations[0] || verdict.warnings[0] || 'tool_validation',
    inputs: {
      tool: event.tool_id,
      tool_version: event.tool_version,
      dataset_class: event.usage_context?.data_class || 'unclassified',
      request_type: event.usage_context?.intended_use || 'general'
    },
    actor: {
      type: userId ? 'human' : 'automated',
      id: userId || undefined,
      role: 'reviewer'
    },
    confidence_score: verdict.confidence,
    secondary_rules: [...verdict.violations, ...verdict.warnings],
    timestamp: timestamp
  };
  
  return {
    human_readable: humanReadable,
    structured
  };
}

async function calculateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (handleCors(req)) return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = getSupabaseClient(req);
    const userId = getUserId(req);

    if (!userId) {
      return respond({ error: 'Authentication required' }, 401);
    }

    const body = await req.json();
    console.log('Evidence compilation request:', {
      tool_id: body.event?.tool_id,
      verdict_allowed: body.verdict?.allowed,
    });

    const validated = CompileRequestSchema.parse(body);
    const bundle = await compileProofBundle(
      validated.event,
      validated.verdict,
      validated.extra || {},
      supabaseClient,
      userId
    );

    console.log(`Proof bundle compiled with ${bundle.evidence.length} evidence items`);

    return respond(bundle, 200);
  } catch (error) {
    console.error('Evidence compilation error:', error);

    if (error instanceof z.ZodError) {
      return respond({
        error: 'Validation failed',
        details: error.issues,
      }, 400);
    }

    return respond({
      error: error.message || 'Internal server error',
    }, 500);
  }
});
