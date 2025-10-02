// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno). Deploy with: supabase functions deploy rfi_document_parser
// Security: add RLS in DB; function executes as service role. Validate caller workspace/ownership!

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// ── Helpers ────────────────────────────────────────────────────────────────────
type NormalizedQuestion = {
  section: string | null;
  question_number: number | null;
  question_text: string;
  question_type: "free_text" | "multiple_choice" | "yes_no" | "matrix";
  required_evidence: { type: string; hint?: string }[];
  is_mandatory: boolean;
  ai_classification?: Record<string, unknown>;
};

type ParseResult = {
  distribution_id?: string; // optional link to policy_distribution
  questions: NormalizedQuestion[];
};

function assertAuth(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) throw new Response("Unauthorized", { status: 401 });
}

function toTextFromPdfBuf(_buf: Uint8Array): string {
  // Minimal placeholder – replace with your real PDF/XLSX parsing:
  // Option A: call your "document--parse_document" tool via fetch.
  // Option B: use a hosted parser (ensure no PHI/PII leaves boundary if required).
  return "Section 1\nQ1: Describe your audit trail.\nQ2: Provide SOC2.\n";
}

async function llmStructureQuestions(text: string): Promise<NormalizedQuestion[]> {
  // Call your existing LLM adapter (Gemini/OpenAI) through agent-coordinator if preferred.
  // Contract: return normalized questions array.
  // For now, return mock mapped questions:
  return [
    {
      section: "Governance",
      question_number: 1,
      question_text: "Describe your audit trail for AI operations.",
      question_type: "free_text",
      required_evidence: [{ type: "document", hint: "Audit trail sample / export" }],
      is_mandatory: true,
      ai_classification: { pillar: "audit", tags: ["immutability", "traceability"] }
    },
    {
      section: "Security",
      question_number: 2,
      question_text: "Provide SOC 2 (latest report).",
      question_type: "free_text",
      required_evidence: [{ type: "attachment", hint: "SOC2 Type II PDF" }],
      is_mandatory: true,
      ai_classification: { pillar: "security", tags: ["soc2"] }
    }
  ];
}

// ── Handler ────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    assertAuth(req);
    const { file_b64, file_mime, distribution_id, workspace_id } = await req.json();

    if (!file_b64 || !file_mime || !workspace_id) {
      return new Response("file_b64, file_mime, workspace_id are required", { status: 400 });
    }

    const buf = decode(file_b64);
    const rawText = toTextFromPdfBuf(buf);
    const questions = await llmStructureQuestions(rawText);

    // Optional: persist to rfp_question_library (if you choose to keep parsed RFIs)
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("authorization")! } } });

    let insertedIds: string[] = [];
    if (distribution_id) {
      const { data, error } = await supabase
        .from("rfp_question_library")
        .insert(
          questions.map((q) => ({
            distribution_id,
            section: q.section,
            question_number: q.question_number,
            question_text: q.question_text,
            question_type: q.question_type,
            required_evidence: q.required_evidence,
            is_mandatory: q.is_mandatory,
            ai_classification: q.ai_classification
          }))
        )
        .select("id");
      if (error) throw error;
      insertedIds = data?.map((r: any) => r.id) ?? [];
    }

    const result: ParseResult = { distribution_id, questions };
    return new Response(JSON.stringify({ ok: true, insertedIds, result }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Response ? await e.text() : (e?.message ?? "Internal error");
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: e instanceof Response ? e.status : 500 });
  }
});