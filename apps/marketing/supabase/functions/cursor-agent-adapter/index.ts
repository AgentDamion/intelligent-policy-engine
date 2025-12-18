import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { agentRegistry } from './cursor-agent-registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-enterprise-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body = await req.json()
    const { agentName, action, input, context, enterprise_id, organization_id } = body

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

    // Get the actual Cursor agent from registry
    const agent = agentRegistry.getAgent(agentName)
    if (!agent) {
      return new Response(JSON.stringify({
        success: false,
        error: `Agent '${agentName}' not found. Available agents: ${Object.keys(agentRegistry).join(', ')}`
      }), { status: 404, headers: corsHeaders })
    }

    // Prepare enhanced context for the agent
    const enhancedContext = {
      ...context,
      tenantId,
      enterprise_id: tenantId,
      organization_id: tenantId,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      supabase // Pass Supabase client for database operations
    }

    // Execute agent processing
    let result
    try {
      result = await agent.process(input, enhancedContext)
      console.log(`✅ Agent ${agentName} completed successfully`)
    } catch (agentError) {
      console.error(`❌ Agent ${agentName} failed:`, agentError)
      return new Response(JSON.stringify({
        success: false,
        error: `Agent processing failed: ${agentError.message}`,
        agent: agentName,
        action
      }), { status: 500, headers: corsHeaders })
    }

    // Log agent activity for audit trail
    try {
      await supabase.from('agent_activities').insert({
        agent_name: agentName,
        action: action,
        tenant_id: tenantId,
        input_data: input,
        output_data: result,
        status: 'completed',
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.warn('⚠️ Failed to log agent activity:', logError)
    }

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      agent: agentName,
      action,
      result,
      metadata: {
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - new Date(enhancedContext.timestamp).getTime()
      }
    }), { headers: corsHeaders })

  } catch (error) {
    console.error('🚨 Cursor Agent Adapter error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { status: 500, headers: corsHeaders })
  }
})
