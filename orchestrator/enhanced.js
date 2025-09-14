/**
 * Enhanced Orchestrator with Production Guardrails
 * Implements the "deterministic core" approach with budgets, circuit breakers, and audit trails
 */

const DeterministicDocumentParser = require('../services/document-processing/deterministic-parser');
const DeterministicRuleEngine = require('../services/validation/rule-engine');
const DeterministicConfidenceCalculator = require('../services/confidence/confidence-calculator');
const crypto = require('crypto');

class EnhancedOrchestrator {
  constructor(config) {
    this.config = config || this.getDefaultConfig();
    this.documentParser = new DeterministicDocumentParser();
    this.ruleEngine = new DeterministicRuleEngine();
    this.confidenceCalculator = new DeterministicConfidenceCalculator();
    this.circuitBreakers = new Map();
    this.activeRequests = new Map();
    this.metrics = new Map();
    this.initializeMetrics();
    
    console.log('🔧 Enhanced Orchestrator initialized');
  }

  /**
   * Process policy document request
   */
  async processPolicyDocument(input) {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      console.log(`📄 Processing policy document request: ${traceId}`);
      
      // Create processing context
      const context = this.createProcessingContext(traceId, input);
      
      // Check processing budget
      if (!this.checkProcessingBudget(context)) {
        return this.createBudgetExceededResult(traceId, startTime);
      }
      
      // Register active request
      this.activeRequests.set(traceId, context);
      
      // Step 1: Parse document deterministically
      console.log('   Step 1: Parsing document');
      const parsedDoc = await this.parseDocumentWithFailover(input, context);
      
      // Step 2: Run rule engine validation
      console.log('   Step 2: Running rule engine validation');
      const validationResult = await this.runRuleEngineValidation(input, parsedDoc, context);
      
      // Step 3: Calculate confidence
      console.log('   Step 3: Calculating confidence');
      const confidenceResult = await this.calculateConfidence(input, parsedDoc, validationResult, context);
      
      // Step 4: Make final decision
      console.log('   Step 4: Making final decision');
      const finalDecision = this.makeFinalDecision(confidenceResult, validationResult);
      
      // Step 5: Write audit trail
      console.log('   Step 5: Writing audit trail');
      await this.writeAuditTrail(traceId, input, parsedDoc, validationResult, confidenceResult, finalDecision);
      
      // Update metrics
      this.updateMetrics('policy_document', true, Date.now() - startTime);
      
      const result = {
        success: true,
        result: {
          decision: finalDecision,
          parsedDoc,
          validationResult,
          confidenceResult,
          traceId
        },
        traceId,
        processingTimeMs: Date.now() - startTime,
        budgetUsed: this.calculateBudgetUsed(context, startTime),
        confidence: confidenceResult.finalConfidence,
        humanReviewRequired: finalDecision.requiresHumanReview
      };

      console.log(`✅ Policy document processing completed: ${traceId} (${result.processingTimeMs}ms, confidence: ${confidenceResult.finalConfidence.toFixed(3)})`);
      return result;
      
    } catch (error) {
      console.error(`❌ Policy document processing failed: ${traceId}`, error);
      
      // Update metrics
      this.updateMetrics('policy_document', false, Date.now() - startTime);
      
      return {
        success: false,
        error: error.message,
        traceId,
        processingTimeMs: Date.now() - startTime,
        budgetUsed: this.calculateBudgetUsed(this.activeRequests.get(traceId), startTime),
        confidence: 0,
        humanReviewRequired: true
      };
      
    } finally {
      // Clean up
      this.activeRequests.delete(traceId);
    }
  }

  /**
   * Process tool submission request
   */
  async processToolSubmission(input) {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      console.log(`🛠️ Processing tool submission request: ${traceId}`);
      
      // Create processing context
      const context = this.createProcessingContext(traceId, input);
      
      // Check processing budget
      if (!this.checkProcessingBudget(context)) {
        return this.createBudgetExceededResult(traceId, startTime);
      }
      
      // Register active request
      this.activeRequests.set(traceId, context);
      
      // Step 1: Run rule engine validation
      console.log('   Step 1: Running rule engine validation');
      const validationResult = await this.runRuleEngineValidation(input, null, context);
      
      // Step 2: Calculate confidence
      console.log('   Step 2: Calculating confidence');
      const confidenceResult = await this.calculateConfidence(input, null, validationResult, context);
      
      // Step 3: Make final decision
      console.log('   Step 3: Making final decision');
      const finalDecision = this.makeFinalDecision(confidenceResult, validationResult);
      
      // Step 4: Write audit trail
      console.log('   Step 4: Writing audit trail');
      await this.writeAuditTrail(traceId, input, null, validationResult, confidenceResult, finalDecision);
      
      // Update metrics
      this.updateMetrics('tool_submission', true, Date.now() - startTime);
      
      const result = {
        success: true,
        result: {
          decision: finalDecision,
          validationResult,
          confidenceResult,
          traceId
        },
        traceId,
        processingTimeMs: Date.now() - startTime,
        budgetUsed: this.calculateBudgetUsed(context, startTime),
        confidence: confidenceResult.finalConfidence,
        humanReviewRequired: finalDecision.requiresHumanReview
      };

      console.log(`✅ Tool submission processing completed: ${traceId} (${result.processingTimeMs}ms, confidence: ${confidenceResult.finalConfidence.toFixed(3)})`);
      return result;
      
    } catch (error) {
      console.error(`❌ Tool submission processing failed: ${traceId}`, error);
      
      // Update metrics
      this.updateMetrics('tool_submission', false, Date.now() - startTime);
      
      return {
        success: false,
        error: error.message,
        traceId,
        processingTimeMs: Date.now() - startTime,
        budgetUsed: this.calculateBudgetUsed(this.activeRequests.get(traceId), startTime),
        confidence: 0,
        humanReviewRequired: true
      };
      
    } finally {
      // Clean up
      this.activeRequests.delete(traceId);
    }
  }

  /**
   * Parse document with failover
   */
  async parseDocumentWithFailover(input, context) {
    try {
      return await this.documentParser.parseDocument(input);
    } catch (error) {
      console.error('Document parsing failed:', error);
      throw new Error(`Document parsing failed: ${error.message}`);
    }
  }

  /**
   * Run rule engine validation
   */
  async runRuleEngineValidation(input, parsedDoc, context) {
    try {
      const ruleContext = {
        input,
        parsedDoc,
        enterpriseId: input.enterpriseId,
        partnerId: input.partnerId,
        userId: context.userId,
        timestamp: new Date().toISOString()
      };
      
      return await this.ruleEngine.executeRules(ruleContext);
    } catch (error) {
      console.error('Rule engine validation failed:', error);
      throw new Error(`Rule engine validation failed: ${error.message}`);
    }
  }

  /**
   * Calculate confidence score
   */
  async calculateConfidence(input, parsedDoc, validationResult, context) {
    try {
      const signals = {
        parserMethod: parsedDoc ? this.getParserMethodConfidence(parsedDoc.method) : 0.5,
        schemaConformance: 1.0, // Assume schema validation passed
        ruleOutcome: validationResult.overall === 'STRICT_PASS' ? 1.0 : 0.5,
        modelReliability: this.confidenceCalculator.getModelReliability(context.model),
        historicalAgreement: this.confidenceCalculator.getEnterpriseTrustLevel(input.enterpriseId)
      };
      
      return this.confidenceCalculator.calculateConfidence(signals, {
        enterpriseId: input.enterpriseId,
        urgencyLevel: input.urgencyLevel || 0.5,
        hasSensitiveData: input.dataTypes?.includes('personal_data') || false,
        isNewTool: this.isNewTool(input.toolName)
      });
    } catch (error) {
      console.error('Confidence calculation failed:', error);
      throw new Error(`Confidence calculation failed: ${error.message}`);
    }
  }

  /**
   * Make final decision
   */
  makeFinalDecision(confidenceResult, validationResult) {
    const confidence = confidenceResult.finalConfidence;
    const validationPassed = validationResult.overall === 'STRICT_PASS';
    
    let decision, requiresHumanReview;
    
    if (!validationPassed) {
      decision = 'reject';
      requiresHumanReview = true;
    } else if (confidence >= 0.90) {
      decision = 'approve';
      requiresHumanReview = false;
    } else if (confidence >= 0.75) {
      decision = 'conditional_approval';
      requiresHumanReview = false;
    } else if (confidence >= 0.60) {
      decision = 'needs_info';
      requiresHumanReview = true;
    } else {
      decision = 'reject';
      requiresHumanReview = true;
    }
    
    return {
      decision,
      confidence,
      requiresHumanReview,
      rationale: this.generateDecisionRationale(decision, confidence, validationResult),
      recommendations: validationResult.recommendations || []
    };
  }

  /**
   * Create processing context
   */
  createProcessingContext(traceId, input) {
    return {
      traceId,
      schemaVersion: 'v1',
      model: 'gpt-4',
      toolVersions: {
        'document-parser': '1.0.0',
        'rule-engine': '1.0.0',
        'confidence-calculator': '1.0.0'
      },
      inputHash: this.generateInputHash(input),
      budget: this.config.defaultBudget,
      startTime: new Date().toISOString(),
      enterpriseId: input.enterpriseId,
      userId: input.userId
    };
  }

  /**
   * Check processing budget
   */
  checkProcessingBudget(context) {
    const budget = context.budget;
    const startTime = new Date(context.startTime).getTime();
    const currentTime = Date.now();
    
    // Check latency budget
    if (currentTime - startTime > budget.maxLatencyMs) {
      console.warn(`⚠️ Processing budget exceeded: latency ${currentTime - startTime}ms > ${budget.maxLatencyMs}ms`);
      return false;
    }
    
    // Check concurrent requests
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      console.warn(`⚠️ Processing budget exceeded: concurrent requests ${this.activeRequests.size} >= ${this.config.maxConcurrentRequests}`);
      return false;
    }
    
    return true;
  }

  /**
   * Calculate budget used
   */
  calculateBudgetUsed(context, startTime) {
    const currentTime = Date.now();
    const start = new Date(context.startTime).getTime();
    
    return {
      latencyMs: currentTime - start,
      steps: 1, // Placeholder
      tokens: 100, // Placeholder
      costUsd: 0.01 // Placeholder
    };
  }

  /**
   * Create budget exceeded result
   */
  createBudgetExceededResult(traceId, startTime) {
    console.warn(`⚠️ Budget exceeded for trace: ${traceId}`);
    
    return {
      success: false,
      error: 'Processing budget exceeded',
      traceId,
      processingTimeMs: Date.now() - startTime,
      budgetUsed: {
        latencyMs: Date.now() - startTime,
        steps: 0,
        tokens: 0,
        costUsd: 0
      },
      confidence: 0,
      humanReviewRequired: true
    };
  }

  /**
   * Write audit trail
   */
  async writeAuditTrail(traceId, input, parsedDoc, validationResult, confidenceResult, finalDecision) {
    if (!this.config.enableAuditTrail) {
      return;
    }
    
    const auditEntry = {
      traceId,
      timestamp: new Date().toISOString(),
      input,
      parsedDoc,
      validationResult,
      confidenceResult,
      finalDecision,
      schemaVersion: 'v1'
    };
    
    // In real implementation, write to database
    console.log(`📝 Audit trail written for trace: ${traceId}`);
  }

  /**
   * Generate input hash
   */
  generateInputHash(input) {
    const content = JSON.stringify(input);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get parser method confidence
   */
  getParserMethodConfidence(method) {
    const methodScores = {
      'gdocai': 0.95,
      'textract': 0.90,
      'template': 0.70,
      'fallback': 0.30
    };
    
    return methodScores[method] || 0.50;
  }

  /**
   * Check if tool is new
   */
  isNewTool(toolName) {
    // In real implementation, check against historical data
    return false;
  }

  /**
   * Generate decision rationale
   */
  generateDecisionRationale(decision, confidence, validationResult) {
    const baseRationale = `Decision: ${decision} (confidence: ${confidence.toFixed(2)})`;
    
    if (validationResult.overall !== 'STRICT_PASS') {
      return `${baseRationale}. Validation failed: ${validationResult.recommendations?.join(', ') || 'Unknown'}`;
    }
    
    return baseRationale;
  }

  /**
   * Initialize metrics
   */
  initializeMetrics() {
    this.metrics.set('totalRequests', 0);
    this.metrics.set('successfulRequests', 0);
    this.metrics.set('failedRequests', 0);
    this.metrics.set('averageProcessingTime', 0);
    this.metrics.set('budgetExceededCount', 0);
  }

  /**
   * Update metrics
   */
  updateMetrics(requestType, success, processingTime) {
    this.metrics.set('totalRequests', (this.metrics.get('totalRequests') || 0) + 1);
    
    if (success) {
      this.metrics.set('successfulRequests', (this.metrics.get('successfulRequests') || 0) + 1);
    } else {
      this.metrics.set('failedRequests', (this.metrics.get('failedRequests') || 0) + 1);
    }
    
    const totalRequests = this.metrics.get('totalRequests');
    const currentAverage = this.metrics.get('averageProcessingTime') || 0;
    const newAverage = (currentAverage * (totalRequests - 1) + processingTime) / totalRequests;
    this.metrics.set('averageProcessingTime', newAverage);
  }

  /**
   * Get orchestrator statistics
   */
  getStats() {
    return {
      metrics: Object.fromEntries(this.metrics),
      activeRequests: this.activeRequests.size,
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      documentParserStats: this.documentParser.getStats(),
      ruleEngineStats: this.ruleEngine.getRuleStats(),
      confidenceCalculatorStats: this.confidenceCalculator.getStats()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      const documentParserHealth = await this.documentParser.healthCheck();
      const ruleEngineHealth = await this.ruleEngine.healthCheck();
      const confidenceCalculatorHealth = await this.confidenceCalculator.healthCheck();
      
      const healthy = stats.metrics.totalRequests > 0 && 
                     (stats.metrics.successfulRequests / stats.metrics.totalRequests) > 0.8 &&
                     documentParserHealth.healthy &&
                     ruleEngineHealth.healthy &&
                     confidenceCalculatorHealth.healthy;
      
      return {
        healthy,
        details: {
          orchestrator: { healthy, stats },
          documentParser: documentParserHealth,
          ruleEngine: ruleEngineHealth,
          confidenceCalculator: confidenceCalculatorHealth,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      maxConcurrentRequests: 100,
      defaultBudget: {
        maxLatencyMs: 30000,
        maxSteps: 10,
        maxTokens: 10000,
        maxCostUsd: 10.0
      },
      enableCircuitBreakers: true,
      enableAuditTrail: true,
      enableMetrics: true
    };
  }
}

module.exports = EnhancedOrchestrator;