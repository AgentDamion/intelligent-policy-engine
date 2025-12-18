// ============================================
// GOVERNANCE ACTION API
// ============================================
// Centralized API for all governance thread actions
// Enforces: actor attribution, state capture, audit generation
// Implements: Action Catalog surface/role/state guardrails

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  validateActionEnvelope,
  isFinalDecisionAction,
  type ActionEnvelope,
  type ActionType,
  type Surface,
  type Role,
  type ThreadStatus,
} from './validators.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-enterprise-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
}

type ActorType = 'human' | 'agent' | 'system'

// Legacy request format (backward compatible)
interface LegacyActionRequest {
  action: string
  threadId: string
  rationale?: string
  actorType?: ActorType
  agentName?: string
  newStatus?: string
  metadata?: Record<string, unknown>
}

// New Action Catalog envelope format
interface EnvelopeActionRequest {
  idempotency_key: string
  action_type: ActionType
  thread_id: string
  actor: {
    type: ActorType
    user_id?: string
    role: Role
  }
  context: {
    surface: Surface
    mode?: string
    client: string
  }
  payload?: Record<string, unknown>
  rationale?: string
}

interface GovernanceActionResponse {
  success: boolean
  actionId?: string
  threadId?: string
  newStatus?: string
  error?: string
  code?: string
}

/**
 * Detect if request is using new envelope format or legacy format
 */
function isEnvelopeFormat(body: Record<string, unknown>): body is EnvelopeActionRequest {
  return 'action_type' in body && 'actor' in body && 'context' in body
}

/**
 * Convert legacy request to envelope format
 */
function legacyToEnvelope(
  legacy: LegacyActionRequest, 
  userId: string | null
): ActionEnvelope {
  return {
    idempotency_key: crypto.randomUUID(),
    action_type: legacy.action as ActionType,
    thread_id: legacy.threadId,
    actor: {
      type: legacy.actorType || 'human',
      user_id: userId || undefined,
      role: legacy.actorType === 'agent' ? 'agent' : 
            legacy.actorType === 'system' ? 'system' : 'reviewer', // Default to reviewer for humans
    },
    context: {
      surface: 'Inbox', // Default to Inbox for legacy requests
      client: 'web',
    },
    payload: legacy.metadata || {},
    rationale: legacy.rationale,
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with proper env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    }

    // Parse request body
    const rawBody = await req.json()
    console.log('[governance-action] Received body:', JSON.stringify(rawBody))
    
    // Detect format and normalize to envelope
    let envelope: ActionEnvelope
    let agentName: string | null = null
    let newStatusOverride: string | null = null
    
    if (isEnvelopeFormat(rawBody)) {
      // New envelope format
      envelope = rawBody as ActionEnvelope
      console.log('[governance-action] Using envelope format')
    } else {
      // Legacy format - convert to envelope
      const legacy = rawBody as LegacyActionRequest
      envelope = legacyToEnvelope(legacy, userId)
      agentName = legacy.agentName || null
      newStatusOverride = legacy.newStatus || null
      console.log('[governance-action] Converted from legacy format')
    }

    // Validate required fields
    if (!envelope.action_type || !envelope.thread_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: action_type and thread_id are required',
          code: 'INVALID_PAYLOAD'
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get current thread status for state validation
    const cleanThreadId = String(envelope.thread_id).trim()
    const { data: thread, error: threadError } = await supabase
      .from('governance_threads')
      .select('status, enterprise_id')
      .eq('id', cleanThreadId)
      .single()

    if (threadError || !thread) {
      console.error('[governance-action] Thread not found:', cleanThreadId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Thread not found: ${cleanThreadId}`,
          code: 'NOT_FOUND'
        }),
        { status: 404, headers: corsHeaders }
      )
    }

    const currentStatus = thread.status as ThreadStatus

    // ============================================
    // ACTION CATALOG VALIDATION
    // ============================================
    
    const validationResult = validateActionEnvelope(envelope, currentStatus)
    
    if (!validationResult.valid) {
      console.warn('[governance-action] Validation failed:', validationResult)
      
      // Record denied action for audit trail
      await supabase.rpc('record_denied_action', {
        p_thread_id: cleanThreadId,
        p_action_type: envelope.action_type,
        p_actor_type: envelope.actor.type,
        p_actor_id: envelope.actor.type === 'human' ? (envelope.actor.user_id || userId) : null,
        p_actor_role: envelope.actor.role,
        p_surface: envelope.context.surface,
        p_mode: envelope.context.mode || null,
        p_denial_reason: validationResult.error,
        p_metadata: envelope.payload || {}
      })
      
      // Return 403 for surface violations (critical guardrail)
      const statusCode = validationResult.code === 'SURFACE_VIOLATION' ? 403 : 400
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: validationResult.error,
          code: validationResult.code
        }),
        { status: statusCode, headers: corsHeaders }
      )
    }

    // Extra check for final decisions from non-Decisions surface
    if (isFinalDecisionAction(envelope.action_type) && envelope.context.surface !== 'Decisions') {
      console.warn('[governance-action] Final decision attempted from non-Decisions surface')
      
      await supabase.rpc('record_denied_action', {
        p_thread_id: cleanThreadId,
        p_action_type: envelope.action_type,
        p_actor_type: envelope.actor.type,
        p_actor_id: envelope.actor.type === 'human' ? (envelope.actor.user_id || userId) : null,
        p_actor_role: envelope.actor.role,
        p_surface: envelope.context.surface,
        p_mode: envelope.context.mode || null,
        p_denial_reason: `Final decision action '${envelope.action_type}' is only allowed from 'Decisions' surface`,
        p_metadata: envelope.payload || {}
      })
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Final decision action '${envelope.action_type}' is only allowed from 'Decisions' surface`,
          code: 'SURFACE_VIOLATION'
        }),
        { status: 403, headers: corsHeaders }
      )
    }

    // ============================================
    // EXECUTE ACTION
    // ============================================
    
    console.log('[governance-action] Validation passed, recording action:', envelope.action_type)
    
    // Call the enhanced database function with full envelope
    const { data: actionId, error: actionError } = await supabase.rpc(
      'record_governance_action',
      {
        p_thread_id: cleanThreadId,
        p_action_type: envelope.action_type,
        p_actor_type: envelope.actor.type,
        p_actor_id: envelope.actor.type === 'human' ? (envelope.actor.user_id || userId) : null,
        p_agent_name: envelope.actor.type === 'agent' ? (agentName || envelope.actor.role) : null,
        p_rationale: envelope.rationale || null,
        p_new_status: newStatusOverride || null,
        p_metadata: envelope.payload || {},
        // New envelope fields
        p_idempotency_key: envelope.idempotency_key,
        p_actor_role: envelope.actor.role,
        p_surface: envelope.context.surface,
        p_mode: envelope.context.mode || null,
        p_client: envelope.context.client || 'web'
      }
    )

    if (actionError) {
      console.error('[governance-action] Error recording action:', actionError)
      const errorMessage = actionError.message || 'Failed to record action'
      const statusCode = errorMessage.includes('Thread not found') ? 404 : 500
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { status: statusCode, headers: corsHeaders }
      )
    }

    // Get updated thread status
    const { data: updatedThread } = await supabase
      .from('governance_threads')
      .select('status')
      .eq('id', cleanThreadId)
      .single()

    console.log(`[governance-action] Action recorded: ${envelope.action_type} on thread ${cleanThreadId} from ${envelope.context.surface} by ${envelope.actor.type} (${envelope.actor.role})`)

    const response: GovernanceActionResponse = {
      success: true,
      actionId: actionId,
      threadId: cleanThreadId,
      newStatus: updatedThread?.status || 'unknown'
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('[governance-action] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
