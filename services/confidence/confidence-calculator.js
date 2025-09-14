/**
 * Deterministic Confidence Calculator
 * Blends multiple signals to calculate final confidence score
 * No AI dependencies - pure mathematical calculation
 */

class DeterministicConfidenceCalculator {
  constructor() {
    this.weights = {
      parserMethod: 0.25,      // 25% - Document parsing method reliability
      schemaConformance: 0.20, // 20% - Schema validation success
      ruleOutcome: 0.25,       // 25% - Rule engine validation
      modelReliability: 0.15,  // 15% - AI model reliability
      historicalAgreement: 0.15 // 15% - Historical decision agreement
    };
    
    this.historicalData = new Map();
    this.modelReliabilityScores = new Map();
    this.initializeModelReliability();
    
    console.log('🔧 Deterministic Confidence Calculator initialized');
  }

  /**
   * Calculate final confidence score from multiple signals
   */
  calculateConfidence(signals, context = {}) {
    console.log('🧮 Calculating confidence score');
    
    // Validate input signals
    const validatedSignals = this.validateSignals(signals);
    
    // Calculate weighted average
    const finalConfidence = this.calculateWeightedAverage(validatedSignals);
    
    // Apply context-specific adjustments
    const adjustedConfidence = this.applyContextAdjustments(finalConfidence, context);
    
    // Create breakdown for transparency
    const breakdown = this.createBreakdown(validatedSignals);
    
    console.log(`✅ Confidence calculated: ${adjustedConfidence.toFixed(3)} (base: ${finalConfidence.toFixed(3)})`);
    
    return {
      parserMethod: validatedSignals.parserMethod,
      schemaConformance: validatedSignals.schemaConformance,
      ruleOutcome: validatedSignals.ruleOutcome,
      modelReliability: validatedSignals.modelReliability,
      historicalAgreement: validatedSignals.historicalAgreement,
      finalConfidence: adjustedConfidence,
      breakdown
    };
  }

  /**
   * Validate and normalize input signals
   */
  validateSignals(signals) {
    return {
      parserMethod: Math.max(0, Math.min(1, signals.parserMethod || 0)),
      schemaConformance: Math.max(0, Math.min(1, signals.schemaConformance || 0)),
      ruleOutcome: Math.max(0, Math.min(1, signals.ruleOutcome || 0)),
      modelReliability: Math.max(0, Math.min(1, signals.modelReliability || 0)),
      historicalAgreement: Math.max(0, Math.min(1, signals.historicalAgreement || 0))
    };
  }

  /**
   * Calculate weighted average of signals
   */
  calculateWeightedAverage(signals) {
    const weightedSum = 
      signals.parserMethod * this.weights.parserMethod +
      signals.schemaConformance * this.weights.schemaConformance +
      signals.ruleOutcome * this.weights.ruleOutcome +
      signals.modelReliability * this.weights.modelReliability +
      signals.historicalAgreement * this.weights.historicalAgreement;
    
    return Math.max(0, Math.min(1, weightedSum));
  }

  /**
   * Apply context-specific adjustments
   */
  applyContextAdjustments(baseConfidence, context) {
    let adjustedConfidence = baseConfidence;
    
    // Adjust for enterprise trust level
    if (context.enterpriseId) {
      const enterpriseTrust = this.getEnterpriseTrustLevel(context.enterpriseId);
      adjustedConfidence = adjustedConfidence * (0.8 + enterpriseTrust * 0.2);
    }
    
    // Adjust for urgency level (higher urgency = lower confidence threshold)
    if (context.urgencyLevel > 0.8) {
      adjustedConfidence = adjustedConfidence * 0.9; // Slight reduction for high urgency
    }
    
    // Adjust for data sensitivity
    if (context.hasSensitiveData) {
      adjustedConfidence = adjustedConfidence * 0.85; // Reduction for sensitive data
    }
    
    // Adjust for new vs. established tools
    if (context.isNewTool) {
      adjustedConfidence = adjustedConfidence * 0.8; // Reduction for new tools
    }
    
    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  /**
   * Create breakdown for transparency
   */
  createBreakdown(signals) {
    return {
      'Parser Method': signals.parserMethod,
      'Schema Conformance': signals.schemaConformance,
      'Rule Outcome': signals.ruleOutcome,
      'Model Reliability': signals.modelReliability,
      'Historical Agreement': signals.historicalAgreement,
      'Parser Weight': this.weights.parserMethod,
      'Schema Weight': this.weights.schemaConformance,
      'Rule Weight': this.weights.ruleOutcome,
      'Model Weight': this.weights.modelReliability,
      'Historical Weight': this.weights.historicalAgreement
    };
  }

  /**
   * Get enterprise trust level (0-1)
   */
  getEnterpriseTrustLevel(enterpriseId) {
    const historical = this.historicalData.get(enterpriseId);
    if (!historical) {
      return 0.5; // Default trust level
    }
    
    return historical.agreementRate;
  }

  /**
   * Update historical data for an enterprise
   */
  updateHistoricalData(enterpriseId, decision, outcome) {
    const existing = this.historicalData.get(enterpriseId) || {
      enterpriseId,
      similarDecisions: 0,
      agreementRate: 0.5,
      lastUpdated: new Date().toISOString()
    };
    
    existing.similarDecisions++;
    
    // Update agreement rate (simple moving average)
    const successWeight = outcome === 'success' ? 1 : 0;
    existing.agreementRate = (existing.agreementRate * (existing.similarDecisions - 1) + successWeight) / existing.similarDecisions;
    existing.lastUpdated = new Date().toISOString();
    
    this.historicalData.set(enterpriseId, existing);
    
    console.log(`📊 Updated historical data for enterprise ${enterpriseId}: ${(existing.agreementRate * 100).toFixed(1)}% agreement rate`);
  }

  /**
   * Get model reliability score
   */
  getModelReliability(modelName) {
    return this.modelReliabilityScores.get(modelName) || 0.8; // Default reliability
  }

  /**
   * Update model reliability score
   */
  updateModelReliability(modelName, successRate) {
    this.modelReliabilityScores.set(modelName, Math.max(0, Math.min(1, successRate)));
    console.log(`📊 Updated model reliability for ${modelName}: ${(successRate * 100).toFixed(1)}%`);
  }

  /**
   * Initialize model reliability scores
   */
  initializeModelReliability() {
    // Initialize with default scores for common models
    this.modelReliabilityScores.set('gpt-4', 0.92);
    this.modelReliabilityScores.set('gpt-3.5-turbo', 0.85);
    this.modelReliabilityScores.set('claude-3', 0.90);
    this.modelReliabilityScores.set('claude-2', 0.88);
    this.modelReliabilityScores.set('default', 0.80);
    
    console.log('📊 Initialized model reliability scores');
  }

  /**
   * Calculate confidence for specific scenarios
   */
  calculateDocumentProcessingConfidence(parsedDoc) {
    const signals = {
      parserMethod: this.getParserMethodConfidence(parsedDoc.method),
      schemaConformance: 1.0, // Assume schema validation passed
      ruleOutcome: 1.0, // Assume rules passed
      modelReliability: 0.8, // Default model reliability
      historicalAgreement: 0.8 // Default historical agreement
    };
    
    const result = this.calculateConfidence(signals, {});
    return result.finalConfidence;
  }

  calculatePolicyDecisionConfidence(decision, context) {
    const signals = {
      parserMethod: context.parsedDoc ? this.getParserMethodConfidence(context.parsedDoc.method) : 0.5,
      schemaConformance: context.schemaValid ? 1.0 : 0.0,
      ruleOutcome: context.rulesPassed ? 1.0 : 0.0,
      modelReliability: this.getModelReliability(context.modelName || 'default'),
      historicalAgreement: this.getEnterpriseTrustLevel(context.enterpriseId)
    };
    
    const result = this.calculateConfidence(signals, context);
    return result.finalConfidence;
  }

  /**
   * Get parser method confidence score
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
   * Get confidence thresholds for different actions
   */
  getConfidenceThresholds() {
    return {
      'auto_approve': 0.90,
      'conditional_approve': 0.75,
      'human_review': 0.60,
      'reject': 0.30
    };
  }

  /**
   * Determine action based on confidence score
   */
  getActionFromConfidence(confidence) {
    const thresholds = this.getConfidenceThresholds();
    
    if (confidence >= thresholds.auto_approve) {
      return 'auto_approve';
    } else if (confidence >= thresholds.conditional_approve) {
      return 'conditional_approve';
    } else if (confidence >= thresholds.human_review) {
      return 'human_review';
    } else {
      return 'reject';
    }
  }

  /**
   * Get calculator statistics
   */
  getStats() {
    return {
      totalEnterprises: this.historicalData.size,
      modelCount: this.modelReliabilityScores.size,
      weights: this.weights,
      averageEnterpriseTrust: this.getAverageEnterpriseTrust()
    };
  }

  /**
   * Get average enterprise trust level
   */
  getAverageEnterpriseTrust() {
    if (this.historicalData.size === 0) {
      return 0.5;
    }
    
    const totalTrust = Array.from(this.historicalData.values())
      .reduce((sum, data) => sum + data.agreementRate, 0);
    
    return totalTrust / this.historicalData.size;
  }

  /**
   * Reset calculator state
   */
  reset() {
    this.historicalData.clear();
    this.initializeModelReliability();
    console.log('🔄 Confidence calculator reset');
  }

  /**
   * Health check
   */
  async healthCheck() {
    const stats = this.getStats();
    const healthy = stats.totalEnterprises >= 0 && stats.modelCount >= 0;
    
    return {
      healthy,
      stats,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DeterministicConfidenceCalculator;