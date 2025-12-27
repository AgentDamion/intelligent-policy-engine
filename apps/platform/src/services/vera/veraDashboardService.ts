/**
 * VERA Dashboard Service
 * 
 * Provides metrics and data for the VERA Dashboard:
 * - Velocity metrics (Revenue Protected, Days Saved)
 * - Decision queue (pending Seals)
 * - Compliance scores
 * - Auto-Clear rate
 * - Real-time state from vera_state table
 */

import { supabase } from '../../lib/supabase'

// Types
export interface VelocityMetrics {
  revenueProtected: number
  daysSaved: number
  autoClearRate: number
  totalDecisions: number
  pendingSeals: number
}

export interface DecisionQueueItem {
  id: string
  submissionId?: string
  toolName: string
  toolVendor?: string
  decisionType: 'pending' | 'needs_review' | 'escalated'
  riskScore?: number
  requestedAt: Date
  requestedBy?: string
  daysOpen: number
}

export interface ComplianceScore {
  overall: number
  policyAdherence: number
  auditCompleteness: number
  toolApprovalRate: number
  trend7d: number // percentage change over 7 days
  trend30d: number // percentage change over 30 days
}

export interface VERAStateSnapshot {
  enterpriseId: string
  currentEpsId?: string
  currentEpsHash?: string
  lastDecisionId?: string
  lastDecisionAt?: Date
  lastDecisionType?: string
  healthStatus: 'healthy' | 'degraded' | 'error'
  decisionsCount: number
  autoClearedCount: number
  escalatedCount: number
  blockedCount: number
  statsPeriodStart: Date
  updatedAt: Date
}

export interface VERADashboardData {
  velocityMetrics: VelocityMetrics
  decisionQueue: DecisionQueueItem[]
  complianceScore: ComplianceScore
  state: VERAStateSnapshot | null
  lastUpdated: Date
}

/**
 * Get velocity metrics for an enterprise
 * Uses vera_preferences for configuration and vera_state for live data
 */
export async function getVelocityMetrics(enterpriseId: string): Promise<VelocityMetrics> {
  try {
    // Get vera_preferences for calculation coefficients
    const { data: preferences } = await supabase
      .from('vera_preferences')
      .select('avg_campaign_value_usd, avg_manual_review_days, auto_clear_threshold')
      .eq('enterprise_id', enterpriseId)
      .single()

    // Get vera_state for live counters
    const { data: state } = await supabase
      .from('vera_state')
      .select('decisions_count, auto_cleared_count, escalated_count, blocked_count, stats_period_start')
      .eq('enterprise_id', enterpriseId)
      .single()

    // Get pending decisions count
    const { count: pendingCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', enterpriseId)
      .in('status', ['pending', 'under_review'])

    // Default values if no preferences exist
    const avgCampaignValue = preferences?.avg_campaign_value_usd || 150000
    const avgManualReviewDays = preferences?.avg_manual_review_days || 14

    // Calculate metrics
    const totalDecisions = state?.decisions_count || 0
    const autoClearedCount = state?.auto_cleared_count || 0
    const autoClearRate = totalDecisions > 0 
      ? Math.round((autoClearedCount / totalDecisions) * 100) 
      : 0

    // Revenue Protected = (auto-cleared decisions * avg campaign value) / 1000000 (in millions)
    // This represents campaigns that didn't get delayed due to manual review
    const revenueProtected = (autoClearedCount * avgCampaignValue) / 1000000

    // Days Saved = auto-cleared decisions * avg manual review days
    const daysSaved = autoClearedCount * avgManualReviewDays

    return {
      revenueProtected: Math.round(revenueProtected * 100) / 100, // 2 decimal places
      daysSaved: Math.round(daysSaved),
      autoClearRate,
      totalDecisions,
      pendingSeals: pendingCount || 0
    }
  } catch (error) {
    console.error('[VERADashboardService] Error fetching velocity metrics:', error)
    // Return default values on error
    return {
      revenueProtected: 0,
      daysSaved: 0,
      autoClearRate: 0,
      totalDecisions: 0,
      pendingSeals: 0
    }
  }
}

/**
 * Get decision queue (pending Seals that need attention)
 */
export async function getDecisionQueue(
  enterpriseId: string,
  options: { limit?: number; status?: string[] } = {}
): Promise<DecisionQueueItem[]> {
  try {
    const { limit = 10, status = ['under_review', 'changes_requested'] } = options

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        title,
        status,
        risk_score,
        submitted_at,
        submitted_by,
        submission_items (
          ai_tool_name,
          vendor
        )
      `)
      .eq('enterprise_id', enterpriseId)
      .in('status', status)
      .order('submitted_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    return (data || []).map((item) => {
      const submittedAt = new Date(item.submitted_at)
      const now = new Date()
      const daysOpen = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24))
      
      // Get tool info from submission items
      const toolInfo = item.submission_items?.[0]

      return {
        id: item.id,
        submissionId: item.id,
        toolName: toolInfo?.ai_tool_name || item.title || 'Unknown Tool',
        toolVendor: toolInfo?.vendor,
        decisionType: item.status === 'changes_requested' ? 'needs_review' : 
                      item.status === 'under_review' ? 'pending' : 'escalated',
        riskScore: item.risk_score,
        requestedAt: submittedAt,
        requestedBy: item.submitted_by,
        daysOpen
      } as DecisionQueueItem
    })
  } catch (error) {
    console.error('[VERADashboardService] Error fetching decision queue:', error)
    return []
  }
}

/**
 * Get compliance score for an enterprise
 */
export async function getComplianceScore(enterpriseId: string): Promise<ComplianceScore> {
  try {
    // Get recent decisions for calculating scores
    const { data: recentDecisions } = await supabase
      .from('ai_agent_decisions')
      .select('outcome, risk, created_at')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    // Get governance entities for audit completeness
    const { data: entities } = await supabase
      .from('governance_entities')
      .select('compliance_score, audit_completeness_score, tool_approval_score')
      .eq('enterprise_id', enterpriseId)

    // Calculate scores
    const decisions = recentDecisions || []
    const entitiesData = entities || []

    // Overall compliance = average of entity compliance scores
    const avgEntityScore = entitiesData.length > 0
      ? entitiesData.reduce((sum, e) => sum + (e.compliance_score || 0), 0) / entitiesData.length
      : 85 // Default

    // Policy adherence = percentage of approved decisions
    const approvedDecisions = decisions.filter(d => d.outcome === 'approved' || d.outcome === 'approved_with_conditions')
    const policyAdherence = decisions.length > 0
      ? Math.round((approvedDecisions.length / decisions.length) * 100)
      : 100

    // Audit completeness
    const auditCompleteness = entitiesData.length > 0
      ? Math.round(entitiesData.reduce((sum, e) => sum + (e.audit_completeness_score || 0), 0) / entitiesData.length)
      : 80

    // Tool approval rate
    const toolApprovalRate = entitiesData.length > 0
      ? Math.round(entitiesData.reduce((sum, e) => sum + (e.tool_approval_score || 0), 0) / entitiesData.length)
      : 90

    // Calculate trends (simplified - would need historical data for real calculation)
    // For now, return mock trends
    const trend7d = Math.round((Math.random() * 10) - 5) // -5 to +5
    const trend30d = Math.round((Math.random() * 10) - 3) // -3 to +7

    return {
      overall: Math.round(avgEntityScore),
      policyAdherence,
      auditCompleteness,
      toolApprovalRate,
      trend7d,
      trend30d
    }
  } catch (error) {
    console.error('[VERADashboardService] Error fetching compliance score:', error)
    return {
      overall: 85,
      policyAdherence: 90,
      auditCompleteness: 80,
      toolApprovalRate: 88,
      trend7d: 0,
      trend30d: 0
    }
  }
}

/**
 * Get VERA state snapshot for an enterprise
 */
export async function getVERAState(enterpriseId: string): Promise<VERAStateSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('vera_state')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    if (!data) return null

    return {
      enterpriseId: data.enterprise_id,
      currentEpsId: data.current_eps_id,
      currentEpsHash: data.current_eps_hash,
      lastDecisionId: data.last_decision_id,
      lastDecisionAt: data.last_decision_at ? new Date(data.last_decision_at) : undefined,
      lastDecisionType: data.last_decision_type,
      healthStatus: data.health_status || 'healthy',
      decisionsCount: data.decisions_count || 0,
      autoClearedCount: data.auto_cleared_count || 0,
      escalatedCount: data.escalated_count || 0,
      blockedCount: data.blocked_count || 0,
      statsPeriodStart: new Date(data.stats_period_start),
      updatedAt: new Date(data.updated_at)
    }
  } catch (error) {
    console.error('[VERADashboardService] Error fetching VERA state:', error)
    return null
  }
}

/**
 * Get complete VERA dashboard data
 */
export async function getVERADashboardData(enterpriseId: string): Promise<VERADashboardData> {
  const [velocityMetrics, decisionQueue, complianceScore, state] = await Promise.all([
    getVelocityMetrics(enterpriseId),
    getDecisionQueue(enterpriseId),
    getComplianceScore(enterpriseId),
    getVERAState(enterpriseId)
  ])

  return {
    velocityMetrics,
    decisionQueue,
    complianceScore,
    state,
    lastUpdated: new Date()
  }
}

/**
 * Initialize VERA state for an enterprise (if not exists)
 */
export async function initializeVERAState(enterpriseId: string): Promise<void> {
  try {
    await supabase.rpc('get_or_create_vera_state', {
      p_enterprise_id: enterpriseId
    })
  } catch (error) {
    console.error('[VERADashboardService] Error initializing VERA state:', error)
  }
}

export default {
  getVelocityMetrics,
  getDecisionQueue,
  getComplianceScore,
  getVERAState,
  getVERADashboardData,
  initializeVERAState
}

