/**
 * Precedent Service
 * 
 * Enables precedent linking and decision graph navigation.
 * Week 5: Precedent Linking Algorithm
 * 
 * Features:
 * - Find similar governance decisions using text similarity
 * - Link precedents to new decisions
 * - Calculate precedent influence scores
 * - Navigate decision precedent chains
 */

import { supabase } from '@/lib/supabase'
import type { GovernanceAction } from './governanceThreadService'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface PrecedentMatch {
  actionId: string
  threadId: string
  actionType: string
  rationale: string
  outcome: string
  similarityScore: number
  decisionDate: Date
  enterpriseId: string
  metadata: {
    brand?: string
    region?: string
    channel?: string
    toolVendor?: string
  }
}

export interface PrecedentLink {
  sourceActionId: string
  precedentActionId: string
  influenceScore: number
  linkedAt: Date
  linkedBy: 'system' | 'user'
}

export interface PrecedentChain {
  rootActionId: string
  chain: Array<{
    actionId: string
    depth: number
    influenceScore: number
    rationale: string
    outcome: string
    decisionDate: Date
  }>
}

export interface SimilaritySearchOptions {
  limit?: number
  minSimilarity?: number
  includeResolved?: boolean
  sameEnterpriseOnly?: boolean
  timeWindowDays?: number
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Find similar governance decisions based on rationale text similarity
 * Uses PostgreSQL pg_trgm extension for fuzzy text matching
 */
export async function findSimilarDecisions(
  threadId: string,
  options: SimilaritySearchOptions = {}
): Promise<PrecedentMatch[]> {
  const {
    limit = 10,
    minSimilarity = 0.3,
    includeResolved = true,
    sameEnterpriseOnly = true,
    timeWindowDays = 365,
  } = options

  try {
    const { data, error } = await supabase.rpc('find_similar_governance_decisions', {
      p_thread_id: threadId,
      p_limit: limit,
      p_min_similarity: minSimilarity,
      p_include_resolved: includeResolved,
      p_same_enterprise_only: sameEnterpriseOnly,
      p_time_window_days: timeWindowDays,
    })

    if (error) {
      console.error('[precedentService] Error finding similar decisions:', error)
      throw new Error(`Failed to find similar decisions: ${error.message}`)
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      actionId: row.action_id as string,
      threadId: row.thread_id as string,
      actionType: row.action_type as string,
      rationale: row.rationale as string,
      outcome: row.outcome as string,
      similarityScore: row.similarity_score as number,
      decisionDate: new Date(row.decision_date as string),
      enterpriseId: row.enterprise_id as string,
      metadata: {
        brand: row.brand as string | undefined,
        region: row.region as string | undefined,
        channel: row.channel as string | undefined,
        toolVendor: row.tool_vendor as string | undefined,
      },
    }))
  } catch (err) {
    console.error('[precedentService] Error in findSimilarDecisions:', err)
    throw err
  }
}

/**
 * Link precedent actions to a governance action
 * Stores the precedent relationship with influence score
 */
export async function linkPrecedents(
  actionId: string,
  precedentIds: string[],
  linkedBy: 'system' | 'user' = 'system'
): Promise<void> {
  if (precedentIds.length === 0) return

  try {
    // Calculate influence scores based on similarity and recency
    const influenceScores = await Promise.all(
      precedentIds.map(async (precedentId, index) => {
        // Basic influence scoring: higher rank = higher score
        const baseScore = 1 - (index * 0.1)
        return Math.max(0.1, Math.min(1.0, baseScore))
      })
    )

    // Update governance_actions with precedent links
    const { error } = await supabase
      .from('governance_actions')
      .update({
        precedent_action_ids: precedentIds,
        precedent_influence_score: influenceScores.reduce((a, b) => a + b, 0) / influenceScores.length,
        similar_decisions: precedentIds.map((id, idx) => ({
          decision_id: id,
          influence_score: influenceScores[idx],
          linked_by: linkedBy,
          linked_at: new Date().toISOString(),
        })),
      })
      .eq('id', actionId)

    if (error) {
      console.error('[precedentService] Error linking precedents:', error)
      throw new Error(`Failed to link precedents: ${error.message}`)
    }

    console.log(`[precedentService] Linked ${precedentIds.length} precedents to action ${actionId}`)
  } catch (err) {
    console.error('[precedentService] Error in linkPrecedents:', err)
    throw err
  }
}

/**
 * Get precedent chain for a decision
 * Returns the full chain of precedent decisions that influenced this action
 */
export async function getPrecedentChain(
  actionId: string,
  maxDepth: number = 5
): Promise<PrecedentChain> {
  try {
    const { data, error } = await supabase.rpc('get_precedent_chain', {
      p_action_id: actionId,
      p_max_depth: maxDepth,
    })

    if (error) {
      console.error('[precedentService] Error getting precedent chain:', error)
      throw new Error(`Failed to get precedent chain: ${error.message}`)
    }

    return {
      rootActionId: actionId,
      chain: (data || []).map((row: Record<string, unknown>) => ({
        actionId: row.action_id as string,
        depth: row.depth as number,
        influenceScore: row.influence_score as number,
        rationale: row.rationale as string,
        outcome: row.outcome as string,
        decisionDate: new Date(row.decision_date as string),
      })),
    }
  } catch (err) {
    console.error('[precedentService] Error in getPrecedentChain:', err)
    throw err
  }
}

/**
 * Calculate similarity score between two actions
 * Uses trigram similarity on rationale text
 */
export async function getSimilarityScore(
  action1Id: string,
  action2Id: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_action_similarity', {
      p_action1_id: action1Id,
      p_action2_id: action2Id,
    })

    if (error) {
      console.error('[precedentService] Error calculating similarity:', error)
      return 0
    }

    return data || 0
  } catch (err) {
    console.error('[precedentService] Error in getSimilarityScore:', err)
    return 0
  }
}

/**
 * Auto-link precedents for a new governance action
 * Called automatically when recording certain action types
 */
export async function autoLinkPrecedents(actionId: string): Promise<number> {
  try {
    // Get the action's thread ID
    const { data: action, error: actionError } = await supabase
      .from('governance_actions')
      .select('thread_id')
      .eq('id', actionId)
      .single()

    if (actionError || !action) {
      console.error('[precedentService] Error fetching action:', actionError)
      return 0
    }

    // Find similar decisions
    const similar = await findSimilarDecisions(action.thread_id, {
      limit: 5,
      minSimilarity: 0.5,
    })

    if (similar.length === 0) {
      return 0
    }

    // Link the top similar decisions
    const precedentIds = similar.map(s => s.actionId)
    await linkPrecedents(actionId, precedentIds, 'system')

    return precedentIds.length
  } catch (err) {
    console.error('[precedentService] Error in autoLinkPrecedents:', err)
    return 0
  }
}

/**
 * Get precedent statistics for an enterprise
 * Used for analytics and reporting
 */
export async function getPrecedentStats(enterpriseId: string): Promise<{
  totalDecisions: number
  decisionsWithPrecedents: number
  averagePrecedentCount: number
  precedentCoverage: number
}> {
  try {
    const { data, error } = await supabase.rpc('get_precedent_statistics', {
      p_enterprise_id: enterpriseId,
    })

    if (error) {
      console.error('[precedentService] Error getting precedent stats:', error)
      return {
        totalDecisions: 0,
        decisionsWithPrecedents: 0,
        averagePrecedentCount: 0,
        precedentCoverage: 0,
      }
    }

    return {
      totalDecisions: data?.total_decisions || 0,
      decisionsWithPrecedents: data?.decisions_with_precedents || 0,
      averagePrecedentCount: data?.average_precedent_count || 0,
      precedentCoverage: data?.precedent_coverage || 0,
    }
  } catch (err) {
    console.error('[precedentService] Error in getPrecedentStats:', err)
    return {
      totalDecisions: 0,
      decisionsWithPrecedents: 0,
      averagePrecedentCount: 0,
      precedentCoverage: 0,
    }
  }
}

export default {
  findSimilarDecisions,
  linkPrecedents,
  getPrecedentChain,
  getSimilarityScore,
  autoLinkPrecedents,
  getPrecedentStats,
}

