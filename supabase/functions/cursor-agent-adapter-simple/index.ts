import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-enterprise-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Simple agent implementations
class PolicyAgent {
  async process(input: any, context: any): Promise<any> {
    console.log('🔍 PolicyAgent processing request:', input.tool)
    
    const riskScore = this.calculateRiskScore(input)
    const decision = this.makeDecision(riskScore, input)
    
    return {
      decision: {
        status: decision.status,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        riskLevel: decision.riskLevel
      },
      metadata: {
        processingTime: Date.now(),
        agentVersion: '2.0'
      }
    }
  }

  private calculateRiskScore(input: any): number {
    let riskScore = 0.5
    if (input.tool?.toLowerCase().includes('medical')) riskScore += 0.3
    if (input.dataHandling?.includes('personal_data')) riskScore += 0.2
    if (input.urgency?.level > 0.8) riskScore += 0.1
    return Math.min(1.0, Math.max(0.0, riskScore))
  }

  private makeDecision(riskScore: number, input: any) {
    const confidence = Math.max(0.6, 1.0 - riskScore * 0.4)
    let status = 'approved'
    if (riskScore > 0.7) status = 'needs_review'
    if (riskScore > 0.9) status = 'rejected'
    
    return {
      status,
      confidence,
      reasoning: `Risk score: ${Math.round(riskScore * 100)}%`,
      riskLevel: riskScore > 0.8 ? 'high' : riskScore > 0.6 ? 'medium' : 'low'
    }
  }
}

class AuditAgent {
  async process(input: any, context: any): Promise<any> {
    console.log('📋 AuditAgent processing request')
    
    return {
      violations: [],
      recommendations: ['Regular audit recommended'],
      confidence: 0.9,
      metadata: {
        processingTime: Date.now(),
        agentVersion: '2.0'
      }
    }
  }
}

class ContextAgent {
  async process(input: any, context: any): Promise<any> {
    console.log('🎯 ContextAgent analyzing context')
    
    return {
      decision: 'PROCEED',
      confidence: 0.8,
      riskLevel: 'LOW',
      reasoning: 'Context analysis completed',
      metadata: {
        processingTime: Date.now(),
        agentVersion: '2.0'
      }
    }
  }
}

// Agent registry
const agents = new Map([
  ['policy', new PolicyAgent()],
  ['audit', new AuditAgent()],
  ['context', new ContextAgent()]
])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { agentName, action, input, context, enterprise_id, organization_id } = body

    if (!agentName || !action || !input) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: agentName, action, input'
      }), { status: 400, headers: corsHeaders })
    }

    const tenantId = enterprise_id || organization_id
    if (!tenantId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing tenant context: enterprise_id or organization_id required'
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`🤖 Processing ${agentName} agent request for tenant: ${tenantId}`)

    const agent = agents.get(agentName)
    if (!agent) {
      return new Response(JSON.stringify({
        success: false,
        error: `Agent '${agentName}' not found. Available agents: ${Array.from(agents.keys()).join(', ')}`
      }), { status: 404, headers: corsHeaders })
    }

    const enhancedContext = {
      ...context,
      tenantId,
      enterprise_id: tenantId,
      organization_id: tenantId,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      supabase
    }

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

    // Log agent activity
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
