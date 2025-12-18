import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-enterprise-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Generate Test Scenarios Edge Function
 * 
 * Uses SandboxAgent to generate realistic test scenarios based on policy content
 * Scenarios can be used to comprehensively test policy effectiveness
 * 
 * Input:
 * - policy_id: UUID of the policy
 * - count: Number of scenarios to generate (default: 5)
 * - enterprise_id: UUID of the enterprise
 * - focus_areas: Optional array of specific areas to focus on
 * 
 * Output:
 * - scenarios: Array of generated test scenarios
 * - confidence: AI confidence in generated scenarios
 * - metadata: Generation metadata
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { policy_id, count = 5, enterprise_id, focus_areas, scenario_type } = await req.json()

    if (!policy_id || !enterprise_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: policy_id, enterprise_id'
      }), { status: 400, headers: corsHeaders })
    }

    if (count < 1 || count > 20) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Count must be between 1 and 20'
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`🎲 Generating ${count} test scenarios for policy: ${policy_id}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch policy details
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('*')
      .eq('id', policy_id)
      .single()

    if (policyError || !policy) {
      return new Response(JSON.stringify({
        success: false,
        error: `Policy not found: ${policyError?.message || 'Unknown error'}`
      }), { status: 404, headers: corsHeaders })
    }

    console.log(`📋 Policy loaded: ${policy.name || policy.title || 'Unnamed Policy'}`)

    // Call SandboxAgent to generate scenarios
    const response = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        agentName: 'sandbox',
        action: 'generate_test_scenarios',
        input: {
          action: 'generate_test_scenarios',
          policy,
          count,
          focus_areas: focus_areas || [],
          scenario_type: scenario_type || 'comprehensive', // 'comprehensive', 'edge_cases', 'happy_path', 'failure_cases'
          policy_context: {
            policy_id: policy.id,
            policy_name: policy.name || policy.title,
            policy_type: policy.type,
            risk_level: policy.risk_level
          }
        },
        context: {
          source: 'generate-test-scenarios'
        },
        enterprise_id
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Scenario generation failed:', errorText)
      return new Response(JSON.stringify({
        success: false,
        error: `Scenario generation failed: ${response.status} - ${errorText}`
      }), { status: 500, headers: corsHeaders })
    }

    const result = await response.json()

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: `Scenario generation error: ${result.error}`
      }), { status: 500, headers: corsHeaders })
    }

    const scenarios = result.result?.scenarios || []

    // Validate each scenario has required fields
    const validatedScenarios = scenarios.map((scenario: any, index: number) => ({
      id: `scenario-${Date.now()}-${index}`,
      scenario_name: scenario.scenario_name || scenario.name || `Scenario ${index + 1}`,
      scenario_description: scenario.scenario_description || scenario.description || '',
      test_inputs: scenario.test_inputs || {},
      expected_outcome: scenario.expected_outcome || 'needs_review',
      expected_conditions: scenario.expected_conditions || [],
      risk_level: scenario.risk_level || 'medium',
      edge_case_type: scenario.edge_case_type || 'general',
      metadata: {
        generated_at: new Date().toISOString(),
        policy_id,
        scenario_type: scenario_type || 'comprehensive'
      }
    }))

    console.log(`✅ Generated ${validatedScenarios.length} test scenarios`)

    // Log scenario generation event
    await supabase.from('governance_events').insert({
      enterprise_id,
      event_type: 'scenarios_generated',
      event_source: 'sandbox',
      event_severity: 'info',
      related_id: policy_id,
      related_type: 'policy',
      metadata: {
        policy_id,
        scenarios_generated: validatedScenarios.length,
        scenario_type: scenario_type || 'comprehensive',
        focus_areas: focus_areas || []
      }
    })

    return new Response(JSON.stringify({
      success: true,
      scenarios: validatedScenarios,
      confidence: result.result?.confidence || 0.8,
      metadata: {
        policy_id,
        policy_name: policy.name || policy.title,
        total_generated: validatedScenarios.length,
        generation_metadata: result.result?.generation_metadata || {}
      }
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('🚨 Scenario generation error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

