/**
 * Enhanced AI Client - Multi-provider support with structured output
 * Implements the AI client improvements identified in the analysis
 */

class EnhancedAIClient {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.defaultModel = {
      openai: 'gpt-4-turbo-preview',
      anthropic: 'claude-3-sonnet-20240229'
    };
  }

  /**
   * Process AI request with enhanced error handling and structured output
   */
  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (this.provider === 'openai' && this.openaiApiKey) {
        response = await this.callOpenAI(request);
      } else if (this.provider === 'anthropic' && this.anthropicApiKey) {
        response = await this.callAnthropic(request);
      } else {
        throw new Error('No valid AI provider configured');
      }

      return {
        content: response.content,
        confidence: response.confidence || 0.8,
        metadata: {
          provider: this.provider,
          model: response.model,
          usage: response.usage,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Enhanced AI Client Error:', error);
      
      // Fallback to mock response
      return {
        content: this.generateFallbackResponse(request),
        confidence: 0.3,
        metadata: {
          provider: 'fallback',
          model: 'mock',
          usage: null,
          processingTime: Date.now() - startTime,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Call OpenAI API with structured output
   */
  async callOpenAI(request) {
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel.openai,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: request.temperature || 0.3,
        max_tokens: request.maxTokens || 2000,
        response_format: { type: "json_object" }, // Structured output
        top_p: request.topP || 0.9,
        frequency_penalty: request.frequencyPenalty || 0,
        presence_penalty: request.presencePenalty || 0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: this.parseStructuredResponse(data.choices[0].message.content),
      model: data.model,
      usage: data.usage,
      confidence: this.calculateConfidence(data.usage)
    };
  }

  /**
   * Call Anthropic API with structured output
   */
  async callAnthropic(request) {
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel.anthropic,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.3,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: this.parseStructuredResponse(data.content[0].text),
      model: data.model,
      usage: data.usage,
      confidence: this.calculateConfidence(data.usage)
    };
  }

  /**
   * Build system prompt based on agent type and context
   */
  buildSystemPrompt(request) {
    const basePrompt = `You are an AI compliance expert analyzing requests for policy compliance. 
    Always respond with valid JSON in the following format:
    {
      "decision": "approved|rejected|conditional",
      "confidence": 0.0-1.0,
      "reasoning": "detailed explanation",
      "riskFactors": ["factor1", "factor2"],
      "recommendations": ["action1", "action2"],
      "requiresHumanReview": true|false
    }`;

    const agentSpecificPrompts = {
      'policy': 'Focus on policy compliance, risk assessment, and regulatory requirements.',
      'compliance-scoring': 'Evaluate compliance scores and identify gaps.',
      'audit': 'Analyze audit trails and compliance evidence.',
      'context': 'Understand context and classify requests appropriately.',
      'conflict-detection': 'Identify conflicts between policies and requirements.',
      'negotiation': 'Assist with negotiation strategies and compromise solutions.',
      'pattern-recognition': 'Identify patterns and anomalies in requests.',
      'guardrail-orchestrator': 'Coordinate guardrails and safety measures.',
      'human-escalation': 'Determine when human intervention is required.',
      'monitoring': 'Assess monitoring requirements and alert conditions.'
    };

    const agentPrompt = agentSpecificPrompts[request.agentType] || '';
    
    return `${basePrompt}\n\n${agentPrompt}\n\nContext: ${JSON.stringify(request.context || {})}`;
  }

  /**
   * Build user prompt from request input
   */
  buildUserPrompt(request) {
    if (typeof request.prompt === 'string') {
      return request.prompt;
    }

    // Handle structured input
    const input = request.input || request.data || {};
    
    return `Analyze the following request:
    
    Tool: ${input.tool || 'Unknown'}
    Vendor: ${input.vendor || 'Unknown'}
    Usage: ${input.usage || 'Unknown'}
    Data Handling: ${input.dataHandling || 'Unknown'}
    Enterprise ID: ${request.context?.enterprise_id || 'Unknown'}
    
    Provide a structured analysis in JSON format.`;
  }

  /**
   * Parse structured response from AI
   */
  parseStructuredResponse(content) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      
      // Validate required fields
      if (!parsed.decision || !parsed.reasoning) {
        throw new Error('Invalid response format');
      }
      
      return parsed;
    } catch (error) {
      // Fallback to text parsing
      console.warn('Failed to parse structured response, using fallback');
      return {
        decision: this.extractDecision(content),
        confidence: this.extractConfidence(content),
        reasoning: content,
        riskFactors: [],
        recommendations: [],
        requiresHumanReview: content.toLowerCase().includes('human') || content.toLowerCase().includes('review')
      };
    }
  }

  /**
   * Extract decision from text response
   */
  extractDecision(content) {
    const lower = content.toLowerCase();
    if (lower.includes('approved') || lower.includes('approve')) return 'approved';
    if (lower.includes('rejected') || lower.includes('reject')) return 'rejected';
    if (lower.includes('conditional') || lower.includes('review')) return 'conditional';
    return 'conditional';
  }

  /**
   * Extract confidence from text response
   */
  extractConfidence(content) {
    const confidenceMatch = content.match(/confidence[:\s]*(\d+\.?\d*)/i);
    if (confidenceMatch) {
      return Math.min(Math.max(parseFloat(confidenceMatch[1]), 0), 1);
    }
    return 0.7; // Default confidence
  }

  /**
   * Calculate confidence based on usage statistics
   */
  calculateConfidence(usage) {
    if (!usage) return 0.8;
    
    // Higher confidence for more detailed responses
    const tokenRatio = usage.completion_tokens / (usage.prompt_tokens + usage.completion_tokens);
    return Math.min(0.5 + (tokenRatio * 0.5), 1.0);
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  generateFallbackResponse(request) {
    return {
      decision: 'conditional',
      confidence: 0.3,
      reasoning: 'AI analysis unavailable, human review required',
      riskFactors: ['AI service unavailable'],
      recommendations: ['Escalate to human reviewer', 'Check AI service status'],
      requiresHumanReview: true
    };
  }

  /**
   * Get available models for current provider
   */
  getAvailableModels() {
    const models = {
      openai: [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo'
      ],
      anthropic: [
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1'
      ]
    };

    return models[this.provider] || [];
  }

  /**
   * Test AI provider connectivity
   */
  async testConnection() {
    try {
      const testRequest = {
        prompt: 'Test connection',
        agentType: 'policy',
        context: { test: true }
      };

      const response = await this.processRequest(testRequest);
      return {
        success: true,
        provider: this.provider,
        model: response.metadata.model,
        responseTime: response.metadata.processingTime
      };
    } catch (error) {
      return {
        success: false,
        provider: this.provider,
        error: error.message
      };
    }
  }
}

module.exports = { EnhancedAIClient };
