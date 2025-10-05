/**
 * Enhanced Agent Coordinator - Implements parallel execution and advanced orchestration
 * This is the core improvement identified in the analysis
 */

const { analyzeWithAI } = require('./ai-service.cjs');
const registry = require('./agent-registry.cjs');

class EnhancedAgentCoordinator {
  constructor() {
    this.agentRegistry = registry;
    this.cache = new Map();
    this.circuitBreakers = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Coordinate multiple agents in parallel with weighted decision synthesis
   */
  async coordinateAgents(requests) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Execute all agents in parallel
      const agentPromises = requests.map(request => this.executeAgentWithCircuitBreaker(request));
      const agentResults = await Promise.allSettled(agentPromises);

      // Separate successful and failed results
      const successfulResults = agentResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const failedResults = agentResults
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

      // Weighted decision synthesis
      const finalDecision = this.synthesizeDecisions(successfulResults, failedResults);
      
      // Calculate confidence based on agent agreement
      const confidence = this.calculateConfidence(successfulResults, finalDecision);

      // Generate synthesized rationale
      const synthesizedRationale = this.generateSynthesizedRationale(successfulResults, finalDecision);

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      return {
        finalDecision,
        confidence,
        agentResults: successfulResults,
        failedAgents: failedResults.length,
        synthesizedRationale,
        recommendedActions: this.getRecommendedActions(finalDecision, successfulResults),
        metadata: {
          processingTime: responseTime,
          agentsExecuted: successfulResults.length,
          agentsFailed: failedResults.length,
          cacheHits: this.getCacheHits(requests),
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      this.metrics.failedRequests++;
      console.error('Enhanced Agent Coordination Error:', error);
      
      return {
        finalDecision: 'HUMAN_IN_LOOP',
        confidence: 0.0,
        error: error.message,
        agentResults: [],
        failedAgents: requests.length,
        synthesizedRationale: 'System error occurred, human review required',
        recommendedActions: ['Escalate to human reviewer', 'Check system logs'],
        metadata: {
          processingTime: Date.now() - startTime,
          agentsExecuted: 0,
          agentsFailed: requests.length,
          error: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Execute agent with circuit breaker pattern
   */
  async executeAgentWithCircuitBreaker(request) {
    const agentName = request.agentName;
    const circuitBreaker = this.getCircuitBreaker(agentName);

    if (circuitBreaker.isOpen()) {
      throw new Error(`Circuit breaker open for agent: ${agentName}`);
    }

    try {
      const result = await this.executeAgent(request);
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  /**
   * Execute individual agent with caching
   */
  async executeAgent(request) {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
      return cached.data;
    }

    const agent = this.agentRegistry.getAgent(request.agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${request.agentName}`);
    }

    const result = await agent.process(request.input, request.context);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: this.getTTL(request.context)
    });

    return result;
  }

  /**
   * Synthesize decisions from multiple agents using weighted voting
   */
  synthesizeDecisions(results, failedResults) {
    if (results.length === 0) {
      return 'HUMAN_IN_LOOP';
    }

    // Weight decisions based on agent type and confidence
    const approvalVotes = [];
    const rejectionVotes = [];
    const humanLoopVotes = [];

    results.forEach(result => {
      const weight = this.getAgentWeight(result.agentName);
      const confidence = result.confidence || 0.5;
      const decision = result.decision?.decision || result.status;

      switch (decision) {
        case 'approved':
          approvalVotes.push({ weight, confidence, agent: result.agentName });
          break;
        case 'rejected':
          rejectionVotes.push({ weight, confidence, agent: result.agentName });
          break;
        case 'conditional':
        case 'requires_review':
          humanLoopVotes.push({ weight, confidence, agent: result.agentName });
          break;
        default:
          humanLoopVotes.push({ weight, confidence, agent: result.agentName });
      }
    });

    // Calculate weighted scores
    const approvalWeight = approvalVotes.reduce(
      (sum, vote) => sum + (vote.weight * vote.confidence), 
      0
    );
    const rejectionWeight = rejectionVotes.reduce(
      (sum, vote) => sum + (vote.weight * vote.confidence), 
      0
    );
    const humanLoopWeight = humanLoopVotes.reduce(
      (sum, vote) => sum + (vote.weight * vote.confidence), 
      0
    );

    // Determine final decision
    if (humanLoopWeight > 0 || failedResults.length > 0) {
      return 'HUMAN_IN_LOOP';
    } else if (rejectionWeight > approvalWeight) {
      return 'REJECTED';
    } else if (approvalWeight > 0) {
      return 'APPROVED';
    } else {
      return 'HUMAN_IN_LOOP';
    }
  }

  /**
   * Calculate confidence based on agent agreement
   */
  calculateConfidence(results, finalDecision) {
    if (results.length === 0) return 0;

    const agreeingAgents = results.filter(result => {
      const decision = result.decision?.decision || result.status;
      return decision === finalDecision || 
             (finalDecision === 'APPROVED' && decision === 'approved') ||
             (finalDecision === 'REJECTED' && decision === 'rejected');
    });

    const agreementRatio = agreeingAgents.length / results.length;
    const averageConfidence = results.reduce(
      (sum, result) => sum + (result.confidence || 0.5), 
      0
    ) / results.length;

    return Math.min(agreementRatio * averageConfidence, 1.0);
  }

  /**
   * Generate synthesized rationale from all agent outputs
   */
  generateSynthesizedRationale(results, finalDecision) {
    const rationales = results
      .map(result => result.decision?.reasoning || result.reasoning || 'No reasoning provided')
      .filter(rationale => rationale && rationale !== 'No reasoning provided');

    if (rationales.length === 0) {
      return `Decision: ${finalDecision} based on ${results.length} agent analysis`;
    }

    // Use AI to synthesize rationales if available
    if (process.env.OPENAI_API_KEY) {
      return this.synthesizeWithAI(rationales, finalDecision);
    }

    // Fallback to simple concatenation
    return `Decision: ${finalDecision}. Rationale: ${rationales.join('; ')}`;
  }

  /**
   * Use AI to synthesize rationales
   */
  async synthesizeWithAI(rationales, finalDecision) {
    try {
      const prompt = `Synthesize these agent rationales into a coherent explanation for decision: ${finalDecision}\n\nRationales:\n${rationales.join('\n\n')}`;
      
      const aiResponse = await analyzeWithAI(prompt, {
        context: 'rationale_synthesis',
        maxTokens: 300
      });

      return aiResponse.response || `Decision: ${finalDecision} based on agent analysis`;
    } catch (error) {
      console.error('AI Synthesis Error:', error);
      return `Decision: ${finalDecision}. Rationale: ${rationales.join('; ')}`;
    }
  }

  /**
   * Get recommended actions based on decision
   */
  getRecommendedActions(finalDecision, results) {
    const actions = [];

    switch (finalDecision) {
      case 'APPROVED':
        actions.push('Proceed with request');
        actions.push('Monitor usage for compliance');
        break;
      case 'REJECTED':
        actions.push('Request denied');
        actions.push('Consider alternative approaches');
        break;
      case 'HUMAN_IN_LOOP':
        actions.push('Escalate to human reviewer');
        actions.push('Gather additional context');
        break;
    }

    // Add agent-specific recommendations
    results.forEach(result => {
      if (result.recommendedActions) {
        actions.push(...result.recommendedActions);
      }
    });

    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Get agent weight for decision synthesis
   */
  getAgentWeight(agentName) {
    const weights = {
      'policy': 1.0,
      'compliance-scoring': 0.9,
      'audit': 0.8,
      'context': 0.7,
      'conflict-detection': 0.8,
      'negotiation': 0.6,
      'pattern-recognition': 0.7,
      'guardrail-orchestrator': 0.9,
      'human-escalation': 0.5,
      'monitoring': 0.6
    };

    return weights[agentName] || 0.5;
  }

  /**
   * Circuit breaker implementation
   */
  getCircuitBreaker(agentName) {
    if (!this.circuitBreakers.has(agentName)) {
      this.circuitBreakers.set(agentName, new CircuitBreaker());
    }
    return this.circuitBreakers.get(agentName);
  }

  /**
   * Cache management
   */
  generateCacheKey(request) {
    return `${request.agentName}:${JSON.stringify(request.input)}:${request.context?.enterprise_id || 'default'}`;
  }

  isExpired(cached) {
    const ttl = cached.ttl || 300000; // 5 minutes default
    return Date.now() - cached.timestamp > ttl;
  }

  getTTL(context) {
    // Longer TTL for stable contexts
    if (context?.enterprise_id && !context?.dynamic) {
      return 600000; // 10 minutes
    }
    return 300000; // 5 minutes
  }

  getCacheHits(requests) {
    return requests.filter(request => {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);
      return cached && !this.isExpired(cached);
    }).length;
  }

  /**
   * Update metrics
   */
  updateMetrics(responseTime, success) {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      circuitBreakerStatus: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [name, cb.getState()])
      )
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Reset circuit breakers
   */
  resetCircuitBreakers() {
    this.circuitBreakers.clear();
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = { EnhancedAgentCoordinator, CircuitBreaker };
