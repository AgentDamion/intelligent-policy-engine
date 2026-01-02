import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"
import { encode as hexEncode } from "https://deno.land/std@0.177.0/encoding/hex.ts"
import { agentRegistry } from './cursor-agent-registry.ts'
import { scrubPII } from './utils/privacy-scrubber.ts'
import {
  resolveActivePolicyDigest,
  extractTraceContext,
  createTraceHeaders,
  buildAuditContext,
  generateSpanId,
  type PolicyDigestContext,
  type TraceContext,
  type AuditContext
} from '../_shared/policy-digest.ts'
import { createObservabilityContext } from '../_shared/observability-logger.ts'

/**
 * Generates a non-repudiable hash for an audit entry
 * Chaining it to the previous known entry.
 */
async function generateAuditHash(payload: any, previousHash: string | null): Promise<string> {
  const data = JSON.stringify({
    payload,
    previousHash,
    salt: Deno.env.get("AUDIT_SALT") || "pharma-integrity-2025"
  });
  
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-enterprise-id, traceparent, tracestate',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // 1. Extract trace context from incoming request headers
    const traceContext = extractTraceContext(req.headers)
    const currentSpanId = generateSpanId() // New span for this operation
    
    console.log(`🔍 Trace context: traceId=${traceContext.traceId}, spanId=${currentSpanId}`)

    // Initialize Supabase client for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
        const body = await req.json()
    const { agentName, action, input, context, enterprise_id, organization_id, workspace_id } = body

    
    // Validate required fields
    if (!agentName || !action || !input) {
            return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: agentName, action, input'
      }), { status: 400, headers: corsHeaders })
    }

    // Get tenant context
    const tenantId = enterprise_id || organization_id
    if (!tenantId) {
            return new Response(JSON.stringify({
        success: false,
        error: 'Missing tenant context: enterprise_id or organization_id required'
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`🤖 Processing ${agentName} agent request for tenant: ${tenantId}`)
    
    // 2. Resolve active policy digest for this enterprise/workspace
    let policyContext: PolicyDigestContext | null = null
        try {
      policyContext = await resolveActivePolicyDigest(supabase, tenantId, workspace_id)
            if (policyContext) {
        console.log(`📋 Active policy digest: ${policyContext.digest.slice(0, 20)}...`)
      } else {
        console.log(`⚠️ No active policy digest for enterprise ${tenantId}`)
      }
    } catch (policyError) {
            console.warn('⚠️ Failed to resolve policy digest:', policyError)
      // Continue without policy context - non-blocking
    }

    // Build audit context for database inserts
    const auditContext: AuditContext = buildAuditContext(
      policyContext,
      { ...traceContext, spanId: currentSpanId },
      tenantId,
      workspace_id
    )

    // Get the actual Cursor agent from registry
        const agent = agentRegistry.getAgent(agentName)
        if (!agent) {
      return new Response(JSON.stringify({
        success: false,
        error: `Agent '${agentName}' not found. Available agents: ${Object.keys(agentRegistry).join(', ')}`
      }), { status: 404, headers: corsHeaders })
    }

    // 3. Prepare enhanced context for the agent with policy and trace context
    const enhancedTraceContext: TraceContext = {
      traceId: traceContext.traceId,
      spanId: currentSpanId,
      traceState: traceContext.traceState,
      policyDigest: policyContext?.digest || null
    }

    // Create observability context for structured logging
        const obsContext = createObservabilityContext(supabase, enhancedTraceContext, {
      enterpriseId: tenantId,
      workspaceId: workspace_id || undefined,
      agentName: agentName,
      policyDigest: policyContext?.digest || undefined
    })
    
    const requestId = crypto.randomUUID()
    
    // Step 1: PII/PHI Masking (Pharma-grade privacy)
    const { scrubbedText, metadata: privacyMetadata } = scrubPII(
      typeof input === 'string' ? input : JSON.stringify(input)
    )
    const operationalInput = typeof input === 'string' ? scrubbedText : JSON.parse(scrubbedText)

    const enhancedContext = {
      ...context,
      tenantId,
      enterprise_id: tenantId,
      organization_id: tenantId,
      workspace_id: workspace_id || null,
      timestamp: new Date().toISOString(),
      requestId: requestId,
      supabase, // Pass Supabase client for database operations
      // Privacy metadata
      _privacy: privacyMetadata,
      // Policy context for agent use
      _policyContext: policyContext,
      _traceContext: enhancedTraceContext,
      // Pass observability context to agents for step logging
      _observability: obsContext
    }
    
    // Log the incoming prompt/input
        try {
      await obsContext.logPrompt(
        typeof operationalInput === 'string' ? operationalInput : JSON.stringify(operationalInput),
        undefined,
        undefined
      )
          } catch (logPromptError) {
            console.warn('⚠️ Failed to log prompt:', logPromptError)
    }

    // Execute agent processing
    let result
    let agentSuccess = true
    let agentError: Error | null = null
    const agentStartTime = Date.now()
        try {
      result = await agent.process(operationalInput, enhancedContext)
            console.log(`✅ Agent ${agentName} completed successfully`)
      
      // Log successful response
      const agentDuration = Date.now() - agentStartTime
            try {
        await obsContext.logResponse(
          typeof result === 'string' ? result : JSON.stringify(result),
          undefined,
          undefined,
          agentDuration
        )
              } catch (logResponseError) {
                console.warn('⚠️ Failed to log response:', logResponseError)
      }
    } catch (err) {
      agentSuccess = false
      agentError = err as Error
            console.error(`❌ Agent ${agentName} failed:`, err)
      
      // Log the error
            try {
        await obsContext.logError(agentError)
              } catch (logErrorError) {
                console.warn('⚠️ Failed to log error:', logErrorError)
      }
    }

    // 4. Log agent activity with policy digest, trace context, and observability metadata
    const processingDurationMs = Date.now() - startTime
    const observabilityStepCount = obsContext.getStepCount()
    
    // Step 2: Immutable Audit Chaining (Pharma-grade non-repudiation)
    let previousHash: string | null = null
    try {
      const { data: lastActivity } = await supabase
        .from('agent_activities')
        .select('ledger_hash')
        .eq('enterprise_id', tenantId)
        .order('id', { ascending: false })
        .limit(1)
        .single()
      
      previousHash = lastActivity?.ledger_hash || null
    } catch (err) {
      console.warn('⚠️ Failed to fetch previous audit hash, starting new chain')
    }

    let activityId: number | undefined
        try {
      const activityPayload = {
        agent: agentName,
        action: action,
        enterprise_id: tenantId,
        workspace_id: workspace_id || null,
        details: {
          input: operationalInput,
          output: agentSuccess ? result : null,
          error: agentError?.message || null,
          reasoning_summary: agentSuccess && result?.reasoning ? result.reasoning : null,
          intermediate_steps_count: observabilityStepCount,
          processing_time_ms: processingDurationMs,
          observability: {
            trace_id: traceContext.traceId,
            span_id: currentSpanId,
            steps_logged: observabilityStepCount
          }
        },
        status: agentSuccess ? 'success' : 'error',
        policy_digest: auditContext.policyDigest,
        trace_id: auditContext.traceId,
        span_id: auditContext.spanId,
        created_at: new Date().toISOString()
      };

      const ledger_hash = await generateAuditHash(activityPayload, previousHash)

      const { data: activityData, error: insertError } = await supabase
        .from('agent_activities')
        .insert({ ...activityPayload, ledger_hash })
        .select('id')
      
      if (insertError) {
                // Don't throw - continue processing even if logging fails
      } else if (!activityData || activityData.length === 0) {
        // Handle case where insert succeeds but returns no data (shouldn't happen, but be defensive)
              } else {
        activityId = activityData[0]?.id
      }
          } catch (logError) {
            console.warn('⚠️ Failed to log agent activity:', logError)
    }

    // 5. If this was a decision-making agent, log the decision with policy context
    if (agentSuccess && result?.decision) {
      try {
        await supabase.from('ai_agent_decisions').insert({
          agent: agentName,
          action: action,
          outcome: result.decision.outcome || result.decision.type || result.decision.decision,
          risk: result.decision.riskLevel || result.decision.risk || 'low',
          enterprise_id: tenantId,
          details: result.decision,
          // Policy digest fields
          policy_digest: auditContext.policyDigest,
          policy_artifact_reference: auditContext.policyArtifactReference,
          // NEW: Rationale fields for audit compliance
          rationale_human: result.rationale_human || null,
          rationale_structured: result.rationale_structured || {},
          created_at: new Date().toISOString()
        })
      } catch (decisionError) {
        console.warn('⚠️ Failed to log agent decision:', decisionError)
      }
    }

    // Return error response if agent failed
    if (!agentSuccess) {
            return new Response(JSON.stringify({
        success: false,
        error: `Agent processing failed: ${agentError?.message}`,
        agent: agentName,
        action,
        requestId: requestId,
        metadata: {
          traceId: traceContext.traceId,
          spanId: currentSpanId,
          policyDigest: policyContext?.digest || null
        }
      }), { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'x-trace-id': traceContext.traceId,
          'x-policy-digest': policyContext?.digest || '',
          'x-request-id': requestId
        }
      })
    }

    // 6. Build response with policy and trace metadata
    const processingTimeMs = Date.now() - startTime
        
    // Create trace headers for downstream correlation
    const outgoingTraceHeaders = createTraceHeaders(
      { ...traceContext, spanId: currentSpanId },
      policyContext?.digest
    )

    return new Response(JSON.stringify({
      success: true,
      agent: agentName,
      action,
      result,
      metadata: {
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTimeMs,
        // Policy context in response
        policyDigest: policyContext?.digest || null,
        policyReference: policyContext?.fullReference || null,
        // Trace context
        traceId: traceContext.traceId,
        spanId: currentSpanId
      }
    }), { 
      headers: {
        ...corsHeaders,
        // Include trace headers in response
        'x-trace-id': traceContext.traceId,
        'x-policy-digest': policyContext?.digest || '',
        ...outgoingTraceHeaders
      }
    })

  } catch (error) {
        console.error('🚨 Cursor Agent Adapter error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorType: error instanceof Error ? error.name : 'Unknown',
      requestId: null,
      debug: {
        message: 'Check Supabase function logs for detailed debugging information',
        location: 'cursor-agent-adapter/index.ts:421',
        stack: errorStack ? errorStack.split('\n').slice(0, 5).join('\n') : undefined
      }
    }), { status: 500, headers: corsHeaders })
  }
})
