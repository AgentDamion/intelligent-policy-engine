import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts";
import {
  buildDecisionPrompt,
  chatJson,
  cleanText,
  embed,
  pickTopKBySimilarity,
  type RetrievedContext,
  type StructuredDecision,
} from "../shared/rag-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RequestSchema = z.object({
  enterprise_id: z.string().uuid(),
  submission_id: z.string().uuid().optional(),
  submission_item_ids: z.array(z.string().uuid()).optional(),
  limit_items: z.number().int().min(1).max(50).default(10),
});

type SubmissionItem = {
  id: string;
  text: string;
};

async function trySelect<T>(
  sb: SupabaseClient,
  table: string,
  columns: string,
  filters: (q: any) => any,
  limit?: number,
): Promise<{ data: T[]; error: Error | null }> {
  try {
    // deno-lint-ignore no-explicit-any
    let q: any = sb.from(table).select(columns);
    q = filters(q);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as T[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e as Error };
  }
}

async function loadSubmissionItems(
  sb: SupabaseClient,
  args: { enterpriseId: string; submissionId?: string; submissionItemIds?: string[]; limitItems: number },
): Promise<SubmissionItem[]> {
  // Preferred path: submission_items table with a JSONB content field
  const trySubmissionItems = async (): Promise<SubmissionItem[] | null> => {
    const filters = (q: any) => {
      if (args.submissionItemIds?.length) return q.in("id", args.submissionItemIds);
      if (args.submissionId) return q.eq("submission_id", args.submissionId);
      return q; // fallback, rely on limit
    };
    const { data, error } = await trySelect<any>(
      sb,
      "submission_items",
      "id, content",
      filters,
      args.limitItems,
    );
    if (error) return null;
    return (data || []).map((row) => ({ id: row.id, text: cleanText(row.content) }));
  };

  // Fallback: tool_submissions as items
  const tryToolSubmissions = async (): Promise<SubmissionItem[] | null> => {
    const { data, error } = await trySelect<any>(
      sb,
      "tool_submissions",
      "id, tool_name, vendor, category, use_case, risk_level, meta_loop_score",
      (q) => q.eq("enterprise_id", args.enterpriseId),
      args.limitItems,
    );
    if (error) return null;
    return (data || []).map((row) => ({
      id: row.id,
      text: cleanText({
        tool_name: row.tool_name,
        vendor: row.vendor,
        category: row.category,
        use_case: row.use_case,
        risk_level: row.risk_level,
        meta_loop_score: row.meta_loop_score,
      }),
    }));
  };

  const a = await trySubmissionItems();
  if (a && a.length) return a;
  const b = await tryToolSubmissions();
  return b ?? [];
}

async function retrieveRegulatoryContext(
  sb: SupabaseClient,
  enterpriseId: string,
  queryText: string,
): Promise<RetrievedContext[]> {
  const candidates: Array<{ item: RetrievedContext; vector: number[] | null; fallbackScore?: number }> = [];

  // SOP documents (QMS)
  {
    const { data } = await trySelect<any>(
      sb,
      "sop_documents",
      "id, title, content, regulatory_scope",
      (q) => q.eq("organization_id", enterpriseId),
      50,
    );
    for (const d of data || []) {
      const text = cleanText({ title: d.title, content: d.content, regulatory_scope: d.regulatory_scope });
      candidates.push({ item: { id: d.id, source: "sop_documents", title: d.title, text }, vector: null, fallbackScore: text.length });
    }
  }

  // Compliance requirements
  {
    const { data } = await trySelect<any>(
      sb,
      "compliance_requirements",
      "id, regulation_name, jurisdiction, regulation_type, status, risk_level, compliance_evidence, corrective_actions",
      (q) => q.eq("organization_id", enterpriseId),
      50,
    );
    for (const d of data || []) {
      const text = cleanText({
        regulation_name: d.regulation_name,
        jurisdiction: d.jurisdiction,
        regulation_type: d.regulation_type,
        status: d.status,
        risk_level: d.risk_level,
        compliance_evidence: d.compliance_evidence,
        corrective_actions: d.corrective_actions,
      });
      candidates.push({ item: { id: d.id, source: "compliance_requirements", title: d.regulation_name, text }, vector: null, fallbackScore: text.length });
    }
  }

  // Policies (two possible tables)
  {
    const { data } = await trySelect<any>(
      sb,
      "policies",
      "id, policy_name, policy_type, content, metadata",
      (q) => q.or(`enterprise_id.eq.${enterpriseId},organization_id.eq.${enterpriseId}`),
      50,
    );
    for (const d of data || []) {
      const text = cleanText({ policy_name: d.policy_name, policy_type: d.policy_type, content: d.content, metadata: d.metadata });
      candidates.push({ item: { id: d.id, source: "policies", title: d.policy_name, text }, vector: null, fallbackScore: text.length });
    }
  }

  {
    const { data } = await trySelect<any>(
      sb,
      "policies_enhanced",
      "id, name, policy_rules, risk_scoring, compliance_framework, status",
      (q) => q.eq("organization_id", enterpriseId),
      50,
    );
    for (const d of data || []) {
      const text = cleanText({ name: d.name, policy_rules: d.policy_rules, risk_scoring: d.risk_scoring, framework: d.compliance_framework, status: d.status });
      candidates.push({ item: { id: d.id, source: "policies_enhanced", title: d.name, text }, vector: null, fallbackScore: text.length });
    }
  }

  // Hybrid retrieval: embed query and top N candidates ad-hoc for rerank
  const qVec = await embed(cleanText(queryText, 2000));
  const topCandidates = candidates.slice(0, 64); // cap to avoid rate limits
  const vecs = await Promise.all(topCandidates.map((c) => embed(c.item.text)));
  for (let i = 0; i < topCandidates.length; i++) topCandidates[i].vector = vecs[i];
  const ranked = pickTopKBySimilarity(qVec, topCandidates, 12);
  return ranked.map((r) => r.item);
}

function scoreToRisk(score: number): "low" | "medium" | "high" {
  if (score <= 0.33) return "low";
  if (score <= 0.66) return "medium";
  return "high";
}

function decideOutcome(sd: StructuredDecision): "approved" | "rejected" | "flagged" {
  if (sd.outcome) return sd.outcome; // model-decided
  if (sd.risk === "low" && (sd.violated_rules?.length || 0) === 0) return "approved";
  if (sd.risk === "high" && (sd.violated_rules?.length || 0) >= 1) return "rejected";
  return "flagged";
}

async function upsertScore(
  sb: SupabaseClient,
  enterpriseId: string,
  itemId: string,
  riskScore: number,
): Promise<void> {
  // Preferred: scores table with submission_item_id
  try {
    const { error } = await sb.from("scores").insert({ submission_item_id: itemId, score: riskScore, method: "RAGPolicyAgent", created_at: new Date().toISOString() });
    if (!error) return;
    // If scores exists but different schema, we still bail to fallback
  } catch (_) {
    // relation might not exist; fall back
  }

  // Fallback: update tool_submissions.meta_loop_score
  await sb
    .from("tool_submissions")
    .update({ meta_loop_score: { rag_risk_score: riskScore, updated_at: new Date().toISOString() } })
    .eq("id", itemId)
    .eq("enterprise_id", enterpriseId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { enterprise_id, submission_id, submission_item_ids, limit_items } = RequestSchema.parse(body);

    // 1) Load items
    const items = await loadSubmissionItems(sb, {
      enterpriseId: enterprise_id,
      submissionId: submission_id,
      submissionItemIds: submission_item_ids,
      limitItems: limit_items,
    });
    if (!items.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0, message: "No items found" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Process each item: retrieval + LLM decision
    let processed = 0;
    for (const item of items) {
      const contexts = await retrieveRegulatoryContext(sb, enterprise_id, item.text);

      // Gather policy rules JSON if available
      let policyRulesJson: unknown = undefined;
      try {
        const pol = await sb
          .from("policies_enhanced")
          .select("policy_rules")
          .eq("organization_id", enterprise_id)
          .limit(5);
        policyRulesJson = (pol.data || []).map((r: any) => r.policy_rules);
      } catch (_) {
        // ignore
      }

      const { system, user } = buildDecisionPrompt({ submissionText: item.text, contexts, policyRulesJson });
      const decision = await chatJson(system, user);
      const riskScore = decision?.risk_score ?? 0.5;
      const risk = decision?.risk ?? scoreToRisk(riskScore);
      const outcome = decideOutcome({
        outcome: decision?.outcome ?? "flagged",
        risk,
        risk_score: riskScore,
        reasoning: decision?.reasoning ?? "Insufficient context, defaulting to flagged.",
        violated_rules: decision?.violated_rules ?? [],
        satisfied_rules: decision?.satisfied_rules ?? [],
      });

      // 3) Write decision to ai_agent_decisions
      await sb.from("ai_agent_decisions").insert({
        agent: "RAGPolicyAgent",
        action: "evaluate_submission_item",
        enterprise_id,
        outcome,
        risk,
        details: {
          submission_item_id: item.id,
          reasoning: decision?.reasoning,
          violated_rules: decision?.violated_rules ?? [],
          satisfied_rules: decision?.satisfied_rules ?? [],
          risk_score: riskScore,
          contexts: contexts.map((c) => ({ id: c.id, source: c.source, title: c.title })),
        },
      });

      // 4) Update scores
      await upsertScore(sb, enterprise_id, item.id, riskScore);

      processed += 1;
    }

    return new Response(JSON.stringify({ ok: true, processed }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

