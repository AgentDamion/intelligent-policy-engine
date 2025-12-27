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
    // #region agent log
    const log1 = {type:'debug-log',location:'cursor-agent-adapter/index.ts:46',message:'Parsing request body',data:{method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(log1)}).catch(()=>{});
    console.log(JSON.stringify(log1));
    // #endregion
    const body = await req.json()
    const { agentName, action, input, context, enterprise_id, organization_id, workspace_id } = body

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:48',message:'Request body parsed',data:{agentName,action:!!action,inputType:typeof input,hasEnterpriseId:!!enterprise_id,hasOrgId:!!organization_id,hasWorkspaceId:!!workspace_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Validate required fields
    if (!agentName || !action || !input) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:52',message:'Validation failed - missing required fields',data:{hasAgentName:!!agentName,hasAction:!!action,hasInput:!!input},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: agentName, action, input'
      }), { status: 400, headers: corsHeaders })
    }

    // Get tenant context
    const tenantId = enterprise_id || organization_id
    if (!tenantId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:60',message:'Validation failed - missing tenant context',data:{hasEnterpriseId:!!enterprise_id,hasOrgId:!!organization_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing tenant context: enterprise_id or organization_id required'
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`🤖 Processing ${agentName} agent request for tenant: ${tenantId}`)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:66',message:'Request validated successfully',data:{agentName,tenantId,workspaceId:workspace_id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion

    // 2. Resolve active policy digest for this enterprise/workspace
    let policyContext: PolicyDigestContext | null = null
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:70',message:'Before policy digest resolution',data:{tenantId,workspaceId:workspace_id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      policyContext = await resolveActivePolicyDigest(supabase, tenantId, workspace_id)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:73',message:'Policy digest resolution completed',data:{hasPolicyContext:!!policyContext,digest:policyContext?.digest?.slice(0,20)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (policyContext) {
        console.log(`📋 Active policy digest: ${policyContext.digest.slice(0, 20)}...`)
      } else {
        console.log(`⚠️ No active policy digest for enterprise ${tenantId}`)
      }
    } catch (policyError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:78',message:'Policy digest resolution failed',data:{error:policyError instanceof Error?policyError.message:String(policyError),errorStack:policyError instanceof Error?policyError.stack:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:91',message:'Looking up agent in registry',data:{agentName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const agent = agentRegistry.getAgent(agentName)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:93',message:'Agent lookup result',data:{agentFound:!!agent,agentName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:108',message:'Creating observability context',data:{agentName,tenantId,hasPolicyDigest:!!policyContext?.digest},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const obsContext = createObservabilityContext(supabase, enhancedTraceContext, {
      enterpriseId: tenantId,
      workspaceId: workspace_id || undefined,
      agentName: agentName,
      policyDigest: policyContext?.digest || undefined
    })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:115',message:'Observability context created',data:{hasObsContext:!!obsContext},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:129',message:'Enhanced context created',data:{requestId, piiScrubbed: privacyMetadata.scrubbed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion

    // Log the incoming prompt/input
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:132',message:'Before logPrompt call',data:{inputType:typeof operationalInput,requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      await obsContext.logPrompt(
        typeof operationalInput === 'string' ? operationalInput : JSON.stringify(operationalInput),
        undefined,
        undefined
      )
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:137',message:'logPrompt completed successfully',data:{requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (logPromptError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:140',message:'logPrompt failed',data:{error:logPromptError instanceof Error?logPromptError.message:String(logPromptError),requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.warn('⚠️ Failed to log prompt:', logPromptError)
    }

    // Execute agent processing
    let result
    let agentSuccess = true
    let agentError: Error | null = null
    const agentStartTime = Date.now()
    // #region agent log
    const logBeforeProcess = {type:'debug-log',location:'cursor-agent-adapter/index.ts:198',message:'Before agent.process call',data:{agentName,requestId,inputType:typeof operationalInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logBeforeProcess)}).catch(()=>{});
    console.log(JSON.stringify(logBeforeProcess));
    // #endregion
    try {
      result = await agent.process(operationalInput, enhancedContext)
      // #region agent log
      const logAfterProcess = {type:'debug-log',location:'cursor-agent-adapter/index.ts:203',message:'agent.process completed',data:{agentName,requestId,resultType:typeof result,hasResult:!!result,agentDuration:Date.now()-agentStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAfterProcess)}).catch(()=>{});
      console.log(JSON.stringify(logAfterProcess));
      // #endregion
      console.log(`✅ Agent ${agentName} completed successfully`)
      
      // Log successful response
      const agentDuration = Date.now() - agentStartTime
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:151',message:'Before logResponse call',data:{requestId,agentDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        await obsContext.logResponse(
          typeof result === 'string' ? result : JSON.stringify(result),
          undefined,
          undefined,
          agentDuration
        )
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:157',message:'logResponse completed successfully',data:{requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (logResponseError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:160',message:'logResponse failed',data:{error:logResponseError instanceof Error?logResponseError.message:String(logResponseError),requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.warn('⚠️ Failed to log response:', logResponseError)
      }
    } catch (err) {
      agentSuccess = false
      agentError = err as Error
      // #region agent log
      const logProcessError = {type:'debug-log',location:'cursor-agent-adapter/index.ts:232',message:'agent.process threw error',data:{agentName,requestId,error:agentError.message,errorStack:agentError.stack,agentDuration:Date.now()-agentStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logProcessError)}).catch(()=>{});
      console.log(JSON.stringify(logProcessError));
      // #endregion
      console.error(`❌ Agent ${agentName} failed:`, err)
      
      // Log the error
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:170',message:'Before logError call',data:{requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        await obsContext.logError(agentError)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:173',message:'logError completed successfully',data:{requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (logErrorError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:176',message:'logError failed',data:{error:logErrorError instanceof Error?logErrorError.message:String(logErrorError),requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
    // #region agent log
    const logBeforeInsert = {type:'debug-log',location:'cursor-agent-adapter/index.ts:267',message:'Before agent_activities insert',data:{requestId,agentSuccess,observabilityStepCount,processingDurationMs},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logBeforeInsert)}).catch(()=>{});
    console.log(JSON.stringify(logBeforeInsert));
    // #endregion
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
        // #region agent log
        const logInsertError = {type:'debug-log',location:'cursor-agent-adapter/index.ts:304',message:'agent_activities insert returned error',data:{requestId,error:insertError.message,errorCode:insertError.code,errorDetails:insertError.details,errorHint:insertError.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
        fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logInsertError)}).catch(()=>{});
        console.log(JSON.stringify(logInsertError));
        console.error('Database insert error details:', JSON.stringify(insertError, null, 2));
        // #endregion
        // Don't throw - continue processing even if logging fails
      } else if (!activityData || activityData.length === 0) {
        // Handle case where insert succeeds but returns no data (shouldn't happen, but be defensive)
        // #region agent log
        const logNoData = {type:'debug-log',location:'cursor-agent-adapter/index.ts:315',message:'agent_activities insert succeeded but returned no data',data:{requestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
        console.log(JSON.stringify(logNoData));
        // #endregion
      } else {
        activityId = activityData[0]?.id
      }
      // #region agent log
      const logInsertSuccess = {type:'debug-log',location:'cursor-agent-adapter/index.ts:308',message:'agent_activities insert completed',data:{requestId,activityId,hasActivityId:!!activityId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logInsertSuccess)}).catch(()=>{});
      console.log(JSON.stringify(logInsertSuccess));
      // #endregion
    } catch (logError) {
      // #region agent log
      const logInsertFailure = {type:'debug-log',location:'cursor-agent-adapter/index.ts:313',message:'agent_activities insert failed with exception',data:{requestId,error:logError instanceof Error?logError.message:String(logError),errorStack:logError instanceof Error?logError.stack:null,errorName:logError instanceof Error?logError.name:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logInsertFailure)}).catch(()=>{});
      console.log(JSON.stringify(logInsertFailure));
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:223',message:'Returning error response',data:{requestId,agentName,errorMessage:agentError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      console.log(JSON.stringify({type:'debug-log',location:'cursor-agent-adapter/index.ts:223',message:'Returning error response',data:{requestId,agentName,errorMessage:agentError?.message,errorStack:agentError?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}));
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cursor-agent-adapter/index.ts:245',message:'Building success response',data:{requestId,agentName,processingTimeMs},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
    // #region agent log
    const errorLog = {type:'debug-log',location:'cursor-agent-adapter/index.ts:421',message:'Top-level catch block - unhandled error',data:{error:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:null,errorName:error instanceof Error?error.name:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'};
    fetch('http://127.0.0.1:7242/ingest/9dccd22d-157a-44c7-9b2b-b36726d3c916',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(errorLog)}).catch(()=>{});
    console.log(JSON.stringify(errorLog));
    // #endregion
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
