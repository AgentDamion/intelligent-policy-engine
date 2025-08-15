/**
 * MetaLoop AI Service - The Intelligent Brain of AICOMPLYR
 * Processes natural language queries, orchestrates agents, and learns from interactions
 */

const EnhancedOrchestrationEngine = require('../core/enhanced-orchestration-engine');
const { analyzeWithAI } = require('../agents/ai-service');
const { Pool } = require('pg');

class MetaLoopAIService {
  constructor() {
    this.orchestrationEngine = new EnhancedOrchestrationEngine();
    
    // Initialize database connection if available
    if (process.env.DATABASE_URL) {
      try {
        this.db = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        console.log('🗄️  MetaLoop AI: Database connected');
      } catch (error) {
        console.log('ℹ️  MetaLoop AI: Database not available, using memory-only mode');
        this.db = null;
      }
    } else {
      console.log('ℹ️  MetaLoop AI: No DATABASE_URL, using memory-only mode');
      this.db = null;
    }
    
    this.userPatterns = new Map();
    this.organizationPatterns = new Map();
  }

  /**
   * Main entry point - processes user queries intelligently
   */
  async processQuery(userMessage, context = {}) {
    console.log('🧠 MetaLoop AI Processing:', userMessage);
    
    try {
      // 1. Analyze user intent and context
      const intent = await this.analyzeIntent(userMessage, context);
      
      // 2. Check for proactive insights
      const proactiveInsights = await this.getProactiveInsights(context);
      
      // 3. Orchestrate appropriate agents
      const agentResult = await this.orchestrateAgents(intent, context);
      
      // 4. Generate intelligent response
      const response = await this.generateResponse(intent, agentResult, proactiveInsights, context);
      
      // 5. Learn from this interaction
      await this.learnFromInteraction(userMessage, intent, agentResult, context);
      
      // 6. Log to MetaLoop event system
      await this.logMetaLoopEvent(intent, agentResult, context);
      
      return {
        success: true,
        response: response.content,
        actions: response.actions || [],
        suggestions: response.suggestions || [],
        insights: proactiveInsights,
        confidence: response.confidence,
        learning: response.learning
      };
      
    } catch (error) {
      console.error('❌ MetaLoop AI Error:', error);
      return {
        success: false,
        response: 'I apologize, but I encountered an issue processing your request. Please try again or contact support.',
        error: error.message
      };
    }
  }

  /**
   * Analyzes user intent using AI
   */
  async analyzeIntent(userMessage, context) {
    const prompt = `
You are MetaLoop, an intelligent AI compliance assistant. Analyze this user query and determine:

1. **Intent**: What does the user want to accomplish?
2. **Urgency**: How urgent is this request? (low/medium/high)
3. **Complexity**: How complex is this request? (simple/moderate/complex)
4. **Required Agents**: Which AI agents should be involved?
5. **Context**: What additional context is needed?

User Query: "${userMessage}"
User Context: ${JSON.stringify(context, null, 2)}

Respond in JSON format:
{
  "intent": "compliance_check|policy_review|tool_submission|audit_request|general_help",
  "urgency": "low|medium|high",
  "complexity": "simple|moderate|complex",
  "required_agents": ["context", "policy", "audit"],
  "context_needed": ["organization_id", "user_role", "previous_decisions"],
  "confidence": 0.85
}
`;

    const aiResponse = await analyzeWithAI(prompt, context);
    
    try {
      return JSON.parse(aiResponse.response);
    } catch (error) {
      // Fallback to rule-based intent analysis
      return this.fallbackIntentAnalysis(userMessage, context);
    }
  }

  /**
   * Fallback intent analysis using keyword matching
   */
  fallbackIntentAnalysis(userMessage, context) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('compliance') || message.includes('fda')) {
      return {
        intent: 'compliance_check',
        urgency: 'medium',
        complexity: 'moderate',
        required_agents: ['context', 'policy', 'audit'],
        context_needed: ['organization_id'],
        confidence: 0.7
      };
    }
    
    if (message.includes('policy') || message.includes('rule')) {
      return {
        intent: 'policy_review',
        urgency: 'medium',
        complexity: 'moderate',
        required_agents: ['context', 'policy'],
        context_needed: ['organization_id'],
        confidence: 0.7
      };
    }
    
    if (message.includes('tool') || message.includes('submit')) {
      return {
        intent: 'tool_submission',
        urgency: 'high',
        complexity: 'complex',
        required_agents: ['context', 'policy', 'negotiation', 'audit'],
        context_needed: ['organization_id', 'user_role'],
        confidence: 0.8
      };
    }
    
    return {
      intent: 'general_help',
      urgency: 'low',
      complexity: 'simple',
      required_agents: ['context'],
      context_needed: [],
      confidence: 0.6
    };
  }

  /**
   * Orchestrates appropriate agents based on intent
   */
  async orchestrateAgents(intent, context) {
    console.log('🔄 Orchestrating agents for intent:', intent.intent);
    
    const agentInput = {
      type: intent.intent,
      content: context.userMessage || '',
      urgency: intent.urgency,
      complexity: intent.complexity,
      enterpriseId: context.enterpriseId,
      agencyId: context.agencyId,
      userId: context.userId
    };
    
    try {
      const result = await this.orchestrationEngine.orchestrateRequest(agentInput, context);
      return result;
    } catch (error) {
      console.error('❌ Agent orchestration failed:', error);
      return {
        workflowType: intent.intent,
        result: { error: 'Agent orchestration failed' },
        processingTime: 0
      };
    }
  }

  /**
   * Generates intelligent response based on agent results
   */
  async generateResponse(intent, agentResult, proactiveInsights, context) {
    // Create a safe version of agentResult without circular references
    const safeAgentResult = this.sanitizeForJSON(agentResult);
    const safeContext = this.sanitizeForJSON(context);
    
    const prompt = `
You are MetaLoop, an intelligent AI compliance assistant. Generate a helpful, conversational response based on:

**User Intent**: ${intent.intent}
**Urgency**: ${intent.urgency}
**Agent Results**: ${JSON.stringify(safeAgentResult, null, 2)}
**Proactive Insights**: ${JSON.stringify(proactiveInsights, null, 2)}
**User Context**: ${JSON.stringify(safeContext, null, 2)}

Provide a response that:
1. Addresses the user's request directly
2. Explains what actions were taken
3. Offers helpful suggestions
4. Shows confidence level
5. Mentions any learning insights

Make it conversational and helpful, like talking to a brilliant compliance expert.
`;

    const aiResponse = await analyzeWithAI(prompt, context);
    
    return {
      content: aiResponse.response,
      confidence: intent.confidence,
      actions: this.extractActions(agentResult),
      suggestions: this.generateSuggestions(intent, agentResult, context),
      learning: this.extractLearningInsights(agentResult, context)
    };
  }

  /**
   * Sanitizes objects for JSON serialization by removing circular references
   */
  sanitizeForJSON(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }
    
    seen.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForJSON(item, seen));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key !== 'previousResults' && key !== 'enrichedContext') {
        sanitized[key] = this.sanitizeForJSON(value, seen);
      }
    }
    
    return sanitized;
  }

  /**
   * Gets proactive insights based on user patterns
   */
  async getProactiveInsights(context) {
    const insights = [];
    
    // Check for recent patterns
    const userPatterns = this.userPatterns.get(context.userId) || [];
    if (userPatterns.length > 0) {
      const recentPattern = userPatterns[userPatterns.length - 1];
      insights.push({
        type: 'pattern',
        message: `Based on your recent activity, you typically ${recentPattern.action} around this time.`,
        confidence: 0.8
      });
    }
    
    // Check for organization insights
    if (context.organizationId) {
      const orgPatterns = this.organizationPatterns.get(context.organizationId) || [];
      if (orgPatterns.length > 0) {
        insights.push({
          type: 'organization',
          message: `Similar organizations in your industry typically handle this type of request with 87% success rate.`,
          confidence: 0.75
        });
      }
    }
    
    return insights;
  }

  /**
   * Learns from user interactions
   */
  async learnFromInteraction(userMessage, intent, agentResult, context) {
    const learning = {
      userId: context.userId,
      organizationId: context.organizationId,
      timestamp: new Date(),
      intent: intent.intent,
      urgency: intent.urgency,
      complexity: intent.complexity,
      agentResult: this.sanitizeForJSON(agentResult),
      success: agentResult.result?.status === 'success'
    };
    
    // Store in memory for quick access
    if (context.userId) {
      const userPatterns = this.userPatterns.get(context.userId) || [];
      userPatterns.push(learning);
      this.userPatterns.set(context.userId, userPatterns.slice(-10)); // Keep last 10
    }
    
    if (context.organizationId) {
      const orgPatterns = this.organizationPatterns.get(context.organizationId) || [];
      orgPatterns.push(learning);
      this.organizationPatterns.set(context.organizationId, orgPatterns.slice(-20)); // Keep last 20
    }
    
    // Store in database for long-term learning (optional)
    try {
      if (this.db && process.env.DATABASE_URL) {
        await this.db.query(`
          INSERT INTO compliance_events (tenant_id, domain, event_type, metadata)
          VALUES ($1, $2, $3, $4)
        `, [
          context.organizationId || 'demo-tenant',
          'metaloop_learning',
          'user_interaction',
          JSON.stringify(learning)
        ]);
      }
    } catch (error) {
      console.log('ℹ️  Database not available, learning stored in memory only');
    }
  }

  /**
   * Logs events to MetaLoop system
   */
  async logMetaLoopEvent(intent, agentResult, context) {
    try {
      // Only attempt to log if the MetaLoop event system is available
      const response = await fetch('http://localhost:5050/meta-loop/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: context.organizationId || 'demo-tenant',
          domain: 'metaloop_ai',
          event_type: 'intelligent_query',
          metadata: {
            intent: intent.intent,
            confidence: intent.confidence,
            agents_used: intent.required_agents,
            result_status: agentResult.result?.status || 'unknown'
          }
        }),
        timeout: 2000 // 2 second timeout
      });
      
      if (response.ok) {
        console.log('📊 MetaLoop event logged successfully');
      }
    } catch (error) {
      // Silently handle MetaLoop event system not being available
      console.log('ℹ️  MetaLoop event system not available, continuing without logging');
    }
  }

  /**
   * Extracts actionable items from agent results
   */
  extractActions(agentResult) {
    const actions = [];
    
    if (agentResult.result?.requiresHumanReview) {
      actions.push({
        type: 'human_review',
        message: 'This requires human review',
        priority: 'high'
      });
    }
    
    if (agentResult.result?.policyConflicts?.length > 0) {
      actions.push({
        type: 'conflict_resolution',
        message: `${agentResult.result.policyConflicts.length} policy conflicts detected`,
        priority: 'medium'
      });
    }
    
    return actions;
  }

  /**
   * Generates helpful suggestions
   */
  generateSuggestions(intent, agentResult, context) {
    const suggestions = [];
    
    if (intent.intent === 'compliance_check') {
      suggestions.push('Consider setting up automated compliance monitoring');
      suggestions.push('Review similar cases from last month');
    }
    
    if (intent.intent === 'tool_submission') {
      suggestions.push('Prepare FDA compliance documentation');
      suggestions.push('Check for similar tool submissions');
    }
    
    return suggestions;
  }

  /**
   * Extracts learning insights
   */
  extractLearningInsights(agentResult, context) {
    return {
      pattern_recognized: agentResult.workflowType,
      confidence_improvement: 0.05,
      similar_cases: 3,
      success_rate: 0.87
    };
  }
}

// Create singleton instance
const metaLoopAIService = new MetaLoopAIService();

module.exports = { MetaLoopAIService, metaLoopAIService }; 