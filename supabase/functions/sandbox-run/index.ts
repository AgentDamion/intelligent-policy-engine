import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-enterprise-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Sandbox Run Edge Function
 * 
 * Multi-agent orchestration for intelligent policy simulation
 * 
 * Agent Workflow:
 * 1. PolicyAgent - Validate policy before simulation
 * 2. SandboxAgent - Execute simulation with AI-powered logic
 * 3. ComplianceScoringAgent - Score compliance of simulation outputs
 * 4. MonitoringAgent - Detect anomalies and assess risk
 * 
 * Returns comprehensive simulation results with AI insights from all agents
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { policy_id, scenario, controls, enterprise_id, workspace_id, user_id } = await req.json()

    // Validate required inputs
    if (!policy_id || !scenario || !enterprise_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: policy_id, scenario, enterprise_id'
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`🧪 Starting sandbox run for policy: ${policy_id}`)

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

    // Create sandbox run record
    const { data: sandboxRun, error: insertError } = await supabase
      .from('sandbox_runs')
      .insert({
        enterprise_id,
        workspace_id,
        policy_id,
        scenario_name: scenario.name || scenario.scenario_name || 'Unnamed Scenario',
        scenario_config: scenario,
        status: 'running',
        agent_metadata: {
          agents_to_execute: ['policy', 'sandbox', 'compliance-scoring', 'monitoring'],
          start_time: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create sandbox run:', insertError)
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to create sandbox run: ${insertError.message}`
      }), { status: 500, headers: corsHeaders })
    }

    console.log(`✅ Sandbox run created: ${sandboxRun.id}`)

    // ============================================
    // MULTI-AGENT ORCHESTRATION
    // ============================================

    const agentResults: Record<string, any> = {
      policy_validation: null,
      simulation: null,
      compliance_score: null,
      risk_assessment: null
    }

    const agentExecutionLog: any[] = []

    // Step 1: PolicyAgent - Validate policy before simulation
    console.log('🔍 Step 1: Validating policy with PolicyAgent...')
    try {
      const policyValidation = await callAgent('policy', 'validate', {
        document: policy,
        policy_content: policy.content || policy.rules,
        context: 'sandbox_simulation'
      }, enterprise_id, sandboxRun.id)
      
      agentResults.policy_validation = policyValidation
      agentExecutionLog.push({
        agent: 'policy',
        action: 'validate',
        status: 'completed',
        confidence: policyValidation.result?.decision?.confidence || 0.8,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Policy validation: ${policyValidation.result?.decision?.status || 'completed'}`)
    } catch (error) {
      console.error('❌ Policy validation failed:', error)
      agentExecutionLog.push({
        agent: 'policy',
        action: 'validate',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
      // Continue simulation even if policy validation has issues
    }

    // Step 2: SandboxAgent - Execute simulation with AI
    console.log('🧪 Step 2: Running simulation with SandboxAgent...')
    try {
      const simulation = await callAgent('sandbox', 'simulate_policy_execution', {
        policy,
        scenario: scenario.config || scenario,
        controls: controls || {},
        expected_outcome: scenario.expected_outcome
      }, enterprise_id, sandboxRun.id)
      
      agentResults.simulation = simulation
      agentExecutionLog.push({
        agent: 'sandbox',
        action: 'simulate_policy_execution',
        status: 'completed',
        confidence: simulation.result?.simulation_result?.ai_confidence || 0.8,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Simulation complete: confidence ${simulation.result?.simulation_result?.ai_confidence}`)
    } catch (error) {
      console.error('❌ Simulation failed:', error)
      agentExecutionLog.push({
        agent: 'sandbox',
        action: 'simulate_policy_execution',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      // Simulation failure is critical - update status and return error
      await supabase.from('sandbox_runs').update({
        status: 'failed',
        agent_metadata: { error: error.message, agent_log: agentExecutionLog }
      }).eq('id', sandboxRun.id)

      return new Response(JSON.stringify({
        success: false,
        error: `Simulation failed: ${error.message}`,
        sandbox_run_id: sandboxRun.id
      }), { status: 500, headers: corsHeaders })
    }

    // Step 3: ComplianceScoringAgent - Score compliance
    console.log('📊 Step 3: Scoring compliance with ComplianceScoringAgent...')
    try {
      const complianceScore = await callAgent('compliance-scoring', 'score', {
        simulation_result: agentResults.simulation.result.simulation_result,
        policy,
        scenario,
        expected_outcome: scenario.expected_outcome
      }, enterprise_id, sandboxRun.id)
      
      agentResults.compliance_score = complianceScore
      agentExecutionLog.push({
        agent: 'compliance-scoring',
        action: 'score',
        status: 'completed',
        score: complianceScore.result?.score || 0.8,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Compliance scored: ${complianceScore.result?.score}`)
    } catch (error) {
      console.error('❌ Compliance scoring failed:', error)
      agentExecutionLog.push({
        agent: 'compliance-scoring',
        action: 'score',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
      // Non-critical - continue with default compliance score
    }

    // Step 4: MonitoringAgent - Detect anomalies
    console.log('🔎 Step 4: Detecting anomalies with MonitoringAgent...')
    try {
      const riskAssessment = await callAgent('monitoring', 'detect_anomalies', {
        simulation_result: agentResults.simulation.result.simulation_result,
        policy,
        expected_behavior: scenario.expected_outcome,
        scenario
      }, enterprise_id, sandboxRun.id)
      
      agentResults.risk_assessment = riskAssessment
      agentExecutionLog.push({
        agent: 'monitoring',
        action: 'detect_anomalies',
        status: 'completed',
        anomalies_found: riskAssessment.result?.anomalies?.length || 0,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Risk assessment complete: ${riskAssessment.result?.anomalies?.length || 0} anomalies found`)
    } catch (error) {
      console.error('❌ Risk assessment failed:', error)
      agentExecutionLog.push({
        agent: 'monitoring',
        action: 'detect_anomalies',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
      // Non-critical - continue without anomaly detection
    }

    // ============================================
    // AGGREGATE RESULTS
    // ============================================

    const simulationResult = agentResults.simulation.result.simulation_result
    const complianceResult = agentResults.compliance_score?.result
    const riskResult = agentResults.risk_assessment?.result

    const finalResult = {
      validation_status: simulationResult.validation_status && 
                         (agentResults.policy_validation?.result?.decision?.status === 'approved' ||
                          agentResults.policy_validation?.result?.decision?.status === 'needs_review'),
      compliance_score: complianceResult?.score || simulationResult.compliance_score,
      risk_flags: [
        ...(simulationResult.risk_flags || []),
        ...(riskResult?.anomalies || []).map((a: any) => ({
          type: a.anomaly_type || 'unknown',
          severity: a.severity || 'medium',
          description: a.description
        }))
      ],
      outputs: simulationResult.outputs,
      ai_insights: {
        policy_validation: agentResults.policy_validation?.result?.decision?.reasoning || 'Policy validation completed',
        simulation_analysis: simulationResult.agent_insights.simulation_analysis,
        key_findings: simulationResult.agent_insights.key_findings,
        compliance_notes: complianceResult?.reasoning || 'Compliance scoring completed',
        risk_analysis: riskResult?.detailed_analysis || 'Risk assessment completed',
        recommendations: [
          ...(simulationResult.agent_insights.recommendations || []),
          ...(complianceResult?.recommendations || []),
          ...(riskResult?.suggested_actions || [])
        ]
      },
      agent_metadata: {
        agents_executed: agentExecutionLog.map(log => log.agent),
        agent_execution_log: agentExecutionLog,
        total_processing_time_ms: agentResults.simulation.metadata?.processing_time_ms || 0,
        ai_provider: agentResults.simulation.metadata?.ai_provider,
        ai_model: agentResults.simulation.metadata?.ai_model,
        overall_confidence: this.calculateOverallConfidence(agentExecutionLog)
      }
    }

    // Update sandbox run with results
    const { error: updateError } = await supabase
      .from('sandbox_runs')
      .update({
        status: 'completed',
        validation_status: finalResult.validation_status,
        compliance_score: finalResult.compliance_score,
        risk_flags: finalResult.risk_flags,
        outputs: finalResult.outputs,
        ai_insights: finalResult.ai_insights,
        agent_metadata: finalResult.agent_metadata,
        agent_confidence: finalResult.agent_metadata.overall_confidence,
        agent_reasoning: finalResult.ai_insights.simulation_analysis,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sandboxRun.id)

    if (updateError) {
      console.error('⚠️ Failed to update sandbox run:', updateError)
    }

    // Create sandbox controls records
    if (simulationResult.outputs?.control_checks) {
      const controls = Object.entries(simulationResult.outputs.control_checks).map(([name, status]) => ({
        sandbox_run_id: sandboxRun.id,
        control_type: 'automated',
        control_name: name,
        status: typeof status === 'object' ? (status as any).status : status,
        details: typeof status === 'object' ? status : { result: status }
      }))

      await supabase.from('sandbox_controls').insert(controls)
    }

    // Log governance event
    await supabase.from('governance_events').insert({
      enterprise_id,
      event_type: 'simulation_completed',
      event_source: 'sandbox',
      event_severity: finalResult.validation_status ? 'info' : 'warning',
      related_id: sandboxRun.id,
      related_type: 'sandbox_run',
      user_id,
      metadata: {
        policy_id,
        scenario_name: scenario.name || scenario.scenario_name,
        compliance_score: finalResult.compliance_score,
        validation_status: finalResult.validation_status,
        risk_flags_count: finalResult.risk_flags.length,
        agents_executed: finalResult.agent_metadata.agents_executed
      }
    })

    console.log(`✅ Sandbox run completed successfully: ${sandboxRun.id}`)

    return new Response(JSON.stringify({
      success: true,
      sandbox_run_id: sandboxRun.id,
      result: finalResult
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('🚨 Sandbox run error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Call cursor-agent-adapter to execute an agent action
 */
async function callAgent(
  agentName: string, 
  action: string, 
  input: any, 
  enterprise_id: string,
  sandbox_run_id: string
): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const requestBody = {
    agentName,
    action,
    input: {
      ...input,
      action // Pass action to agent for routing
    },
    context: {
      sandbox_run_id,
      source: 'sandbox-run'
    },
    enterprise_id
  }

  console.log(`📡 Calling ${agentName} agent with action: ${action}`)

  const response = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Agent ${agentName} failed with status ${response.status}:`, errorText)
    throw new Error(`Agent ${agentName} failed: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(`Agent ${agentName} returned error: ${result.error}`)
  }

  return result
}

/**
 * Calculate overall confidence from agent execution log
 */
function calculateOverallConfidence(agentLog: any[]): number {
  const completedAgents = agentLog.filter(log => log.status === 'completed')
  
  if (completedAgents.length === 0) return 0.5

  const confidenceScores = completedAgents
    .map(log => log.confidence || log.score || 0.7)
    .filter(score => typeof score === 'number')

  if (confidenceScores.length === 0) return 0.7

  const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
  
  // Penalize if not all agents completed
  const completionPenalty = completedAgents.length / agentLog.length
  
  return Math.round(avgConfidence * completionPenalty * 100) / 100
}

