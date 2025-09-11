import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts";

export type EmbeddingModel =
  | "text-embedding-3-large"
  | "text-embedding-3-small"
  | string;

export interface EmbeddingProviderConfig {
  apiKey?: string | null;
  baseUrl?: string | null; // optional custom base
  model?: EmbeddingModel;
}

export interface ChatProviderConfig {
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string; // e.g. gpt-4o-mini, gpt-4o, gpt-4.1, o4-mini
}

export interface RetrievedContext {
  id: string;
  source: string; // table name
  title?: string | null;
  text: string;
  metadata?: Record<string, unknown>;
}

export const DecisionSchema = z.object({
  outcome: z.enum(["approved", "rejected", "flagged"]),
  risk: z.enum(["low", "medium", "high"]),
  risk_score: z.number().min(0).max(1),
  reasoning: z.string(),
  violated_rules: z.array(z.string()).optional().default([]),
  satisfied_rules: z.array(z.string()).optional().default([]),
});

export type StructuredDecision = z.infer<typeof DecisionSchema>;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function cleanText(input: unknown, maxLen = 4000): string {
  const txt = typeof input === "string" ? input : JSON.stringify(input ?? "", null, 2);
  return txt.replace(/\s+/g, " ").slice(0, maxLen);
}

export async function embed(
  text: string,
  cfg?: Partial<EmbeddingProviderConfig>,
): Promise<number[] | null> {
  const apiKey = cfg?.apiKey ?? Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;
  const baseUrl = (cfg?.baseUrl ?? Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com").replace(/\/$/, "");
  const model = cfg?.model ?? (Deno.env.get("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small");

  const res = await fetch(`${baseUrl}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model,
    }),
  });

  if (!res.ok) {
    console.error("Embedding API error", await res.text());
    return null;
  }
  const json = await res.json();
  const vector = json?.data?.[0]?.embedding as number[] | undefined;
  return Array.isArray(vector) ? vector : null;
}

export async function chatJson(
  systemPrompt: string,
  userPrompt: string,
  cfg?: Partial<ChatProviderConfig>,
): Promise<StructuredDecision | null> {
  const apiKey = cfg?.apiKey ?? Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;
  const baseUrl = (cfg?.baseUrl ?? Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com").replace(/\/$/, "");
  const model = cfg?.model ?? (Deno.env.get("OPENAI_CHAT_MODEL") || "gpt-4o-mini");

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    console.error("Chat API error", await res.text());
    return null;
  }
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return DecisionSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to parse decision JSON", e);
    return null;
  }
}

export function pickTopKBySimilarity(
  queryVec: number[] | null,
  candidates: Array<{ item: RetrievedContext; vector: number[] | null; fallbackScore?: number }>,
  k = 8,
): Array<{ item: RetrievedContext; score: number }> {
  if (!queryVec) {
    // Fall back to provided heuristic score or by length
    return candidates
      .map((c) => ({ item: c.item, score: c.fallbackScore ?? (c.item.text?.length || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  const scored = candidates.map((c) => ({
    item: c.item,
    score: c.vector ? cosineSimilarity(queryVec, c.vector) : (c.fallbackScore ?? 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

export function renderContextForPrompt(ctx: RetrievedContext[]): string {
  return ctx
    .map((c, i) => `#${i + 1} [${c.source}] ${c.title ?? "Untitled"}\n${cleanText(c.text, 2000)}`)
    .join("\n\n");
}

export function buildDecisionPrompt(opts: {
  submissionText: string;
  contexts: RetrievedContext[];
  policyRulesJson?: unknown;
}): { system: string; user: string } {
  const system = [
    "You are a senior compliance reviewer for AI tools in regulated industries.",
    "Use the provided regulatory context and policy rules to assess the submission.",
    "Return STRICT JSON matching the schema: {outcome, risk, risk_score, reasoning, violated_rules, satisfied_rules}.",
    "- outcome: approved | rejected | flagged",
    "- risk: low | medium | high",
    "- risk_score: 0..1 (1 = highest risk)",
    "- reasoning: short, factual explanation",
    "- violated_rules: array of rule identifiers or names",
    "- satisfied_rules: array of rule identifiers or names",
  ].join(" ");

  const user = [
    "Submission:",
    cleanText(opts.submissionText, 3000),
    "\n\nRegulatory Context:\n",
    renderContextForPrompt(opts.contexts),
    opts.policyRulesJson
      ? `\n\nPolicy Rules (JSON):\n${cleanText(opts.policyRulesJson, 3000)}`
      : "",
    "\n\nRespond with JSON only.",
  ].join("");

  return { system, user };
}

