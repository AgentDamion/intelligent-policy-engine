import { Agent } from '../cursor-agent-registry.ts'
import { aiClient, AIRequest } from '../shared/ai-client.ts'

export class ContextAgent implements Agent {
  async process(input: any, context: any): Promise<any> {
    console.log('🎯 ContextAgent analyzing user context with AI')

    // Prepare AI request for context analysis
    const aiRequest: AIRequest = {
      prompt: this.buildContextPrompt(input),
      context: {
        input,
        enterpriseId: context.enterprise_id,
        tenantId: context.tenantId,
        timestamp: context.timestamp,
        currentTime: new Date().toISOString()
      },
      agentType: 'context',
      enterpriseId: context.enterprise_id,
      temperature: 0.3,
      maxTokens: 1000
    }

    // Get AI analysis
    const aiResponse = await aiClient.processRequest(aiRequest)
    
    // Parse AI response
    let aiAnalysis
    try {
      aiAnalysis = JSON.parse(aiResponse.content)
    } catch {
      // Fallback if AI doesn't return valid JSON
      aiAnalysis = {
        urgency_analysis: this.analyzeUrgency(input),
        user_context: this.analyzeUserContext(input),
        situational_factors: this.analyzeSituationalFactors(input),
        recommendations: this.generateContextRecommendations(input),
        confidence: aiResponse.confidence
      }
    }

    const contextAnalysis = {
      urgency: aiAnalysis.urgency_analysis || this.analyzeUrgency(input),
      userContext: aiAnalysis.user_context || this.analyzeUserContext(input),
      situationalFactors: aiAnalysis.situational_factors || this.analyzeSituationalFactors(input),
      recommendations: aiAnalysis.recommendations || this.generateContextRecommendations(input),
      confidence: aiAnalysis.confidence || aiResponse.confidence,
      aiMetadata: {
        provider: aiResponse.metadata.provider,
        model: aiResponse.metadata.model,
        processingTime: Date.now() - new Date(context.timestamp).getTime()
      }
    }

    return contextAnalysis
  }

  getInfo() {
    return { name: 'ContextAgent', type: 'ContextAnalysis' }
  }

  private buildContextPrompt(input: any): string {
    return `Analyze the user context for this request:

User Input: ${JSON.stringify(input, null, 2)}

Current Time: ${new Date().toISOString()}

Analyze:
1. Urgency level and time pressure
2. User role and experience level
3. Situational factors (time of day, day of week, business hours)
4. Emotional state and stress indicators
5. Client-facing implications
6. Recommendations for handling this request

Provide structured analysis with confidence scoring.`
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
