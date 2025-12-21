/**
 * Observability Logger
 * 
 * Structured logging service for agent reasoning steps, tool calls, and prompt exchanges.
 * Provides deep observability for agentic AI platform compliance and debugging.
 * 
 * All steps are linked via W3C trace context (trace_id, span_id) for distributed tracing.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TraceContext, generateSpanId } from './policy-digest.ts'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type StepType = 'prompt' | 'reasoning' | 'tool_call' | 'tool_response' | 'final_response' | 'error'

export interface ReasoningStepContent {
  role?: 'user' | 'assistant' | 'system' | 'tool'
  text?: string
  tokens?: number
  model?: string
  tool_name?: string
  tool_args?: Record<string, unknown>
  tool_result?: unknown
  error?: string
  error_code?: string
  metadata?: Record<string, unknown>
}

export interface LogStepParams {
  supabase: SupabaseClient
  traceContext: TraceContext
  activityId?: number
  enterpriseId?: string
  workspaceId?: string
  stepType: StepType
  stepOrder: number
  agentName?: string
  content: ReasoningStepContent
  durationMs?: number
  tokenCount?: number
  modelUsed?: string
  policyDigest?: string
}

export interface ToolCallParams {
  supabase: SupabaseClient
  traceContext: TraceContext
  activityId?: number
  enterpriseId?: string
  workspaceId?: string
  stepOrder: number
  agentName?: string
  toolName: string
  toolArgs: Record<string, unknown>
  toolResult?: unknown
  durationMs?: number
  policyDigest?: string
  error?: string
}

export interface PromptExchangeParams {
  supabase: SupabaseClient
  traceContext: TraceContext
  activityId?: number
  enterpriseId?: string
  workspaceId?: string
  startingStepOrder: number
  agentName?: string
  prompt: string
  response: string
  model: string
  promptTokens?: number
  completionTokens?: number
  totalDurationMs?: number
  policyDigest?: string
}

export interface ObservabilityContext {
  supabase: SupabaseClient
  traceContext: TraceContext
  activityId?: number
  enterpriseId?: string
  workspaceId?: string
  agentName?: string
  policyDigest?: string
  stepCounter: number
}

// =============================================================================
// HASH COMPUTATION
// =============================================================================

/**
 * Compute SHA-256 hash of content for tamper-evident audit trail
 */
export async function computeContentHash(content: unknown): Promise<string> {
  const contentString = JSON.stringify(content, Object.keys(content as object).sort())
  const encoder = new TextEncoder()
  const data = encoder.encode(contentString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// =============================================================================
// CORE LOGGING FUNCTIONS
// =============================================================================

/**
 * Log a single agent reasoning step
 * 
 * This is the atomic unit of observability logging. Each step captures:
 * - What happened (step_type)
 * - In what order (step_order)  
 * - The content/context
 * - How long it took
 * - Which policy governed it
 */
export async function logAgentStep(params: LogStepParams): Promise<{ id: string; spanId: string } | null> {
  const {
    supabase,
    traceContext,
    activityId,
    enterpriseId,
    workspaceId,
    stepType,
    stepOrder,
    agentName,
    content,
    durationMs,
    tokenCount,
    modelUsed,
    policyDigest
  } = params

  try {
    // Generate unique span ID for this step
    const stepSpanId = generateSpanId()
    
    // Compute content hash for tamper detection
    const contentHash = await computeContentHash(content)

    const { data, error } = await supabase
      .from('agent_reasoning_steps')
      .insert({
        activity_id: activityId || null,
        enterprise_id: enterpriseId || null,
        workspace_id: workspaceId || null,
        trace_id: traceContext.traceId,
        span_id: stepSpanId,
        parent_span_id: traceContext.spanId,
        step_type: stepType,
        step_order: stepOrder,
        agent_name: agentName || null,
        content_hash: contentHash,
        content: content,
        duration_ms: durationMs || null,
        token_count: tokenCount || null,
        model_used: modelUsed || null,
        policy_digest: policyDigest || traceContext.policyDigest || null
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[observability] Failed to log agent step:', error.message)
      return null
    }

    return { id: data.id, spanId: stepSpanId }
  } catch (err) {
    console.error('[observability] Exception logging agent step:', err)
    return null
  }
}

/**
 * Log a tool call with its arguments and result
 * 
 * Creates two linked steps:
 * 1. tool_call - The invocation with arguments
 * 2. tool_response - The result (or error)
 */
export async function logToolCall(params: ToolCallParams): Promise<{ callId: string; responseId: string } | null> {
  const {
    supabase,
    traceContext,
    activityId,
    enterpriseId,
    workspaceId,
    stepOrder,
    agentName,
    toolName,
    toolArgs,
    toolResult,
    durationMs,
    policyDigest,
    error
  } = params

  try {
    // Log the tool call
    const callResult = await logAgentStep({
      supabase,
      traceContext,
      activityId,
      enterpriseId,
      workspaceId,
      stepType: 'tool_call',
      stepOrder,
      agentName,
      content: {
        role: 'tool',
        tool_name: toolName,
        tool_args: toolArgs
      },
      policyDigest
    })

    if (!callResult) return null

    // Log the tool response
    const responseResult = await logAgentStep({
      supabase,
      traceContext,
      activityId,
      enterpriseId,
      workspaceId,
      stepType: error ? 'error' : 'tool_response',
      stepOrder: stepOrder + 1,
      agentName,
      content: {
        role: 'tool',
        tool_name: toolName,
        tool_result: toolResult,
        error: error || undefined
      },
      durationMs,
      policyDigest
    })

    if (!responseResult) return null

    return { callId: callResult.id, responseId: responseResult.id }
  } catch (err) {
    console.error('[observability] Exception logging tool call:', err)
    return null
  }
}

/**
 * Log a full prompt-response exchange with an LLM
 * 
 * Creates two linked steps:
 * 1. prompt - The user/system prompt sent to the model
 * 2. final_response - The model's response
 */
export async function logPromptExchange(params: PromptExchangeParams): Promise<{ promptId: string; responseId: string } | null> {
  const {
    supabase,
    traceContext,
    activityId,
    enterpriseId,
    workspaceId,
    startingStepOrder,
    agentName,
    prompt,
    response,
    model,
    promptTokens,
    completionTokens,
    totalDurationMs,
    policyDigest
  } = params

  try {
    // Log the prompt
    const promptResult = await logAgentStep({
      supabase,
      traceContext,
      activityId,
      enterpriseId,
      workspaceId,
      stepType: 'prompt',
      stepOrder: startingStepOrder,
      agentName,
      content: {
        role: 'user',
        text: prompt,
        tokens: promptTokens
      },
      tokenCount: promptTokens,
      modelUsed: model,
      policyDigest
    })

    if (!promptResult) return null

    // Log the response
    const responseResult = await logAgentStep({
      supabase,
      traceContext,
      activityId,
      enterpriseId,
      workspaceId,
      stepType: 'final_response',
      stepOrder: startingStepOrder + 1,
      agentName,
      content: {
        role: 'assistant',
        text: response,
        tokens: completionTokens,
        model: model
      },
      tokenCount: completionTokens,
      modelUsed: model,
      durationMs: totalDurationMs,
      policyDigest
    })

    if (!responseResult) return null

    return { promptId: promptResult.id, responseId: responseResult.id }
  } catch (err) {
    console.error('[observability] Exception logging prompt exchange:', err)
    return null
  }
}

/**
 * Log intermediate reasoning/thought step
 */
export async function logReasoningStep(
  supabase: SupabaseClient,
  traceContext: TraceContext,
  stepOrder: number,
  reasoning: string,
  agentName?: string,
  activityId?: number,
  enterpriseId?: string,
  workspaceId?: string,
  policyDigest?: string
): Promise<{ id: string } | null> {
  return logAgentStep({
    supabase,
    traceContext,
    activityId,
    enterpriseId,
    workspaceId,
    stepType: 'reasoning',
    stepOrder,
    agentName,
    content: {
      role: 'assistant',
      text: reasoning,
      metadata: { type: 'intermediate_thought' }
    },
    policyDigest
  })
}

/**
 * Log an error that occurred during agent processing
 */
export async function logAgentError(
  supabase: SupabaseClient,
  traceContext: TraceContext,
  stepOrder: number,
  error: Error | string,
  agentName?: string,
  activityId?: number,
  enterpriseId?: string,
  workspaceId?: string,
  policyDigest?: string
): Promise<{ id: string } | null> {
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined

  return logAgentStep({
    supabase,
    traceContext,
    activityId,
    enterpriseId,
    workspaceId,
    stepType: 'error',
    stepOrder,
    agentName,
    content: {
      error: errorMessage,
      metadata: {
        stack: errorStack,
        timestamp: new Date().toISOString()
      }
    },
    policyDigest
  })
}

// =============================================================================
// OBSERVABILITY CONTEXT HELPER
// =============================================================================

/**
 * Create an observability context for tracking steps within an agent session
 * 
 * Usage:
 * ```typescript
 * const obsCtx = createObservabilityContext(supabase, traceContext, { agentName: 'policy' })
 * await obsCtx.logPrompt(userPrompt)
 * await obsCtx.logReasoning('Evaluating policy rules...')
 * await obsCtx.logToolCall('checkPolicy', args, result, durationMs)
 * await obsCtx.logResponse(finalResponse)
 * ```
 */
export function createObservabilityContext(
  supabase: SupabaseClient,
  traceContext: TraceContext,
  options: {
    activityId?: number
    enterpriseId?: string
    workspaceId?: string
    agentName?: string
    policyDigest?: string
  } = {}
): {
  context: ObservabilityContext
  logPrompt: (prompt: string, model?: string, tokens?: number) => Promise<{ id: string } | null>
  logReasoning: (reasoning: string) => Promise<{ id: string } | null>
  logToolCall: (toolName: string, args: Record<string, unknown>, result?: unknown, durationMs?: number, error?: string) => Promise<{ callId: string; responseId: string } | null>
  logResponse: (response: string, model?: string, tokens?: number, durationMs?: number) => Promise<{ id: string } | null>
  logError: (error: Error | string) => Promise<{ id: string } | null>
  getStepCount: () => number
} {
  const context: ObservabilityContext = {
    supabase,
    traceContext,
    activityId: options.activityId,
    enterpriseId: options.enterpriseId,
    workspaceId: options.workspaceId,
    agentName: options.agentName,
    policyDigest: options.policyDigest,
    stepCounter: 0
  }

  return {
    context,
    
    async logPrompt(prompt: string, model?: string, tokens?: number) {
      const stepOrder = context.stepCounter++
      return logAgentStep({
        supabase: context.supabase,
        traceContext: context.traceContext,
        activityId: context.activityId,
        enterpriseId: context.enterpriseId,
        workspaceId: context.workspaceId,
        stepType: 'prompt',
        stepOrder,
        agentName: context.agentName,
        content: { role: 'user', text: prompt, tokens },
        tokenCount: tokens,
        modelUsed: model,
        policyDigest: context.policyDigest
      })
    },

    async logReasoning(reasoning: string) {
      const stepOrder = context.stepCounter++
      return logReasoningStep(
        context.supabase,
        context.traceContext,
        stepOrder,
        reasoning,
        context.agentName,
        context.activityId,
        context.enterpriseId,
        context.workspaceId,
        context.policyDigest
      )
    },

    async logToolCall(toolName: string, args: Record<string, unknown>, result?: unknown, durationMs?: number, error?: string) {
      const stepOrder = context.stepCounter
      context.stepCounter += 2 // tool_call + tool_response
      return logToolCall({
        supabase: context.supabase,
        traceContext: context.traceContext,
        activityId: context.activityId,
        enterpriseId: context.enterpriseId,
        workspaceId: context.workspaceId,
        stepOrder,
        agentName: context.agentName,
        toolName,
        toolArgs: args,
        toolResult: result,
        durationMs,
        policyDigest: context.policyDigest,
        error
      })
    },

    async logResponse(response: string, model?: string, tokens?: number, durationMs?: number) {
      const stepOrder = context.stepCounter++
      return logAgentStep({
        supabase: context.supabase,
        traceContext: context.traceContext,
        activityId: context.activityId,
        enterpriseId: context.enterpriseId,
        workspaceId: context.workspaceId,
        stepType: 'final_response',
        stepOrder,
        agentName: context.agentName,
        content: { role: 'assistant', text: response, tokens, model },
        tokenCount: tokens,
        modelUsed: model,
        durationMs,
        policyDigest: context.policyDigest
      })
    },

    async logError(error: Error | string) {
      const stepOrder = context.stepCounter++
      return logAgentError(
        context.supabase,
        context.traceContext,
        stepOrder,
        error,
        context.agentName,
        context.activityId,
        context.enterpriseId,
        context.workspaceId,
        context.policyDigest
      )
    },

    getStepCount() {
      return context.stepCounter
    }
  }
}

// =============================================================================
// BATCH LOGGING FOR PERFORMANCE
// =============================================================================

/**
 * Batch insert multiple reasoning steps for better performance
 * Use when you have multiple steps to log at once (e.g., replaying a conversation)
 */
export async function batchLogSteps(
  supabase: SupabaseClient,
  steps: Array<{
    traceContext: TraceContext
    activityId?: number
    enterpriseId?: string
    workspaceId?: string
    stepType: StepType
    stepOrder: number
    agentName?: string
    content: ReasoningStepContent
    durationMs?: number
    tokenCount?: number
    modelUsed?: string
    policyDigest?: string
  }>
): Promise<{ insertedCount: number; failedCount: number }> {
  try {
    // Prepare all records with computed hashes
    const records = await Promise.all(
      steps.map(async (step) => {
        const contentHash = await computeContentHash(step.content)
        const stepSpanId = generateSpanId()
        
        return {
          activity_id: step.activityId || null,
          enterprise_id: step.enterpriseId || null,
          workspace_id: step.workspaceId || null,
          trace_id: step.traceContext.traceId,
          span_id: stepSpanId,
          parent_span_id: step.traceContext.spanId,
          step_type: step.stepType,
          step_order: step.stepOrder,
          agent_name: step.agentName || null,
          content_hash: contentHash,
          content: step.content,
          duration_ms: step.durationMs || null,
          token_count: step.tokenCount || null,
          model_used: step.modelUsed || null,
          policy_digest: step.policyDigest || step.traceContext.policyDigest || null
        }
      })
    )

    const { data, error } = await supabase
      .from('agent_reasoning_steps')
      .insert(records)
      .select('id')

    if (error) {
      console.error('[observability] Batch insert failed:', error.message)
      return { insertedCount: 0, failedCount: steps.length }
    }

    return { insertedCount: data?.length || 0, failedCount: steps.length - (data?.length || 0) }
  } catch (err) {
    console.error('[observability] Exception in batch log:', err)
    return { insertedCount: 0, failedCount: steps.length }
  }
}

