import { z } from 'zod'

export const Uuid = z.string().uuid()
export const IsoTimestamp = z.string().datetime({ offset: true })

export const JsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValue),
    z.record(JsonValue),
  ]),
)

export const ToolUsageEnvelope = z.object({
  event_id: Uuid,
  actor_id: Uuid,
  partner_id: Uuid.optional(),
  client_id: Uuid.optional(),
  tool: z.string(),
  version: z.string(),
  action: z.string(),
  purpose: z.string().default(''),
  capability: z.string().optional(),
  implementation: z.string().optional(),
  eps_snapshot_id: Uuid,
  timestamp: IsoTimestamp,
  success_code: z.enum(['OK', 'ERR']),
  token_count: z.number().int().nonnegative().optional(),
  cost_estimate: z.number().nonnegative().optional(),
  file_flags: z.array(z.string()).default([]),
  region: z.string(),
  metadata: JsonValue.default({}),
})

export type ToolUsageEnvelope = z.infer<typeof ToolUsageEnvelope>

export const DecisionGraphNode = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  agent: z.string().optional(),
  capability: z.string().optional(),
  implementation: z.string().optional(),
  ts: IsoTimestamp.optional(),
  duration_ms: z.number().int().nonnegative().optional(),
  metadata: JsonValue.default({}),
})

export type DecisionGraphNode = z.infer<typeof DecisionGraphNode>

export const DecisionGraphEdge = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  reason: z.string().optional(),
  metadata: JsonValue.default({}),
})

export type DecisionGraphEdge = z.infer<typeof DecisionGraphEdge>

export const DecisionGraph = z.object({
  version: z.string().default('1.0'),
  nodes: z.array(DecisionGraphNode),
  edges: z.array(DecisionGraphEdge),
  metadata: JsonValue.default({}),
})

export type DecisionGraph = z.infer<typeof DecisionGraph>

export const ProofEventType = z.enum(['proposed', 'approved', 'attested', 'started', 'stopped', 'rolled_back'])
export const ProofEntityType = z.enum(['decision', 'pcp', 'canary'])

export type ProofEventType = z.infer<typeof ProofEventType>
export type ProofEntityType = z.infer<typeof ProofEntityType>

export const ProofEvent = z.object({
  proof_id: Uuid,
  enterprise_id: Uuid,
  entity_type: ProofEntityType,
  entity_id: Uuid,
  event_type: ProofEventType,
  snapshot_id: Uuid.optional(),
  actor_id: Uuid.optional(),
  timestamp: IsoTimestamp,
  metadata: JsonValue.default({}),
})

export type ProofEvent = z.infer<typeof ProofEvent>

export const AgentEvent = z.object({
  id: Uuid.optional(),
  enterprise_id: Uuid.optional(),
  agent_name: z.string(),
  event_type: z.string(),
  capability_key: z.string().optional(),
  implementation_id: Uuid.optional(),
  details: JsonValue.default({}),
  created_at: IsoTimestamp.optional(),
})

export type AgentEvent = z.infer<typeof AgentEvent>

export const Capability = z.object({
  id: Uuid.optional(),
  capability_key: z.string(),
  description: z.string().optional(),
  labels: z.array(z.string()).default([]),
  created_at: IsoTimestamp.optional(),
})

export type Capability = z.infer<typeof Capability>

export const Implementation = z.object({
  id: Uuid.optional(),
  capability_id: Uuid,
  enterprise_id: Uuid.optional(),
  name: z.string(),
  provider: z.string().optional(),
  tier: z.string().optional(),
  region: z.string().optional(),
  cost_model: JsonValue.default({}),
  config: JsonValue.default({}),
  sla: JsonValue.default({}),
  is_active: z.boolean().default(true),
  created_at: IsoTimestamp.optional(),
})

export type Implementation = z.infer<typeof Implementation>

export const SelectionLog = z.object({
  id: Uuid.optional(),
  enterprise_id: Uuid.optional(),
  capability_id: Uuid,
  requested_impl_id: Uuid.optional(),
  selected_impl_id: Uuid.optional(),
  fallback_chain: z.array(z.string()).default([]),
  reason_codes: z.array(z.string()).default([]),
  context: JsonValue.default({}),
  cost_estimate: z.number().nonnegative().optional(),
  latency_ms: z.number().int().nonnegative().optional(),
  status: z.string(),
  created_at: IsoTimestamp.optional(),
})

export type SelectionLog = z.infer<typeof SelectionLog>

export const AgentMetric = z.object({
  id: Uuid.optional(),
  enterprise_id: Uuid.optional(),
  agent_name: z.string(),
  capability_key: z.string().optional(),
  implementation_id: Uuid.optional(),
  latency_ms: z.number().int().nonnegative().optional(),
  token_count: z.number().int().nonnegative().optional(),
  cost_estimate: z.number().nonnegative().optional(),
  success: z.boolean().optional(),
  vendor_code: z.string().optional(),
  error_code: z.string().optional(),
  metadata: JsonValue.default({}),
  recorded_at: IsoTimestamp.optional(),
})

export type AgentMetric = z.infer<typeof AgentMetric>

export const ProofBundle = z.object({
  bundle_id: Uuid,
  enterprise_id: Uuid,
  root_event_id: Uuid,
  merkle_root: z.string().optional(),
  events: z.array(ProofEvent),
  decision_graph: DecisionGraph.optional(),
  metadata: JsonValue.default({}),
})

export type ProofBundle = z.infer<typeof ProofBundle>

