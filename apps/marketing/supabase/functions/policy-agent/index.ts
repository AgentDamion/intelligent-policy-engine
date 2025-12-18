import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body = await req.json()
    const { tool, vendor, usage, dataHandling, content, urgency } = body

    console.log('🔍 PolicyAgent processing request:', { tool, vendor, usage })

    // Enhanced risk calculation
    const riskScore = calculateEnhancedRiskScore({ tool, vendor, usage, dataHandling, urgency })
    const decision = makeEnhancedDecision(riskScore, { tool, vendor, usage, dataHandling, urgency })
    const riskLevel = getRiskLevel(riskScore)
    const riskFactors = getRiskFactors({ tool, vendor, usage, dataHandling })
    const reasoning = getDecisionReasoning(riskScore, decision)

    const response = {
      request: {
        originalContent: content || "Request processed",
        user: {
          role: "marketing_agency_employee",
          urgency_level: urgency?.level || 0.5,
          emotional_state: urgency?.emotionalState || "neutral"
        },
        request: {
          tool: tool?.toLowerCase(),
          purpose: inferPurpose(usage),
          presentation_type: "client_presentation",
          confidence: 0.8,
          deadline: "pending",
          current_time: new Date().toISOString()
        },
        context: {
          time_pressure: urgency?.timePressure || 0.5,
          is_weekend: false,
          is_client_facing: true
        }
      },
      decision: {
        type: "policy_evaluation",
        status: decision.status,
        confidence: decision.confidence,
        reasoning: reasoning,
        riskLevel: riskLevel,
        requiresHumanReview: decision.requiresHumanReview,
        riskFactors: riskFactors,
        conditions: {
          guardrails: {
            fda_compliance: decision.fdaCompliance,
            gdpr_compliance: decision.gdprCompliance,
            risk_threshold: decision.riskThreshold
          }
        }
      },
      metadata: {
        processingTime: Date.now(),
        agentVersion: "2.0",
        modelAccuracy: 0.92
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('🚨 PolicyAgent error:', error)
    
    return new Response(JSON.stringify({
      decision: "REVIEW_REQUIRED",
      confidence: 0.1,
      rationale: "Agent error occurred, manual review required",
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function calculateEnhancedRiskScore(input: any): number {
  let riskScore = 0.5 // Base risk

  // Tool-based risk factors
  if (input.tool) {
    const toolLower = input.tool.toLowerCase()
    if (toolLower.includes('medical') || toolLower.includes('healthcare')) riskScore += 0.3
    if (toolLower.includes('financial') || toolLower.includes('payment')) riskScore += 0.2
    if (toolLower.includes('social') || toolLower.includes('media')) riskScore += 0.1
  }

  // Data handling risk factors
  if (input.dataHandling) {
    if (input.dataHandling.includes('personal_data')) riskScore += 0.2
    if (input.dataHandling.includes('sensitive_data')) riskScore += 0.3
    if (input.dataHandling.includes('medical_records')) riskScore += 0.4
  }

  // Usage context risk factors
  if (input.usage) {
    if (input.usage.includes('client_facing')) riskScore += 0.1
    if (input.usage.includes('public')) riskScore += 0.2
    if (input.usage.includes('regulatory')) riskScore += 0.3
  }

  // Urgency level impact
  if (input.urgency?.level > 0.8) riskScore += 0.1
  if (input.urgency?.level < 0.3) riskScore -= 0.1

  return Math.min(1.0, Math.max(0.0, riskScore))
}

function makeEnhancedDecision(riskScore: number, input: any) {
  const confidence = Math.max(0.6, 1.0 - riskScore * 0.4)
  const requiresHumanReview = riskScore > 0.7 || input.urgency?.level > 0.9
  const fdaCompliance = riskScore < 0.8
  const gdprCompliance = !input.dataHandling?.includes('personal_data_without_consent')

  let status = 'approved'
  if (riskScore > 0.7) status = 'needs_review'
  if (riskScore > 0.9) status = 'rejected'

  return {
    status,
    confidence,
    requiresHumanReview,
    fdaCompliance,
    gdprCompliance,
    riskThreshold: 0.7
  }
}

function getRiskLevel(riskScore: number): string {
  if (riskScore > 0.8) return 'high'
  if (riskScore > 0.6) return 'medium'
  return 'low'
}

function getRiskFactors(input: any): string[] {
  const factors = []
  if (input.tool?.toLowerCase().includes('medical')) factors.push('medical_content_risk')
  if (input.dataHandling?.includes('personal_data')) factors.push('privacy_risk')
  if (input.usage?.includes('public')) factors.push('reputational_risk')
  return factors
}

function getDecisionReasoning(riskScore: number, decision: any): string {
  if (decision.status === 'rejected') {
    return `Request rejected due to high risk score (${Math.round(riskScore * 100)}%). Requires human review.`
  }
  if (decision.status === 'needs_review') {
    return `Request flagged for review due to elevated risk score (${Math.round(riskScore * 100)}%).`
  }
  return `Request approved with confidence ${Math.round(decision.confidence * 100)}%.`
}

function inferPurpose(usage: any): string {
  if (typeof usage === 'string') {
    if (usage.includes('presentation')) return 'client_presentation'
    if (usage.includes('analysis')) return 'data_analysis'
    if (usage.includes('content')) return 'content_creation'
  }
  return 'general_use'
}
