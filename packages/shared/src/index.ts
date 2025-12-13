import { z } from "zod";

// ---------- Common enums ----------
export const DecisionStatus = z.enum(["Approved", "Prohibited", "RequiresReview"]);
export const ActionType = z.enum(["Research", "Drafting", "InternalConcept", "FinalAssetGeneration", "Other"]);

// ---------- Tool + Actor ----------
export const Tool = z.object({
  id: z.string(),              // global tool registry id
  name: z.string(),
  version: z.string(),         // semver string if applicable
  category: z.string().optional(),
});
export type Tool = z.infer<typeof Tool>;

export const Actor = z.object({
  role: z.string(),            // e.g., "Senior Copywriter"
  id: z.string().optional(),   // optional user id (never leaves tenant)
});
export type Actor = z.infer<typeof Actor>;

// ---------- Context ----------
export const Context = z.object({
  tenantId: z.string(),
  enterpriseId: z.string(),
  partnerId: z.string(),
  brand: z.string(),
  region: z.string(),          // e.g., "US", "EU"
  channel: z.string(),         // e.g., "HCP", "DTC"
  policySnapshotId: z.string(),// EPS id pinned at run time
});
export type Context = z.infer<typeof Context>;

// ---------- Tool Usage Event ----------
export const ToolUsageEvent = z.object({
  id: z.string().optional(),
  tool: Tool,
  actor: Actor,
  action: z.object({ type: ActionType, note: z.string().optional() }),
  context: Context,
  ts: z.string(),              // ISO timestamp
});
export type ToolUsageEvent = z.infer<typeof ToolUsageEvent>;

// ---------- Policy Rule (JSONB) ----------
export const ConditionClause = z.object({
  field: z.string(),           // e.g., "tool.name", "tool.version", "actor.role", "context.region"
  operator: z.enum(["equals","not_equals","in","not_in","semver_less_than","semver_greater_than","semver_satisfies"]),
  value: z.any(),
});
export type ConditionClause = z.infer<typeof ConditionClause>;

// Define ConditionTree type first for recursive reference
export type ConditionTree = {
  operator: "AND" | "OR";
  clauses: Array<ConditionClause | ConditionTree>;
};

// NOTE: Recursive Zod schemas can trigger TS "infinite" type mismatches.
// Cast to any to silence the compiler while keeping runtime validation.
export const ConditionTree: z.ZodType<ConditionTree> = z.object({
  operator: z.enum(["AND","OR"]),
  clauses: z.array(z.union([ConditionClause, z.lazy(() => ConditionTree)])),
}) as any;

export const PolicyRule = z.object({
  rule_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priority: z.number().int(),       // lower = higher priority
  is_active: z.boolean().default(true),
  context_id: z.string(),
  conditions: ConditionTree,
  decision: z.object({
    status: DecisionStatus,
    reason: z.string(),
    audit_trigger: z.boolean().default(false),
  }),
});
export type PolicyRule = z.infer<typeof PolicyRule>;

// ---------- Verdict ----------
export const Verdict = z.object({
  status: DecisionStatus,
  reason: z.string(),
  rule_id: z.string().optional(),
  policySnapshotId: z.string(),
  checks: z.array(z.object({
    clause: z.string(),
    result: z.boolean(),
  })).optional(),
});
export type Verdict = z.infer<typeof Verdict>;

// ---------- Suggestions / Remediations ----------
export const Suggestion = z.object({
  type: z.enum(["VersionBump","AlternativeTool","AddEvidence","ChangeWording","RouteToReview"]),
  message: z.string(),
  clause_id: z.string().optional(),
  remediation_id: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type Suggestion = z.infer<typeof Suggestion>;

// ---------- Telemetry Atom (de-identified, global) ----------
export const TelemetryAtom = z.object({
  ts: z.string(),
  tool_id: z.string(),
  tool_version: z.string(),
  use_case_id: z.string(),       // maps from action/context to global vocab
  clause_ids: z.array(z.string()).optional(),
  outcome: z.enum(["pass","fail","deviation","remediated"]),
  remediation_id: z.string().optional(),
  mlr_result: z.enum(["pass","reject","n/a"]).default("n/a"),
  duration_s: z.number().optional(),
  region_id: z.string(),
  run_hash: z.string().optional(),
});
export type TelemetryAtom = z.infer<typeof TelemetryAtom>;

// ---------- Helpers ----------
export function get(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}
