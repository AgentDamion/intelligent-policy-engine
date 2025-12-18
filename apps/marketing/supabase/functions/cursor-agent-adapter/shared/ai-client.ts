// AI Client for real AI model integration
// Supports OpenAI and Anthropic APIs

export interface AIResponse {
  content: string
  confidence: number
  reasoning: string
  metadata: Record<string, any>
}

export interface AIRequest {
  prompt: string
  context: any
  agentType: string
  enterpriseId: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string  // Optional: Override default system prompt
}

export class AIClient {
  private openaiApiKey: string
  private anthropicApiKey: string
  private provider: string

  constructor() {
    this.openaiApiKey = Deno.env.get('OPENAI_API_KEY') || ''
    this.anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || ''
    this.provider = Deno.env.get('AI_PROVIDER') || 'openai'
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      if (this.provider === 'openai' && this.openaiApiKey) {
        return await this.callOpenAI(request)
      } else if (this.provider === 'anthropic' && this.anthropicApiKey) {
        return await this.callAnthropic(request)
      } else {
        throw new Error(`No valid AI provider configured. Provider: ${this.provider}`)
      }
    } catch (error) {
      console.error('AI Client Error:', error)
      // Fallback to structured response
      return this.createFallbackResponse(request)
    }
  }

  private async callOpenAI(request: AIRequest): Promise<AIResponse> {
    const systemPrompt = request.systemPrompt || this.getSystemPrompt(request.agentType)
    const userPrompt = this.buildUserPrompt(request)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: request.temperature || 0.3,
        max_tokens: request.maxTokens || 2000,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = JSON.parse(data.choices[0].message.content)

    return {
      content: aiResponse.analysis || aiResponse.content || 'Analysis completed',
      confidence: aiResponse.confidence || 0.8,
      reasoning: aiResponse.reasoning || 'AI analysis completed',
      metadata: {
        model: 'gpt-4-turbo-preview',
        provider: 'openai',
        usage: data.usage,
        ...aiResponse.metadata
      }
    }
  }

  private async callAnthropic(request: AIRequest): Promise<AIResponse> {
    const systemPrompt = request.systemPrompt || this.getSystemPrompt(request.agentType)
    const userPrompt = this.buildUserPrompt(request)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: request.temperature || 0.3,
        max_tokens: request.maxTokens || 2000
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse structured response from Claude
    let aiResponse
    try {
      aiResponse = JSON.parse(content)
    } catch {
      aiResponse = {
        analysis: content,
        confidence: 0.8,
        reasoning: 'Claude analysis completed'
      }
    }

    return {
      content: aiResponse.analysis || aiResponse.content || content,
      confidence: aiResponse.confidence || 0.8,
      reasoning: aiResponse.reasoning || 'AI analysis completed',
      metadata: {
        model: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        usage: data.usage,
        ...aiResponse.metadata
      }
    }
  }

  private getSystemPrompt(agentType: string): string {
    const basePrompt = `You are an AI agent specialized in enterprise policy compliance and risk assessment. You must respond with valid JSON containing: analysis, confidence (0-1), reasoning, and metadata.`

    switch (agentType) {
      case 'policy':
        return `${basePrompt} Focus on policy compliance, risk assessment, and regulatory requirements. Analyze tools, data handling, and usage context for compliance violations.`
      
      case 'context':
        return `${basePrompt} Focus on user context analysis, urgency assessment, and situational factors that might affect policy decisions.`
      
      case 'audit':
        return `${basePrompt} Focus on audit trail analysis, compliance verification, and risk identification in enterprise activities.`
      
      case 'compliance-scoring':
        return `${basePrompt} Focus on scoring compliance levels, identifying gaps, and providing improvement recommendations.`
      
      default:
        return basePrompt
    }
  }

  private buildUserPrompt(request: AIRequest): string {
    return `Analyze the following request and context:

INPUT DATA:
${JSON.stringify(request.context, null, 2)}

ENTERPRISE CONTEXT:
- Enterprise ID: ${request.enterpriseId}
- Agent Type: ${request.agentType}
- Timestamp: ${new Date().toISOString()}

Please provide a structured analysis in JSON format with:
{
  "analysis": "Detailed analysis of the request",
  "confidence": 0.85,
  "reasoning": "Explanation of your assessment",
  "risk_level": "low|medium|high",
  "compliance_status": "compliant|non_compliant|needs_review",
  "recommendations": ["specific", "actionable", "recommendations"],
  "metadata": {
    "processing_time": "estimated_time",
    "key_factors": ["factor1", "factor2"],
    "confidence_factors": ["why_high_confidence", "potential_uncertainties"]
  }
}`
  }

  private createFallbackResponse(request: AIRequest): AIResponse {
    return {
      content: `Fallback analysis for ${request.agentType} agent`,
      confidence: 0.5,
      reasoning: 'AI service unavailable, using fallback logic',
      metadata: {
        provider: 'fallback',
        agentType: request.agentType,
        enterpriseId: request.enterpriseId
      }
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient()
