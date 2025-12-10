import { describe, it, expect, beforeEach } from 'vitest'
import { PlannerError, selectImplementation, type PlannerClient, type PostgrestResponse } from '../src/index'

interface MockResponse<T> extends PostgrestResponse<T> {}

function createResponse<T>(data: T | null, error: MockResponse<T>['error'] = null): MockResponse<T> {
  return { data, error }
}

class MockBuilder {
  private response: MockResponse<any>
  private insertStore?: MockInsertStore

  constructor(response: MockResponse<any>, insertStore?: MockInsertStore) {
    this.response = response
    this.insertStore = insertStore
  }

  select(): this {
    return this
  }

  eq(): this {
    return this
  }

  or(): this {
    return this
  }

  order(): this {
    return this
  }

  limit(): this {
    return this
  }

  async single() {
    return this.response
  }

  async maybeSingle() {
    return this.response
  }

  async insert(values: any) {
    this.insertStore?.records.push(values)
    return { data: null, error: null }
  }

  then<TResult1 = MockResponse<any>, TResult2 = never>(
    onfulfilled?: ((value: MockResponse<any>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.response).then(onfulfilled, onrejected)
  }
}

interface MockInsertStore {
  records: any[]
}

class MockSupabase implements PlannerClient {
  private responses: Record<string, MockResponse<any>>
  private insertStore: MockInsertStore

  constructor(responses: Record<string, MockResponse<any>>, insertStore: MockInsertStore) {
    this.responses = responses
    this.insertStore = insertStore
  }

  from(table: string) {
    const key = table
    const response = this.responses[key] ?? createResponse(null)
    return new MockBuilder(response, table === 'selection_logs' ? this.insertStore : undefined)
  }
}

describe('selectImplementation', () => {
  let insertStore: MockInsertStore

  beforeEach(() => {
    insertStore = { records: [] }
  })

  it('selects the cheapest implementation within preferred tier', async () => {
    const mock = new MockSupabase(
      {
        capabilities: createResponse({ id: 'cap-1' }),
        selection_policies: createResponse({ config: { prefer: 'fast', escalate_on_failure: true } }),
        breaker_states: createResponse([]),
        capability_implementations: createResponse([
          { id: 'impl-fast-1', tier: 'fast', provider: 'openai', name: 'gpt-4.1-mini', cost_model: { cost_per_1k_tokens: 0.15 } },
          { id: 'impl-fast-2', tier: 'fast', provider: 'openai', name: 'gpt-4.1-nano', cost_model: { cost_per_1k_tokens: 0.10 } },
          { id: 'impl-quality-1', tier: 'quality', provider: 'anthropic', name: 'claude-3-5-sonnet', cost_model: { cost_per_1k_tokens: 0.30 } },
        ]),
      },
      insertStore,
    )

    const impl = await selectImplementation({
      client: mock,
      orgId: 'org-1',
      capabilityKey: 'evaluate_policy_rule',
    })

    expect(impl.id).toBe('impl-fast-2')
    expect(insertStore.records[0].fallback_chain).toEqual(['fast'])
  })

  it('escalates to quality tier when preferred tier exhausted', async () => {
    const mock = new MockSupabase(
      {
        capabilities: createResponse({ id: 'cap-1' }),
        selection_policies: createResponse({ config: { prefer: 'fast', escalate_on_failure: true } }),
        breaker_states: createResponse([]),
        capability_implementations: createResponse([
          { id: 'impl-quality-1', tier: 'quality', provider: 'anthropic', name: 'claude', cost_model: { cost_per_1k_tokens: 0.35 } },
        ]),
      },
      insertStore,
    )

    const impl = await selectImplementation({
      client: mock,
      orgId: 'org-1',
      capabilityKey: 'assess_tool_risk',
    })

    expect(impl.tier).toBe('quality')
    expect(insertStore.records[0].fallback_chain).toEqual(['fast', 'quality'])
  })

  it('skips implementations with open breakers', async () => {
    const mock = new MockSupabase(
      {
        capabilities: createResponse({ id: 'cap-1' }),
        selection_policies: createResponse({ config: { prefer: 'fast', escalate_on_failure: true } }),
        breaker_states: createResponse([{ implementation_id: 'impl-fast-1' }]),
        capability_implementations: createResponse([
          { id: 'impl-fast-1', tier: 'fast', provider: 'openai', name: 'mini', cost_model: { cost_per_1k_tokens: 0.12 } },
          { id: 'impl-fast-2', tier: 'fast', provider: 'openai', name: 'nano', cost_model: { cost_per_1k_tokens: 0.14 } },
        ]),
      },
      insertStore,
    )

    const impl = await selectImplementation({
      client: mock,
      orgId: 'org-1',
      capabilityKey: 'evaluate_policy_rule',
    })

    expect(impl.id).toBe('impl-fast-2')
  })

  it('throws when no implementation available', async () => {
    const mock = new MockSupabase(
      {
        capabilities: createResponse({ id: 'cap-1' }),
        selection_policies: createResponse({ config: { prefer: 'fast', escalate_on_failure: false } }),
        breaker_states: createResponse([]),
        capability_implementations: createResponse([]),
      },
      insertStore,
    )

    await expect(
      selectImplementation({
        client: mock,
        orgId: 'org-1',
        capabilityKey: 'generate_proof_bundle',
      }),
    ).rejects.toThrow(PlannerError)
  })
})

