/**
 * Cursor Agent Adapter - Supabase Edge Function
 * Implements the cursor-agent-adapter mentioned in the analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import the Cursor AI Agent (we'll need to adapt this for Deno)
const { CursorAIAgent } = await import('../../agents/cursor-ai-agent.js')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const { agentName, action, input, context, enterprise_id, organization_id } = await req.json()
    
    // Get tenant context
    const tenantId = enterprise_id || organization_id || 'default'
    
    // Get the actual Cursor agent from registry
    const agent = new CursorAIAgent()
    
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

    let result;
    
    // Route to appropriate agent method
    if (action === 'analyze_document') {
      result = await agent.analyzeDocument(input, tenantId)
    } else if (action === 'process_rfp') {
      result = await agent.processRFPQuestion(input, tenantId, context?.user_id)
    } else if (action === 'test_system') {
      result = await agent.testSystem()
    } else if (action === 'get_status') {
      result = await agent.getAgentStatus()
    } else {
      // Generic agent processing
      result = await agent.analyzeDocument(input, tenantId)
    }
    
    // Log agent activity for audit trail
    await supabase.from('agent_activities').insert({
      agent_name: agentName || 'cursor-ai',
      action: action,
      tenant_id: tenantId,
      input_data: input,
      output_data: result,
      status: 'completed',
      created_at: new Date().toISOString()
    })

    // Log AI agent decision if it's a decision result
    if (result.decision) {
      await supabase.from('ai_agent_decisions').insert({
        agent: agentName || 'cursor-ai',
        action: action,
        agency: tenantId,
        outcome: result.decision === 'APPROVED' ? 'approved' : 
                result.decision === 'REJECTED' ? 'rejected' : 'flagged',
        risk: result.confidence > 0.8 ? 'low' : 
              result.confidence > 0.5 ? 'medium' : 'high',
        enterprise_id: tenantId,
        details: result,
        created_at: new Date().toISOString()
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        metadata: {
          agent: agentName || 'cursor-ai',
          action,
          tenantId,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Cursor Agent Adapter Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
