import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, respond, handleCors } from "../_shared/cors.ts";
import { getSupabaseClient, getUserId } from "../_shared/db.ts";

// Zod Schemas aligned with policy-evaluate
const DecisionStatus = z.enum(["Approved", "Prohibited", "RequiresReview"]);
const ConditionClause = z.object({
  field: z.string(),
  operator: z.any(),
  value: z.any()
});
const ConditionTree: z.ZodType<any> = z.object({
  operator: z.enum(["AND", "OR"]),
  clauses: z.array(z.lazy(() => z.union([ConditionClause, ConditionTree]))),
});

const PolicyRule = z.object({
  rule_id: z.string(),
  name: z.string(),
  priority: z.number().int(),
  is_active: z.boolean(),
  context_id: z.string(),
  conditions: ConditionTree,
  decision: z.object({
    status: DecisionStatus,
    reason: z.string(),
    audit_trigger: z.boolean().optional()
  }),
});

const CreateRuleSchema = z.object({
  context_id: z.string(),
  priority: z.number().int(),
  rule: PolicyRule,
});

const UpdateRuleSchema = z.object({
  id: z.string(),
  rule: PolicyRule.partial(),
});

const GetRulesSchema = z.object({
  context_id: z.string().optional(),
});

// Handler functions
async function handleGetRules(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url);
  const contextId = url.searchParams.get('context_id');

  let query = supabase
    .from('policy_rules')
    .select('id, context_id, priority, is_active, created_at, rule');

  if (contextId) {
    query = query.eq('context_id', contextId);
  }

  query = query.order('priority', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Database Error:', error);
    return respond({ message: 'Failed to fetch policy rules', details: error.message }, 500);
  }

  return respond({ rules: data }, 200);
}

async function handlePostRule(req: Request, supabase: any, userId: string) {
  try {
    const body = await req.json();
    const { context_id, priority, rule } = CreateRuleSchema.parse(body);

    const rule_payload = PolicyRule.parse(rule);

    const { data, error } = await supabase
      .from('policy_rules')
      .insert({
        tenant_id: userId,
        context_id: context_id,
        priority: priority,
        is_active: rule_payload.is_active ?? true,
        rule: rule_payload,
      })
      .select()
      .single();

    if (error) throw error;

    return respond(data, 201);
  } catch (error) {
    console.error('Rule Creation Error:', error);
    if (error instanceof z.ZodError) {
      return respond({ message: 'Invalid Input Schema', details: error.issues }, 400);
    }
    return respond({ message: 'Failed to create policy rule', error: (error as Error).message }, 500);
  }
}

async function handlePutRule(req: Request, supabase: any, userId: string) {
  try {
    const body = await req.json();
    const { id, rule } = UpdateRuleSchema.parse(body);

    const { data, error } = await supabase
      .from('policy_rules')
      .update({ rule })
      .eq('id', id)
      .eq('tenant_id', userId)
      .select()
      .single();

    if (error) throw error;

    return respond(data, 200);
  } catch (error) {
    console.error('Rule Update Error:', error);
    if (error instanceof z.ZodError) {
      return respond({ message: 'Invalid Input Schema', details: error.issues }, 400);
    }
    return respond({ message: 'Failed to update policy rule', error: (error as Error).message }, 500);
  }
}

async function handleDeleteRule(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return respond({ message: 'Missing rule ID' }, 400);
  }

  const { error } = await supabase
    .from('policy_rules')
    .delete()
    .eq('id', id)
    .eq('tenant_id', userId);

  if (error) {
    console.error('Database Error:', error);
    return respond({ message: 'Failed to delete rule', details: error.message }, 500);
  }

  return respond({ success: true }, 200);
}

serve(async (req) => {
  if (handleCors(req)) return new Response(null, { headers: corsHeaders });

  const supabase = getSupabaseClient(req);
  const userId = getUserId(req);

  if (!userId) {
    return respond({ message: 'Authentication required' }, 401);
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetRules(req, supabase, userId);
      case 'POST':
        return await handlePostRule(req, supabase, userId);
      case 'PUT':
        return await handlePutRule(req, supabase, userId);
      case 'DELETE':
        return await handleDeleteRule(req, supabase, userId);
      default:
        return respond({ message: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof z.ZodError) {
      return respond({ message: 'Validation error', details: error.issues }, 400);
    }
    return respond({ message: 'Internal server error' }, 500);
  }
});
