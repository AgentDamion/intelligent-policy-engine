import type { Implementation } from '@aicomplyr/contracts'

export interface PlannerClient {
  from(table: string): PlannerQueryBuilder
}

export interface PlannerQueryBuilder {
  select(columns: string): PlannerQueryBuilder
  eq(column: string, value: unknown): PlannerQueryBuilder
  or(filter: string, options?: Record<string, unknown>): PlannerQueryBuilder
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): PlannerQueryBuilder
  limit(value: number): PlannerQueryBuilder
  single(): Promise<PostgrestResponse<any>>
  maybeSingle(): Promise<PostgrestResponse<any>>
  in?(column: string, values: unknown[]): PlannerQueryBuilder
  insert?(values: any): Promise<PostgrestResponse<any>>
}

export interface PostgrestResponse<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

export interface SelectionRequest {
  client: PlannerClient
  orgId: string
  capabilityKey: string
  context?: Record<string, unknown>
}

interface SelectionPolicyConfig {
  prefer: 'fast' | 'quality'
  escalate_on_failure: boolean
  max_cost_per_1k?: number
}

interface CapabilityRow {
  id: string
}

interface ImplementationRow extends Implementation {
  tier: 'fast' | 'quality' | string
  cost_model: Record<string, unknown>
}

interface BreakerRow {
  implementation_id: string
}

interface SelectionLogInput {
  enterprise_id: string
  capability_id: string
  selected_impl_id: string
  fallback_chain: string[]
  reason_codes: string[]
  context: Record<string, unknown>
  cost_estimate?: number
  status: string
}

export class PlannerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlannerError'
  }
}

export async function selectImplementation({
  client,
  orgId,
  capabilityKey,
  context = {},
}: SelectionRequest): Promise<Implementation> {
  const capability = await fetchCapability(client, capabilityKey)
  if (!capability) {
    throw new PlannerError(`Capability not found for key ${capabilityKey}`)
  }

  const policy = await fetchPolicy(client, capability.id, orgId)
  const openBreakers = await fetchOpenBreakers(client, capability.id, orgId)
  const implementations = await fetchImplementations(client, capability.id, orgId)

  if (implementations.length === 0) {
    throw new PlannerError(`No implementations registered for ${capabilityKey}`)
  }

  const preferredTier =
    context.requires_quality === true ? 'quality' : policy.prefer ?? ('fast' as 'fast' | 'quality')
  const fallbackTier = preferredTier === 'quality' ? 'fast' : 'quality'

  const selection = pickImplementation(
    implementations,
    openBreakers,
    preferredTier,
    fallbackTier,
    policy,
  )

  if (!selection.selected) {
    throw new PlannerError(`No available implementation for ${capabilityKey}`)
  }

  await logSelection(client, {
    enterprise_id: orgId,
    capability_id: capability.id,
    selected_impl_id: selection.selected.id!,
    fallback_chain: selection.fallbackChain,
    reason_codes: buildReasonCodes(selection, preferredTier),
    context,
    cost_estimate: extractCost(selection.selected),
    status: 'selected',
  })

  return selection.selected
}

async function fetchCapability(client: PlannerClient, capabilityKey: string): Promise<CapabilityRow | null> {
  const { data, error } = await client
    .from('capabilities')
    .select('id')
    .eq('capability_key', capabilityKey)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new PlannerError(`Failed to fetch capability: ${error.message}`)
  }

  return data as CapabilityRow
}

async function fetchPolicy(
  client: PlannerClient,
  capabilityId: string,
  orgId: string,
): Promise<SelectionPolicyConfig> {
  const { data, error } = await client
    .from('selection_policies')
    .select('config')
    .or(`enterprise_id.eq.${orgId},enterprise_id.is.null`)
    .eq('capability_id', capabilityId)
    .order('enterprise_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new PlannerError(`Failed to fetch selection policy: ${error.message}`)
  }

  const config = (data?.config ?? {}) as Partial<SelectionPolicyConfig>
  return {
    prefer: (config.prefer as 'fast' | 'quality') ?? 'fast',
    escalate_on_failure: config.escalate_on_failure ?? true,
    max_cost_per_1k: config.max_cost_per_1k,
  }
}

async function fetchOpenBreakers(
  client: PlannerClient,
  capabilityId: string,
  orgId: string,
): Promise<Set<string>> {
  const { data, error } = await client
    .from('breaker_states')
    .select('implementation_id')
    .eq('capability_id', capabilityId)
    .eq('state', 'open')
    .or(`enterprise_id.eq.${orgId},enterprise_id.is.null`)

  if (error) {
    throw new PlannerError(`Failed to fetch breaker states: ${error.message}`)
  }

  const rows = (data ?? []) as BreakerRow[]
  return new Set(rows.map((row) => row.implementation_id))
}

async function fetchImplementations(
  client: PlannerClient,
  capabilityId: string,
  orgId: string,
): Promise<ImplementationRow[]> {
  const { data, error } = await client
    .from('capability_implementations')
    .select('*')
    .eq('capability_id', capabilityId)
    .or(`enterprise_id.eq.${orgId},enterprise_id.is.null`)

  if (error) {
    throw new PlannerError(`Failed to fetch implementations: ${error.message}`)
  }

  return (data ?? []) as ImplementationRow[]
}

interface SelectionResult {
  selected: ImplementationRow | null
  fallbackChain: string[]
  attemptedTiers: ('fast' | 'quality')[]
}

function pickImplementation(
  implementations: ImplementationRow[],
  openBreakers: Set<string>,
  preferredTier: 'fast' | 'quality',
  fallbackTier: 'fast' | 'quality',
  policy: SelectionPolicyConfig,
): SelectionResult {
  const attempted: ('fast' | 'quality')[] = []
  let selection: ImplementationRow | null = null

  const byTier = (tier: 'fast' | 'quality') =>
    implementations
      .filter((impl) => impl.tier === tier)
      .filter((impl) => !openBreakers.has(impl.id ?? ''))
      .filter((impl) => withinCost(impl, policy.max_cost_per_1k))
      .sort((a, b) => extractCost(a) - extractCost(b))

  attempted.push(preferredTier)
  const preferredPool = byTier(preferredTier)
  if (preferredPool.length > 0) {
    selection = preferredPool[0]
  }

  if (!selection && policy.escalate_on_failure) {
    attempted.push(fallbackTier)
    const fallbackPool = byTier(fallbackTier)
    if (fallbackPool.length > 0) {
      selection = fallbackPool[0]
    }
  }

  return {
    selected: selection,
    fallbackChain: attempted,
    attemptedTiers: attempted,
  }
}

function withinCost(impl: ImplementationRow, maxCost?: number): boolean {
  if (!maxCost) return true
  const cost = extractCost(impl)
  return cost <= maxCost
}

function extractCost(impl: ImplementationRow): number {
  const cost = impl.cost_model?.cost_per_1k_tokens
  if (typeof cost === 'number') return cost
  if (typeof cost === 'string') return Number(cost)
  return 0
}

async function logSelection(client: PlannerClient, input: SelectionLogInput): Promise<void> {
  const table = client.from('selection_logs')
  if (!table.insert) return

  const { error } = await table.insert({
    enterprise_id: input.enterprise_id,
    capability_id: input.capability_id,
    selected_impl_id: input.selected_impl_id,
    fallback_chain: input.fallback_chain,
    reason_codes: input.reason_codes,
    context: input.context,
    cost_estimate: input.cost_estimate,
    status: input.status,
  })

  if (error) {
    throw new PlannerError(`Failed to log selection: ${error.message}`)
  }
}

function buildReasonCodes(result: SelectionResult, preferredTier: 'fast' | 'quality'): string[] {
  const codes = [`tier:${preferredTier}`]
  if (result.selected) {
    codes.push(`impl:${result.selected.provider}/${result.selected.name}`)
  }
  if (result.attemptedTiers.length > 1) {
    codes.push('escalated:true')
  }
  return codes
}

