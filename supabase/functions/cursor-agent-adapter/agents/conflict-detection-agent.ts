import { Agent } from '../cursor-agent-registry.js'

export class ConflictDetectionAgent implements Agent {
  async process(input: any, context: any): Promise<any> {
    console.log('⚔️ ConflictDetectionAgent analyzing conflicts')

    const conflicts = this.detectConflicts(input)
    const severity = this.assessConflictSeverity(conflicts)
    const recommendations = this.generateConflictRecommendations(conflicts)

    return {
      conflicts: {
        total: conflicts.length,
        types: this.categorizeConflicts(conflicts),
        severity: severity,
        details: conflicts
      },
      resolution: {
        possible: conflicts.length < 3,
        strategies: this.generateResolutionStrategies(conflicts),
        requiresHumanReview: severity === 'high' || conflicts.length > 2
      },
      recommendations: recommendations,
      confidence: 0.9,
      metadata: {
        analysisTime: new Date().toISOString(),
        algorithmVersion: '2.0'
      }
    }
  }

  getInfo() {
    return { name: 'ConflictDetectionAgent', type: 'ConflictAnalysis' }
  }

  private detectConflicts(input: any): any[] {
    const conflicts = []

    // Policy conflicts
    if (input.policies && input.policies.length > 1) {
      for (let i = 0; i < input.policies.length; i++) {
        for (let j = i + 1; j < input.policies.length; j++) {
          const policy1 = input.policies[i]
          const policy2 = input.policies[j]

          if (this.policiesConflict(policy1, policy2, input)) {
            conflicts.push({
              type: 'policy_conflict',
              policies: [policy1.name, policy2.name],
              description: `Policies "${policy1.name}" and "${policy2.name}" have conflicting requirements`,
              severity: 'medium'
            })
          }
        }
      }
    }

    // Client conflicts
    if (input.clients && input.clients.length > 1) {
      const clientConflicts = this.detectClientConflicts(input.clients, input)
      conflicts.push(...clientConflicts)
    }

    // Data handling conflicts
    if (input.dataHandling) {
      const dataConflicts = this.detectDataHandlingConflicts(input.dataHandling, input)
      conflicts.push(...dataConflicts)
    }

    return conflicts
  }

  private policiesConflict(policy1: any, policy2: any, input: any): boolean {
    // Check for conflicting requirements
    if (policy1.dataRetention !== policy2.dataRetention) {
      if (input.dataHandling?.includes('retention_sensitive')) {
        return true
      }
    }

    if (policy1.approvalRequired !== policy2.approvalRequired) {
      if (input.usage?.includes('high_risk')) {
        return true
      }
    }

    return false
  }

  private detectClientConflicts(clients: any[], input: any): any[] {
    const conflicts = []

    for (let i = 0; i < clients.length; i++) {
      for (let j = i + 1; j < clients.length; j++) {
        const client1 = clients[i]
        const client2 = clients[j]

        if (client1.industry !== client2.industry && input.tool?.includes('industry_specific')) {
          conflicts.push({
            type: 'client_industry_conflict',
            clients: [client1.name, client2.name],
            description: `Conflicting industry requirements between ${client1.name} and ${client2.name}`,
            severity: 'high'
          })
        }
      }
    }

    return conflicts
  }

  private detectDataHandlingConflicts(dataHandling: string[], input: any): any[] {
    const conflicts = []

    if (dataHandling.includes('personal_data') && dataHandling.includes('public_disclosure')) {
      conflicts.push({
        type: 'data_handling_conflict',
        description: 'Personal data cannot be publicly disclosed',
        severity: 'critical'
      })
    }

    if (dataHandling.includes('medical_data') && !dataHandling.includes('hipaa_compliant')) {
      conflicts.push({
        type: 'compliance_conflict',
        description: 'Medical data requires HIPAA compliance',
        severity: 'high'
      })
    }

    return conflicts
  }

  private assessConflictSeverity(conflicts: any[]): string {
    if (conflicts.some(c => c.severity === 'critical')) return 'critical'
    if (conflicts.some(c => c.severity === 'high')) return 'high'
    if (conflicts.length > 3) return 'medium'
    return 'low'
  }

  private categorizeConflicts(conflicts: any[]): string[] {
    const types = conflicts.map(c => c.type)
    return [...new Set(types)]
  }

  private generateConflictRecommendations(conflicts: any[]): string[] {
    const recommendations = []

    if (conflicts.some(c => c.severity === 'critical')) {
      recommendations.push('Critical conflicts detected - immediate human review required')
    }

    if (conflicts.some(c => c.type === 'policy_conflict')) {
      recommendations.push('Policy conflicts detected - consider policy harmonization')
    }

    if (conflicts.some(c => c.type === 'client_industry_conflict')) {
      recommendations.push('Client industry conflicts - separate client handling may be required')
    }

    return recommendations
  }

  private generateResolutionStrategies(conflicts: any[]): string[] {
    const strategies = []

    if (conflicts.some(c => c.type === 'policy_conflict')) {
      strategies.push('Create unified policy framework')
      strategies.push('Implement policy precedence rules')
    }

    if (conflicts.some(c => c.type === 'client_industry_conflict')) {
      strategies.push('Segment client data and processing')
      strategies.push('Create industry-specific workflows')
    }

    return strategies
  }
}
