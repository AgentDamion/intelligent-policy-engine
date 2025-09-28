import { Agent } from '../cursor-agent-registry.js'

export class ContextAgent implements Agent {
  async process(input: any, context: any): Promise<any> {
    console.log('🎯 ContextAgent analyzing user context')

    const contextAnalysis = {
      urgency: this.analyzeUrgency(input),
      userContext: this.analyzeUserContext(input),
      situationalFactors: this.analyzeSituationalFactors(input),
      recommendations: this.generateContextRecommendations(input),
      confidence: 0.85
    }

    return contextAnalysis
  }

  getInfo() {
    return { name: 'ContextAgent', type: 'ContextAnalysis' }
  }

  private analyzeUrgency(input: any): any {
    const urgencyLevel = input.urgency?.level || 0.5
    const timePressure = input.urgency?.timePressure || 0.5
    const emotionalState = input.urgency?.emotionalState || 'neutral'

    return {
      level: urgencyLevel,
      timePressure,
      emotionalState,
      assessment: this.assessUrgencyLevel(urgencyLevel, timePressure, emotionalState),
      factors: this.identifyUrgencyFactors(input)
    }
  }

  private analyzeUserContext(input: any): any {
    return {
      role: input.user?.role || 'unknown',
      department: input.user?.department || 'unknown',
      experience: input.user?.experience || 'unknown',
      accessLevel: input.user?.accessLevel || 'standard',
      location: input.user?.location || 'unknown'
    }
  }

  private analyzeSituationalFactors(input: any): any {
    return {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: [0, 6].includes(new Date().getDay()),
      isHoliday: false, // Could be enhanced with holiday detection
      businessHours: this.isBusinessHours(),
      clientFacing: input.usage?.includes('client_facing') || false
    }
  }

  private generateContextRecommendations(input: any): string[] {
    const recommendations = []

    if (input.urgency?.level > 0.8) {
      recommendations.push('High urgency detected - consider expedited review process')
    }

    if (input.user?.role === 'junior') {
      recommendations.push('Consider additional oversight for junior team members')
    }

    if (this.analyzeSituationalFactors(input).isWeekend) {
      recommendations.push('Weekend processing may require additional approval')
    }

    return recommendations
  }

  private assessUrgencyLevel(level: number, timePressure: number, emotionalState: string): string {
    if (level > 0.8 && timePressure > 0.7) return 'critical'
    if (level > 0.6 || timePressure > 0.5) return 'high'
    if (level > 0.3) return 'medium'
    return 'low'
  }

  private identifyUrgencyFactors(input: any): string[] {
    const factors = []

    if (input.deadline && new Date(input.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      factors.push('tight_deadline')
    }

    if (input.clientName) {
      factors.push('client_involved')
    }

    if (input.budget && input.budget > 100000) {
      factors.push('high_value')
    }

    return factors
  }

  private isBusinessHours(): boolean {
    const hour = new Date().getHours()
    const day = new Date().getDay()
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17
  }
}
