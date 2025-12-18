import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Agent Activity Interface
 * Represents real-time agent execution activity
 */
export interface AgentActivity {
  id: string
  agentName: string
  action: string
  status: 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  timestamp: string
  confidence?: number
}

/**
 * Simulation Result Interface
 */
export interface SimulationResult {
  sandbox_run_id: string
  validation_status: boolean
  compliance_score: number
  risk_flags: any[]
  outputs: any
  ai_insights: {
    policy_validation: string
    simulation_analysis: string
    key_findings: string[]
    compliance_notes: string
    risk_analysis: string
    recommendations: string[]
  }
  agent_metadata: {
    agents_executed: string[]
    overall_confidence: number
    ai_provider: string
    ai_model: string
  }
}

/**
 * Test Scenario Interface
 */
export interface TestScenario {
  id: string
  scenario_name: string
  scenario_description: string
  test_inputs: {
    tool?: string
    data_class?: string
    jurisdiction?: string
    usage_context?: string
    user_role?: string
  }
  expected_outcome: 'approved' | 'rejected' | 'needs_review'
  expected_conditions: string[]
  risk_level: 'low' | 'medium' | 'high'
  edge_case_type: string
}

/**
 * useSandboxAgents Hook
 * 
 * Provides comprehensive sandbox functionality with AI agent orchestration
 * 
 * Features:
 * - Run intelligent simulations with multi-agent coordination
 * - Generate AI-powered test scenarios
 * - Export results with AI insights
 * - Real-time agent activity monitoring
 * - Subscription to governance events
 */
export const useSandboxAgents = (enterpriseId: string, userId?: string) => {
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentRun, setCurrentRun] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [simulationHistory, setSimulationHistory] = useState<any[]>([])

  /**
   * Run an intelligent policy simulation with multi-agent orchestration
   */
  const runIntelligentSimulation = useCallback(async (params: {
    policy_id: string
    scenario: any
    controls?: any
    workspace_id?: string
  }) => {
    setIsProcessing(true)
    setError(null)
    setAgentActivities([])

    try {
      console.log('🧪 Starting intelligent simulation...', params)

      // Call sandbox-run edge function
      const { data, error: invokeError } = await supabase.functions.invoke('sandbox-run', {
        body: {
          ...params,
          enterprise_id: enterpriseId,
          user_id: userId
        }
      })

      if (invokeError) {
        throw new Error(invokeError.message || 'Simulation failed')
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Simulation failed')
      }

      setCurrentRun(data.sandbox_run_id)
      
      console.log('✅ Simulation completed:', data.sandbox_run_id)

      // Parse agent activities from result
      if (data.result?.agent_metadata?.agent_execution_log) {
        const activities: AgentActivity[] = data.result.agent_metadata.agent_execution_log.map((log: any) => ({
          id: `${log.agent}-${log.timestamp}`,
          agentName: log.agent,
          action: log.action,
          status: log.status,
          result: log.result,
          error: log.error,
          timestamp: log.timestamp,
          confidence: log.confidence || log.score
        }))
        setAgentActivities(activities)
      }

      return { 
        success: true, 
        sandbox_run_id: data.sandbox_run_id, 
        result: data.result as SimulationResult
      }

    } catch (err: any) {
      console.error('❌ Simulation failed:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsProcessing(false)
    }
  }, [enterpriseId, userId])

  /**
   * Generate AI-powered test scenarios for a policy
   */
  const generateTestScenarios = useCallback(async (
    policy_id: string, 
    count = 5,
    options?: {
      focus_areas?: string[]
      scenario_type?: 'comprehensive' | 'edge_cases' | 'happy_path' | 'failure_cases'
    }
  ): Promise<TestScenario[]> => {
    try {
      console.log(`🎲 Generating ${count} test scenarios...`)

      const { data, error: invokeError } = await supabase.functions.invoke('generate-test-scenarios', {
        body: {
          policy_id,
          enterprise_id: enterpriseId,
          count,
          focus_areas: options?.focus_areas,
          scenario_type: options?.scenario_type
        }
      })

      if (invokeError) {
        throw new Error(invokeError.message || 'Scenario generation failed')
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Scenario generation failed')
      }

      console.log(`✅ Generated ${data.scenarios.length} scenarios`)
      return data.scenarios as TestScenario[]

    } catch (err: any) {
      console.error('❌ Scenario generation failed:', err)
      setError(err.message)
      throw err
    }
  }, [enterpriseId])

  /**
   * Export simulation results with AI insights
   */
  const exportResults = useCallback(async (
    sandbox_run_id: string, 
    export_type: 'json' | 'pdf' | 'markdown' | 'csv' = 'json',
    options?: {
      include_raw_data?: boolean
      include_ai_insights?: boolean
    }
  ) => {
    try {
      console.log(`📥 Exporting results as ${export_type}...`)

      if (!userId) {
        throw new Error('User ID required for export')
      }

      const { data, error: invokeError } = await supabase.functions.invoke('sandbox-export', {
        body: {
          sandbox_run_id,
          enterprise_id: enterpriseId,
          user_id: userId,
          export_type,
          include_raw_data: options?.include_raw_data ?? false,
          include_ai_insights: options?.include_ai_insights ?? true
        }
      })

      if (invokeError) {
        throw new Error(invokeError.message || 'Export failed')
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Export failed')
      }

      console.log('✅ Export complete:', data.file_name)
      return data

    } catch (err: any) {
      console.error('❌ Export failed:', err)
      setError(err.message)
      throw err
    }
  }, [enterpriseId, userId])

  /**
   * Fetch sandbox run history
   */
  const fetchSimulationHistory = useCallback(async (limit = 10) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sandbox_runs')
        .select(`
          id,
          scenario_name,
          status,
          validation_status,
          compliance_score,
          agent_confidence,
          created_at,
          completed_at
        `)
        .eq('enterprise_id', enterpriseId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      setSimulationHistory(data || [])
      return data || []

    } catch (err: any) {
      console.error('❌ Failed to fetch simulation history:', err)
      return []
    }
  }, [enterpriseId])

  /**
   * Subscribe to real-time governance events for this enterprise
   */
  useEffect(() => {
    if (!enterpriseId) return

    console.log('📡 Subscribing to governance events...')

    const channel = supabase
      .channel(`governance-events:${enterpriseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'governance_events',
          filter: `enterprise_id=eq.${enterpriseId}`
        },
        (payload) => {
          console.log('📬 Governance event received:', payload.new)
          
          // Refresh simulation history if a new simulation completed
          if (payload.new.event_type === 'simulation_completed') {
            fetchSimulationHistory()
          }
        }
      )
      .subscribe()

    return () => {
      console.log('📴 Unsubscribing from governance events')
      channel.unsubscribe()
    }
  }, [enterpriseId, fetchSimulationHistory])

  /**
   * Clear agent activities
   */
  const clearActivities = useCallback(() => {
    setAgentActivities([])
    setCurrentRun(null)
    setError(null)
  }, [])

  /**
   * Get sandbox run details by ID
   */
  const getSandboxRun = useCallback(async (sandboxRunId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sandbox_runs')
        .select(`
          *,
          sandbox_controls(*),
          sandbox_approvals(*)
        `)
        .eq('id', sandboxRunId)
        .single()

      if (fetchError) throw fetchError

      return data

    } catch (err: any) {
      console.error('❌ Failed to fetch sandbox run:', err)
      throw err
    }
  }, [])

  return {
    // Core functions
    runIntelligentSimulation,
    generateTestScenarios,
    exportResults,
    fetchSimulationHistory,
    getSandboxRun,
    clearActivities,

    // State
    agentActivities,
    isProcessing,
    currentRun,
    error,
    simulationHistory,

    // Computed values
    hasActiveSimulation: isProcessing,
    latestActivity: agentActivities[agentActivities.length - 1] || null,
    completedAgents: agentActivities.filter(a => a.status === 'completed').length,
    failedAgents: agentActivities.filter(a => a.status === 'failed').length,
  }
}

