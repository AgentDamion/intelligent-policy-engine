// Supabase Edge Function (Deno). Deploy: supabase functions deploy rfp_score_response
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ScoreBreakdown = {
  total: number; // 0..100
  weights: Record<string, number>;
  criteria: Array<{ key: string; passed: boolean; score: number; rationale?: string }>;
  critical_gaps: string[]; // list of failed critical criteria
};

Deno.serve(async (req) => {
  try {
    const { submission_id } = await req.json();
    if (!submission_id) return new Response("submission_id is required", { status: 400 });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Pull submission & policy_version profile
    const { data: sub, error: e1 } = await supabase
      .from("submissions")
      .select("id, workspace_id, policy_version_id, rfp_response_data, submission_type")
      .eq("id", submission_id)
      .single();
    if (e1) throw e1;
    if (sub.submission_type !== "rfp_response") return new Response("Invalid submission_type", { status: 400 });

    const { data: pv, error: e2 } = await supabase
      .from("policy_versions")
      .select("id, compliance_scoring_profile")
      .eq("id", sub.policy_version_id)
      .single();
    if (e2) throw e2;

    const profile = (typeof pv.compliance_scoring_profile === "string"
      ? JSON.parse(pv.compliance_scoring_profile)
      : pv.compliance_scoring_profile) as {
      minScore?: number;
      autoRejectThreshold?: number;
      criticalCriteria?: string[];
      scoringWeights?: Record<string, number>; // e.g. security:30, privacy:25, ...
    };

    // Very simple placeholder logic; replace with your ComplianceScoringAgent call:
    // You can call your agent-coordinator here and return the agent's evaluation verbatim.
    const breakdown: ScoreBreakdown = {
      total: 88,
      weights: profile?.scoringWeights ?? {},
      criteria: [
        { key: "security", passed: true, score: 28, rationale: "Meets encryption, key mgmt" },
        { key: "privacy", passed: true, score: 23 },
        { key: "transparency", passed: true, score: 18 },
        { key: "accountability", passed: true, score: 12 },
        { key: "fairness", passed: true, score: 7 }
      ],
      critical_gaps: [] // populate if any critical criteria failed
    };

    // Persist
    const { error: e3 } = await supabase
      .from("submissions")
      .update({
        compliance_score: breakdown.total,
        compliance_breakdown: breakdown
      })
      .eq("id", submission_id);
    if (e3) throw e3;

    // Audit
    await supabase.from("audit_events").insert({
      event_type: "rfp.score.completed",
      details: { submission_id, score: breakdown.total, breakdown }
    });

    return new Response(JSON.stringify({ ok: true, breakdown }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e?.message ?? "Internal error";
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
});