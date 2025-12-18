import { Agent } from '../cursor-agent-registry.ts'
import { aiClient, AIRequest } from '../shared/ai-client.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cache for loaded prompts (refreshes every 5 minutes)
let cachedPrompt: any = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export class PolicyAgent implements Agent {
  private supabase: any

  constructor() {
    // Initialize Supabase client for prompt loading
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async process(input: any, context: any): Promise<any> {
    console.log('🔍 PolicyAgent processing request with AI:', input.type)

    // Load active prompt from database
    const promptData = await this.getActivePrompt()

    // Fill template with input data
    const userPrompt = this.fillPromptTemplate(promptData.user_prompt_template, input)

    // Prepare AI request with DATABASE prompt
    const aiRequest: AIRequest = {
      prompt: userPrompt,
      systemPrompt: promptData.system_prompt,  // Use DB system prompt
      context: {
        input,
        enterpriseId: context.enterprise_id,
        tenantId: context.tenantId,
        timestamp: context.timestamp,
        promptVersion: promptData.prompt_version
      },
      agentType: 'policy',
      enterpriseId: context.enterprise_id,
      temperature: 0.2, // Lower temperature for consistent policy decisions
      maxTokens: 1500
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
        analysis: aiResponse.content,
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        risk_level: 'medium',
        compliance_status: 'needs_review'
      }
    }

    // Determine final decision based on AI analysis
    const decision = this.makeDecisionFromAI(aiAnalysis, input)
    const riskLevel = aiAnalysis.risk_level || 'medium'
    const riskFactors = aiAnalysis.metadata?.key_factors || []

    return {
      request: {
        originalContent: input.content || "Request processed",
        user: {
          role: input.user?.role || "marketing_agency_employee",
          urgency_level: input.urgency?.level || 0.5,
          emotional_state: input.urgency?.emotionalState || "neutral"
        },
        request: {
          tool: input.tool?.toLowerCase(),
          purpose: this.inferPurpose(input.usage),
          presentation_type: "client_presentation",
          confidence: aiAnalysis.confidence,
          deadline: "pending",
          current_time: new Date().toISOString()
        },
        context: {
          time_pressure: input.urgency?.timePressure || 0.5,
          is_weekend: false,
          is_client_facing: true
        }
      },
      decision: {
        type: "policy_evaluation",
        status: decision.status,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning,
        riskLevel: riskLevel,
        requiresHumanReview: decision.requiresHumanReview,
        riskFactors: riskFactors,
        conditions: {
          guardrails: {
            fda_compliance: decision.fdaCompliance,
            gdpr_compliance: decision.gdprCompliance,
            risk_threshold: 0.7
          }
        }
      },
      metadata: {
        processingTime: Date.now() - new Date(context.timestamp).getTime(),
        agentVersion: "3.0-AI",
        modelAccuracy: aiAnalysis.confidence,
        aiProvider: aiResponse.metadata.provider,
        aiModel: aiResponse.metadata.model,
        aiUsage: aiResponse.metadata.usage
      }
    }
  }

  getInfo() {
    return { name: 'PolicyAgent', type: 'PolicyEvaluation' }
  }

  /**
   * Get active prompt from database with caching
   */
  private async getActivePrompt(): Promise<any> {
    const now = Date.now()

    // Check if cache is still valid
    if (cachedPrompt && (now - cacheTimestamp) < CACHE_TTL) {
      return cachedPrompt
    }

    try {
      // Query database for active prompt
      const { data, error } = await this.supabase
        .from('agent_prompts_v2')
        .select('*')
        .eq('agent_type', 'PolicyAgent')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.warn('⚠️  Failed to load prompt from DB, using fallback:', error?.message)
        return this.getFallbackPrompt()
      }

      // Update cache
      cachedPrompt = data
      cacheTimestamp = now

      console.log(`✅ Using PolicyAgent prompt version ${data.prompt_version}`)
      return data

    } catch (err) {
      console.error('❌ Error loading prompt from database:', err)
      return this.getFallbackPrompt()
    }
  }

  /**
   * Fallback to hardcoded prompt if database unavailable
   */
  private getFallbackPrompt(): any {
    return {
      system_prompt: `You are a policy compliance evaluator for AI governance and enterprise risk management.

Your role is to analyze AI tool and service requests against enterprise policies, regulatory requirements, and risk frameworks.

Key Responsibilities:
- Evaluate regulatory compliance (GDPR, HIPAA, FDA, PCI-DSS, SOC2)
- Assess data privacy and security risks
- Identify potential legal and ethical concerns
- Consider vendor reputation and trustworthiness
- Evaluate business impact and operational risks

Decision Framework:
- APPROVED: Low risk tools from trusted vendors with appropriate safeguards
- REJECTED: High risk tools with clear compliance violations or security threats
- NEEDS_REVIEW: Medium risk scenarios requiring human judgment

Be thorough in your analysis but err on the side of caution for sensitive use cases.`,
      user_prompt_template: `Analyze this policy request for compliance and risk:

Tool: {tool}
Vendor: {vendor}
Usage: {usage}
Data Handling: {dataHandling}
Content: {content}

Assess:
1. Regulatory compliance (GDPR, HIPAA, FDA, etc.)
2. Data privacy risks
3. Security implications
4. Business risk factors
5. Recommended approval status

Provide structured analysis with confidence scoring.`,
      prompt_version: 1
    }
  }

  /**
   * Fill template placeholders with actual input data
   */
  private fillPromptTemplate(template: string, input: any): string {
    return template
      .replace(/{tool}/g, input.tool || 'Unknown')
      .replace(/{vendor}/g, input.vendor || 'Unknown')
      .replace(/{usage}/g, input.usage || 'Unknown')
      .replace(/{dataHandling}/g, JSON.stringify(input.dataHandling || []))
      .replace(/{content}/g, input.content || 'No content provided')
  }

  private buildPolicyPrompt(input: any): string {
    return `Analyze this policy request for compliance and risk:

Tool: ${input.tool || 'Unknown'}
Vendor: ${input.vendor || 'Unknown'}
Usage: ${input.usage || 'Unknown'}
Data Handling: ${JSON.stringify(input.dataHandling || [])}
Content: ${input.content || 'No content provided'}

Assess:
1. Regulatory compliance (GDPR, HIPAA, FDA, etc.)
2. Data privacy risks
3. Security implications
4. Business risk factors
5. Recommended approval status

Provide structured analysis with confidence scoring.`
  }

  private makeDecisionFromAI(aiAnalysis: any, input: any) {
    const complianceStatus = aiAnalysis.compliance_status || 'needs_review'
    const riskLevel = aiAnalysis.risk_level || 'medium'
    
    let status = 'approved'
    if (complianceStatus === 'non_compliant') status = 'rejected'
    if (complianceStatus === 'needs_review' || riskLevel === 'high') status = 'needs_review'
    
    const requiresHumanReview = status === 'needs_review' || riskLevel === 'high'
    
    return {
      status,
      confidence: aiAnalysis.confidence || 0.8,
      requiresHumanReview,
      fdaCompliance: !input.tool?.toLowerCase().includes('medical') || riskLevel !== 'high',
      gdprCompliance: !input.dataHandling?.includes('personal_data_without_consent'),
      riskThreshold: 0.7
    }
  }

  private calculateEnhancedRiskScore(input: any): number {
    let riskScore = 0.5 // Base risk

    // Tool-based risk factors
    if (input.tool) {
      const toolLower = input.tool.toLowerCase()
      if (toolLower.includes('medical') || toolLower.includes('healthcare')) riskScore += 0.3
      if (toolLower.includes('financial') || toolLower.includes('payment')) riskScore += 0.2
      if (toolLower.includes('social') || toolLower.includes('media')) riskScore += 0.1
    }

    // Data handling risk factors
    if (input.dataHandling) {
      if (input.dataHandling.includes('personal_data')) riskScore += 0.2
      if (input.dataHandling.includes('sensitive_data')) riskScore += 0.3
      if (input.dataHandling.includes('medical_records')) riskScore += 0.4
    }

    // Usage context risk factors
    if (input.usage) {
      if (input.usage.includes('client_facing')) riskScore += 0.1
      if (input.usage.includes('public')) riskScore += 0.2
      if (input.usage.includes('regulatory')) riskScore += 0.3
    }

    // Urgency level impact
    if (input.urgency?.level > 0.8) riskScore += 0.1
    if (input.urgency?.level < 0.3) riskScore -= 0.1

    return Math.min(1.0, Math.max(0.0, riskScore))
  }

  private makeEnhancedDecision(riskScore: number, input: any) {
    const confidence = Math.max(0.6, 1.0 - riskScore * 0.4)
    const requiresHumanReview = riskScore > 0.7 || input.urgency?.level > 0.9
    const fdaCompliance = riskScore < 0.8
    const gdprCompliance = !input.dataHandling?.includes('personal_data_without_consent')

    let status = 'approved'
    if (riskScore > 0.7) status = 'needs_review'
    if (riskScore > 0.9) status = 'rejected'

    return {
      status,
      confidence,
      requiresHumanReview,
      fdaCompliance,
      gdprCompliance,
      riskThreshold: 0.7
    }
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore > 0.8) return 'high'
    if (riskScore > 0.6) return 'medium'
    return 'low'
  }

  private getRiskFactors(input: any): string[] {
    const factors = []
    if (input.tool?.toLowerCase().includes('medical')) factors.push('medical_content_risk')
    if (input.dataHandling?.includes('personal_data')) factors.push('privacy_risk')
    if (input.usage?.includes('public')) factors.push('reputational_risk')
    return factors
  }

  private getDecisionReasoning(riskScore: number, decision: any): string {
    if (decision.status === 'rejected') {
      return `Request rejected due to high risk score (${Math.round(riskScore * 100)}%). Requires human review.`
    }
    if (decision.status === 'needs_review') {
      return `Request flagged for review due to elevated risk score (${Math.round(riskScore * 100)}%).`
    }
    return `Request approved with confidence ${Math.round(decision.confidence * 100)}%.`
  }

  private inferPurpose(usage: any): string {
    if (typeof usage === 'string') {
      if (usage.includes('presentation')) return 'client_presentation'
      if (usage.includes('analysis')) return 'data_analysis'
      if (usage.includes('content')) return 'content_creation'
    }
    return 'general_use'
  }
}
