import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import semver from "https://esm.sh/semver@7.6.0";
import { corsHeaders, respond, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient, getUserId } from "../_shared/db.ts";

// Zod Schemas
const DecisionStatus = z.enum(["Approved", "Prohibited", "RequiresReview"]);
const Tool = z.object({ id: z.string(), name: z.string(), version: z.string() });
const Actor = z.object({ role: z.string() });
const Context = z.object({ tenantId: z.string(), policySnapshotId: z.string() });
const ActionType = z.enum(["Research", "Drafting", "InternalConcept", "FinalAssetGeneration", "Other"]);

const ToolUsageEvent = z.object({
  tool: Tool,
  actor: Actor,
  action: z.object({ type: ActionType, note: z.string().optional() }),
  context: Context,
  ts: z.string(),
});

const ConditionClause = z.object({
  field: z.string(),
  operator: z.enum(["equals","not_equals","in","not_in","semver_less_than","semver_greater_than","semver_satisfies"]),
  value: z.any(),
});

const ConditionTree: z.ZodType<any> = z.object({
  operator: z.enum(["AND","OR"]),
  clauses: z.array(z.lazy(() => z.union([ConditionClause, ConditionTree]))),
});

const PolicyRule = z.object({
  rule_id: z.string(),
  priority: z.number().int(),
  is_active: z.boolean(),
  context_id: z.string(),
  conditions: ConditionTree,
  decision: z.object({ status: DecisionStatus, reason: z.string() }),
});

const Verdict = z.object({
  status: DecisionStatus,
  reason: z.string(),
  rule_id: z.string().optional(),
  policySnapshotId: z.string().optional(),
});

const ApiSchema = z.object({
  event: ToolUsageEvent,
  rules: z.array(PolicyRule),
});

// Helper to get nested field values
function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

// Evaluate a single condition clause
function evalClause(event: z.infer<typeof ToolUsageEvent>, clause: any): boolean {
  // Handle nested condition tree
  if ("operator" in clause && "clauses" in clause && Array.isArray(clause.clauses)) {
    const op = clause.operator;
    const results = clause.clauses.map((c: any) => evalClause(event, c));
    return op === "AND" ? results.every(Boolean) : results.some(Boolean);
  }

  // Handle leaf condition
  const fieldVal = get(event, clause.field);
  const { operator, value } = clause;

  switch (operator) {
    case "equals":
      return fieldVal === value;
    case "not_equals":
      return fieldVal !== value;
    case "in":
      return Array.isArray(value) && value.includes(fieldVal);
    case "not_in":
      return Array.isArray(value) && !value.includes(fieldVal);
    case "semver_less_than":
      return semver.valid(fieldVal) && semver.valid(value) ? semver.lt(fieldVal, value) : false;
    case "semver_greater_than":
      return semver.valid(fieldVal) && semver.valid(value) ? semver.gt(fieldVal, value) : false;
    case "semver_satisfies":
      return semver.valid(fieldVal) && typeof value === "string" ? semver.satisfies(fieldVal, value) : false;
    default:
      return false;
  }
}

// Core evaluation logic
function evaluate(
  event: z.infer<typeof ToolUsageEvent>,
  rules: z.infer<typeof PolicyRule>[]
): z.infer<typeof Verdict> {
  const active = rules.filter(r => r.is_active).sort((a, b) => a.priority - b.priority);

  for (const rule of active) {
    if (evalClause(event, rule.conditions)) {
      return {
        status: rule.decision.status,
        reason: rule.decision.reason,
        rule_id: rule.rule_id,
        policySnapshotId: event.context.policySnapshotId,
      };
    }
  }

  return {
    status: "RequiresReview" as const,
    reason: "No matching rule; defaulting to human review",
    policySnapshotId: event.context.policySnapshotId,
  };
}

serve(async (req) => {
  if (handleCors(req)) return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabaseClient(req);
    const userId = getUserId(req);

    if (!userId) {
      return respond({ error: 'Authentication required' }, 401);
    }

    const body = await req.json();
    const { event, rules } = ApiSchema.parse(body);

    // Evaluate policy
    const verdict = evaluate(event, rules);

    // Log raw event to tool_usage_events for telemetry
    await supabase.from('tool_usage_events').insert({
      tenant_id: userId,
      body: event,
    });

    // Log evaluation to agent_activities
    await supabase.from('agent_activities').insert({
      agent: 'policy-engine',
      action: 'evaluate',
      details: {
        event,
        verdict,
        rules_evaluated: rules.length,
        user_id: userId
      }
    });

    console.log('Policy evaluation completed:', {
      status: verdict.status,
      rule_id: verdict.rule_id,
      tool: event.tool.name
    });

    return respond(verdict, 200);

  } catch (error) {
    console.error("Policy Evaluation Error:", error);

    if (error instanceof z.ZodError) {
      return respond({
        error: 'Invalid input schema',
        details: error.issues
      }, 400);
    }

    return respond({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
