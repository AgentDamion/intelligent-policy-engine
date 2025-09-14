/**
 * SLO Monitoring System
 * Tracks the four golden SLOs for production monitoring
 * Based on regulatory requirements and production reliability
 */

class SLOMonitor {
  constructor() {
    this.sloMetrics = new Map();
    this.driftMetrics = new Map();
    this.alertThresholds = {
      parsingSuccessRate: 0.95,     // 95% minimum
      schemaValidationPassRate: 0.99, // 99% minimum
      ruleEngineStrictPassRate: 0.90, // 90% minimum
      humanReviewRate: 0.20         // 20% maximum
    };
    
    this.initializeMetrics();
    console.log('🔧 SLO Monitor initialized');
  }

  /**
   * Record parsing success metric
   */
  recordParsingSuccess(success, method, processingTimeMs) {
    const timestamp = Date.now();
    const key = this.getTimeWindowKey(timestamp);
    
    if (!this.sloMetrics.has(key)) {
      this.initializeTimeWindow(key);
    }
    
    const metrics = this.sloMetrics.get(key);
    metrics.parsingAttempts++;
    if (success) {
      metrics.parsingSuccesses++;
    }
    
    metrics.parsingMethods[method] = (metrics.parsingMethods[method] || 0) + 1;
    metrics.totalParsingTime += processingTimeMs;
    
    this.sloMetrics.set(key, metrics);
    
    console.log(`📊 Parsing SLO: ${success ? 'SUCCESS' : 'FAILURE'} (${method}, ${processingTimeMs}ms)`);
  }

  /**
   * Record schema validation metric
   */
  recordSchemaValidation(success, errorType = null) {
    const timestamp = Date.now();
    const key = this.getTimeWindowKey(timestamp);
    
    if (!this.sloMetrics.has(key)) {
      this.initializeTimeWindow(key);
    }
    
    const metrics = this.sloMetrics.get(key);
    metrics.schemaValidationAttempts++;
    if (success) {
      metrics.schemaValidationSuccesses++;
    } else {
      metrics.schemaValidationErrors.push({
        errorType,
        timestamp
      });
    }
    
    this.sloMetrics.set(key, metrics);
    
    console.log(`📊 Schema Validation SLO: ${success ? 'SUCCESS' : 'FAILURE'}${errorType ? ` (${errorType})` : ''}`);
  }

  /**
   * Record rule engine metric
   */
  recordRuleEngineValidation(overallOutcome, ruleResults) {
    const timestamp = Date.now();
    const key = this.getTimeWindowKey(timestamp);
    
    if (!this.sloMetrics.has(key)) {
      this.initializeTimeWindow(key);
    }
    
    const metrics = this.sloMetrics.get(key);
    metrics.ruleEngineAttempts++;
    
    if (overallOutcome === 'STRICT_PASS') {
      metrics.ruleEngineStrictPasses++;
    }
    
    // Track individual rule outcomes
    ruleResults.forEach(rule => {
      if (!metrics.ruleOutcomes[rule.ruleId]) {
        metrics.ruleOutcomes[rule.ruleId] = { passes: 0, fails: 0, warnings: 0 };
      }
      
      switch (rule.outcome) {
        case 'STRICT_PASS':
          metrics.ruleOutcomes[rule.ruleId].passes++;
          break;
        case 'STRICT_FAIL':
          metrics.ruleOutcomes[rule.ruleId].fails++;
          break;
        case 'SOFT_WARN':
          metrics.ruleOutcomes[rule.ruleId].warnings++;
          break;
      }
    });
    
    this.sloMetrics.set(key, metrics);
    
    console.log(`📊 Rule Engine SLO: ${overallOutcome} (${ruleResults.length} rules)`);
  }

  /**
   * Record human review requirement
   */
  recordHumanReview(required, reason = null) {
    const timestamp = Date.now();
    const key = this.getTimeWindowKey(timestamp);
    
    if (!this.sloMetrics.has(key)) {
      this.initializeTimeWindow(key);
    }
    
    const metrics = this.sloMetrics.get(key);
    metrics.totalRequests++;
    
    if (required) {
      metrics.humanReviewRequests++;
      metrics.humanReviewReasons.push({
        reason,
        timestamp
      });
    }
    
    this.sloMetrics.set(key, metrics);
    
    console.log(`📊 Human Review SLO: ${required ? 'REQUIRED' : 'NOT REQUIRED'}${reason ? ` (${reason})` : ''}`);
  }

  /**
   * Calculate current SLO metrics
   */
  calculateCurrentSLOs() {
    const currentKey = this.getTimeWindowKey(Date.now());
    const metrics = this.sloMetrics.get(currentKey) || this.initializeTimeWindow(currentKey);
    
    const parsingSuccessRate = metrics.parsingAttempts > 0 
      ? metrics.parsingSuccesses / metrics.parsingAttempts 
      : 1.0;
    
    const schemaValidationPassRate = metrics.schemaValidationAttempts > 0 
      ? metrics.schemaValidationSuccesses / metrics.schemaValidationAttempts 
      : 1.0;
    
    const ruleEngineStrictPassRate = metrics.ruleEngineAttempts > 0 
      ? metrics.ruleEngineStrictPasses / metrics.ruleEngineAttempts 
      : 1.0;
    
    const humanReviewRate = metrics.totalRequests > 0 
      ? metrics.humanReviewRequests / metrics.totalRequests 
      : 0.0;
    
    return {
      parsingSuccessRate,
      schemaValidationPassRate,
      ruleEngineStrictPassRate,
      humanReviewRate,
      timestamp: new Date().toISOString(),
      timeWindow: '1h'
    };
  }

  /**
   * Check for SLO violations
   */
  checkSLOViolations() {
    const slos = this.calculateCurrentSLOs();
    const violations = [];
    
    if (slos.parsingSuccessRate < this.alertThresholds.parsingSuccessRate) {
      violations.push({
        metric: 'parsingSuccessRate',
        current: slos.parsingSuccessRate,
        threshold: this.alertThresholds.parsingSuccessRate,
        severity: 'critical'
      });
    }
    
    if (slos.schemaValidationPassRate < this.alertThresholds.schemaValidationPassRate) {
      violations.push({
        metric: 'schemaValidationPassRate',
        current: slos.schemaValidationPassRate,
        threshold: this.alertThresholds.schemaValidationPassRate,
        severity: 'critical'
      });
    }
    
    if (slos.ruleEngineStrictPassRate < this.alertThresholds.ruleEngineStrictPassRate) {
      violations.push({
        metric: 'ruleEngineStrictPassRate',
        current: slos.ruleEngineStrictPassRate,
        threshold: this.alertThresholds.ruleEngineStrictPassRate,
        severity: 'high'
      });
    }
    
    if (slos.humanReviewRate > this.alertThresholds.humanReviewRate) {
      violations.push({
        metric: 'humanReviewRate',
        current: slos.humanReviewRate,
        threshold: this.alertThresholds.humanReviewRate,
        severity: 'medium'
      });
    }
    
    return {
      violations,
      slos,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate drift metrics
   */
  calculateDriftMetrics() {
    const currentSLOs = this.calculateCurrentSLOs();
    const previousSLOs = this.getPreviousTimeWindowSLOs();
    
    if (!previousSLOs) {
      return {
        agentSchemaFailRate: 0,
        humanInterventionRate: 0,
        confidenceDrift: 0,
        processingTimeDrift: 0,
        timestamp: new Date().toISOString(),
        timeWindow: '1h'
      };
    }
    
    const agentSchemaFailRate = currentSLOs.schemaValidationPassRate - previousSLOs.schemaValidationPassRate;
    const humanInterventionRate = currentSLOs.humanReviewRate - previousSLOs.humanReviewRate;
    const confidenceDrift = this.calculateConfidenceDrift();
    const processingTimeDrift = this.calculateProcessingTimeDrift();
    
    return {
      agentSchemaFailRate,
      humanInterventionRate,
      confidenceDrift,
      processingTimeDrift,
      timestamp: new Date().toISOString(),
      timeWindow: '1h'
    };
  }

  /**
   * Calculate confidence drift
   */
  calculateConfidenceDrift() {
    const currentKey = this.getTimeWindowKey(Date.now());
    const previousKey = this.getTimeWindowKey(Date.now() - 60 * 60 * 1000); // 1 hour ago
    
    const currentMetrics = this.sloMetrics.get(currentKey);
    const previousMetrics = this.sloMetrics.get(previousKey);
    
    if (!currentMetrics || !previousMetrics) {
      return 0;
    }
    
    const currentAvgConfidence = currentMetrics.totalRequests > 0 
      ? currentMetrics.parsingSuccesses / currentMetrics.totalRequests 
      : 0;
    
    const previousAvgConfidence = previousMetrics.totalRequests > 0 
      ? previousMetrics.parsingSuccesses / previousMetrics.totalRequests 
      : 0;
    
    return currentAvgConfidence - previousAvgConfidence;
  }

  /**
   * Calculate processing time drift
   */
  calculateProcessingTimeDrift() {
    const currentKey = this.getTimeWindowKey(Date.now());
    const previousKey = this.getTimeWindowKey(Date.now() - 60 * 60 * 1000); // 1 hour ago
    
    const currentMetrics = this.sloMetrics.get(currentKey);
    const previousMetrics = this.sloMetrics.get(previousKey);
    
    if (!currentMetrics || !previousMetrics || previousMetrics.parsingAttempts === 0) {
      return 0;
    }
    
    const currentAvgTime = currentMetrics.parsingAttempts > 0 
      ? currentMetrics.totalParsingTime / currentMetrics.parsingAttempts 
      : 0;
    
    const previousAvgTime = previousMetrics.totalParsingTime / previousMetrics.parsingAttempts;
    
    return (currentAvgTime - previousAvgTime) / previousAvgTime; // Percentage change
  }

  /**
   * Get previous time window SLOs
   */
  getPreviousTimeWindowSLOs() {
    const previousKey = this.getTimeWindowKey(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const metrics = this.sloMetrics.get(previousKey);
    
    if (!metrics) {
      return null;
    }
    
    const parsingSuccessRate = metrics.parsingAttempts > 0 
      ? metrics.parsingSuccesses / metrics.parsingAttempts 
      : 1.0;
    
    const schemaValidationPassRate = metrics.schemaValidationAttempts > 0 
      ? metrics.schemaValidationSuccesses / metrics.schemaValidationAttempts 
      : 1.0;
    
    const ruleEngineStrictPassRate = metrics.ruleEngineAttempts > 0 
      ? metrics.ruleEngineStrictPasses / metrics.ruleEngineAttempts 
      : 1.0;
    
    const humanReviewRate = metrics.totalRequests > 0 
      ? metrics.humanReviewRequests / metrics.totalRequests 
      : 0.0;
    
    return {
      parsingSuccessRate,
      schemaValidationPassRate,
      ruleEngineStrictPassRate,
      humanReviewRate
    };
  }

  /**
   * Initialize time window metrics
   */
  initializeTimeWindow(key) {
    const metrics = {
      parsingAttempts: 0,
      parsingSuccesses: 0,
      parsingMethods: {},
      totalParsingTime: 0,
      schemaValidationAttempts: 0,
      schemaValidationSuccesses: 0,
      schemaValidationErrors: [],
      ruleEngineAttempts: 0,
      ruleEngineStrictPasses: 0,
      ruleOutcomes: {},
      totalRequests: 0,
      humanReviewRequests: 0,
      humanReviewReasons: []
    };
    
    this.sloMetrics.set(key, metrics);
    return metrics;
  }

  /**
   * Get time window key (1-hour windows)
   */
  getTimeWindowKey(timestamp) {
    const hour = new Date(timestamp).getHours();
    const date = new Date(timestamp).toISOString().split('T')[0];
    return `${date}_${hour}`;
  }

  /**
   * Initialize metrics
   */
  initializeMetrics() {
    const currentKey = this.getTimeWindowKey(Date.now());
    this.initializeTimeWindow(currentKey);
    console.log('📊 SLO metrics initialized');
  }

  /**
   * Clean up old metrics (keep last 24 hours)
   */
  cleanupOldMetrics() {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const cutoffKey = this.getTimeWindowKey(cutoffTime);
    
    for (const key of this.sloMetrics.keys()) {
      if (key < cutoffKey) {
        this.sloMetrics.delete(key);
      }
    }
    
    console.log('🧹 Cleaned up old SLO metrics');
  }

  /**
   * Get comprehensive monitoring report
   */
  getMonitoringReport() {
    const slos = this.calculateCurrentSLOs();
    const violations = this.checkSLOViolations();
    const drift = this.calculateDriftMetrics();
    
    return {
      slos,
      violations: violations.violations,
      drift,
      alertThresholds: this.alertThresholds,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const report = this.getMonitoringReport();
    const healthy = report.violations.length === 0;
    
    return {
      healthy,
      details: {
        report,
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = SLOMonitor;