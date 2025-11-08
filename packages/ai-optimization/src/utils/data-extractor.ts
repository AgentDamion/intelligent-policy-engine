import { AgentActivity, TrainingExample, HumanFeedback } from '../types/index.js'

/**
 * Extracts training examples from agent_activities JSONB details column
 */
export class DataExtractor {
  /**
   * Convert agent activities to training examples
   */
  static extractTrainingExamples(activities: AgentActivity[]): TrainingExample[] {
    return activities
      .map(activity => this.activityToExample(activity))
      .filter((ex): ex is TrainingExample => ex !== null)
  }

  /**
   * Convert single activity to training example
   */
  private static activityToExample(activity: AgentActivity): TrainingExample | null {
    try {
      // Extract from JSONB details column
      const input = activity.details?.input
      const output = activity.details?.output
      const humanReview = activity.details?.metadata?.human_review

      // Skip if missing essential data
      if (!input || !output) {
        console.warn(`Activity ${activity.id} missing input or output`)
        return null
      }

      // Skip if no human review feedback
      if (!humanReview) {
        return null
      }

      // Calculate score by comparing agent decision to human decision
      const score = this.calculateScore(output, humanReview)

      return {
        id: String(activity.id),
        input,
        agent_output: output,
        human_feedback: humanReview,
        score,
        is_failure: score < 0.7
      }
    } catch (error) {
      console.error(`Error parsing activity ${activity.id}:`, error)
      return null
    }
  }

  /**
   * Calculate score by comparing agent output to human feedback
   */
  private static calculateScore(agentOutput: any, humanFeedback: HumanFeedback): number {
    if (!humanFeedback?.final_decision) {
      return 0.5 // Neutral score if no feedback
    }

    // Extract agent decision from output
    const agentDecision = this.extractDecision(agentOutput)
    const humanDecision = humanFeedback.final_decision

    // Exact match = 1.0, mismatch = 0.0
    if (agentDecision === humanDecision) {
      return 1.0
    }

    // Partial credit for close decisions
    // e.g., approved vs needs_review is better than approved vs rejected
    if (
      (agentDecision === 'approved' && humanDecision === 'needs_review') ||
      (agentDecision === 'needs_review' && humanDecision === 'approved')
    ) {
      return 0.5
    }

    if (
      (agentDecision === 'rejected' && humanDecision === 'needs_review') ||
      (agentDecision === 'needs_review' && humanDecision === 'rejected')
    ) {
      return 0.5
    }

    // Complete mismatch (approved vs rejected)
    return 0.0
  }

  /**
   * Extract decision from agent output
   */
  private static extractDecision(output: any): string {
    // Try different possible output structures
    if (output?.decision?.status) {
      return output.decision.status
    }
    
    if (output?.decision?.type) {
      return output.decision.type
    }
    
    if (output?.status) {
      return output.status
    }

    if (typeof output === 'string') {
      const lower = output.toLowerCase()
      if (lower.includes('approved')) return 'approved'
      if (lower.includes('rejected')) return 'rejected'
      if (lower.includes('needs_review') || lower.includes('review')) return 'needs_review'
    }

    return 'unknown'
  }

  /**
   * Validate that training data has sufficient quality
   */
  static validateTrainingData(examples: TrainingExample[]): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (examples.length < 10) {
      errors.push(`Insufficient examples: ${examples.length} (need at least 10)`)
    }

    const withFeedback = examples.filter(ex => ex.human_feedback)
    if (withFeedback.length < examples.length * 0.8) {
      warnings.push(
        `Only ${withFeedback.length}/${examples.length} examples have human feedback`
      )
    }

    const decisions = examples.map(ex => ex.human_feedback?.final_decision)
    const uniqueDecisions = new Set(decisions)
    
    if (uniqueDecisions.size < 2) {
      warnings.push('Training data only contains one type of decision - may lead to bias')
    }

    const avgScore = examples.reduce((sum, ex) => sum + ex.score, 0) / examples.length
    if (avgScore > 0.95) {
      warnings.push(
        `Average score very high (${avgScore.toFixed(2)}) - agent may already be optimal`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get summary statistics for training data
   */
  static getSummaryStats(examples: TrainingExample[]): {
    total: number
    with_feedback: number
    failures: number
    avg_score: number
    decision_distribution: Record<string, number>
  } {
    const withFeedback = examples.filter(ex => ex.human_feedback)
    const failures = examples.filter(ex => ex.is_failure)
    const avgScore = examples.reduce((sum, ex) => sum + ex.score, 0) / examples.length

    const decisionDistribution: Record<string, number> = {}
    examples.forEach(ex => {
      const decision = ex.human_feedback?.final_decision || 'unknown'
      decisionDistribution[decision] = (decisionDistribution[decision] || 0) + 1
    })

    return {
      total: examples.length,
      with_feedback: withFeedback.length,
      failures: failures.length,
      avg_score: avgScore,
      decision_distribution: decisionDistribution
    }
  }
}

