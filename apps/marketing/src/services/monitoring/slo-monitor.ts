/**
 * SLO (Service Level Objectives) Monitoring Service
 * Tracks the four golden SLOs for production compliance
 */

interface SLOMetrics {
  parsingSuccessRate: number;
  schemaValidationPassRate: number;
  ruleEngineStrictPassRate: number;
  humanReviewRate: number;
  timestamp: string;
}

interface SLOThresholds {
  parsingSuccessRate: number; // >95%
  schemaValidationPassRate: number; // >99%
  ruleEngineStrictPassRate: number; // >90%
  humanReviewRate: number; // <20%
}

interface SLOViolation {
  metric: string;
  current: number;
  threshold: number;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
  message: string;
}

export class SLOMonitor {
  private static readonly DEFAULT_THRESHOLDS: SLOThresholds = {
    parsingSuccessRate: 0.95,
    schemaValidationPassRate: 0.99,
    ruleEngineStrictPassRate: 0.90,
    humanReviewRate: 0.20,
  };

  private static metrics: Array<{ 
    type: string; 
    success: boolean; 
    timestamp: Date; 
    details?: any 
  }> = [];

  /**
   * Records a parsing attempt
   */
  static recordParsingAttempt(success: boolean, method: string, details?: any) {
    this.metrics.push({
      type: 'parsing',
      success,
      timestamp: new Date(),
      details: { method, ...details },
    });
    
    if (import.meta.env.DEV) {
      console.debug(`SLO: Parsing ${success ? 'SUCCESS' : 'FAILURE'} (${method})`);
    }
  }

  /**
   * Records a schema validation attempt
   */
  static recordSchemaValidation(success: boolean, schemaType: string, details?: any) {
    this.metrics.push({
      type: 'schema_validation',
      success,
      timestamp: new Date(),
      details: { schemaType, ...details },
    });
    
    if (import.meta.env.DEV) {
      console.debug(`SLO: Schema validation ${success ? 'PASS' : 'FAIL'} (${schemaType})`);
    }
  }

  /**
   * Records a rule engine evaluation
   */
  static recordRuleEngineEvaluation(passed: boolean, rulesApplied: number, details?: any) {
    this.metrics.push({
      type: 'rule_engine',
      success: passed,
      timestamp: new Date(),
      details: { rulesApplied, ...details },
    });
    
    if (import.meta.env.DEV) {
      console.debug(`SLO: Rule engine ${passed ? 'PASS' : 'FAIL'} (${rulesApplied} rules)`);
    }
  }

  /**
   * Records when a document is sent for human review
   */
  static recordHumanReview(reason: string, confidence: number, details?: any) {
    this.metrics.push({
      type: 'human_review',
      success: false, // Any human review counts as not automated
      timestamp: new Date(),
      details: { reason, confidence, ...details },
    });
    
    if (import.meta.env.DEV) {
      console.debug(`SLO: Human review required - ${reason} (confidence: ${confidence})`);
    }
  }

  /**
   * Calculates current SLO metrics
   */
  static calculateMetrics(windowHours: number = 24): SLOMetrics {
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const parsingMetrics = recentMetrics.filter(m => m.type === 'parsing');
    const schemaMetrics = recentMetrics.filter(m => m.type === 'schema_validation');
    const ruleMetrics = recentMetrics.filter(m => m.type === 'rule_engine');
    const humanReviewMetrics = recentMetrics.filter(m => m.type === 'human_review');
    
    const totalProcessingAttempts = Math.max(1, parsingMetrics.length);

    return {
      parsingSuccessRate: parsingMetrics.length > 0 
        ? parsingMetrics.filter(m => m.success).length / parsingMetrics.length 
        : 1.0,
      schemaValidationPassRate: schemaMetrics.length > 0 
        ? schemaMetrics.filter(m => m.success).length / schemaMetrics.length 
        : 1.0,
      ruleEngineStrictPassRate: ruleMetrics.length > 0 
        ? ruleMetrics.filter(m => m.success).length / ruleMetrics.length 
        : 1.0,
      humanReviewRate: humanReviewMetrics.length / totalProcessingAttempts,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks for SLO violations
   */
  static checkViolations(
    thresholds: Partial<SLOThresholds> = {},
    windowHours: number = 24
  ): SLOViolation[] {
    const actualThresholds = { ...this.DEFAULT_THRESHOLDS, ...thresholds };
    const metrics = this.calculateMetrics(windowHours);
    const violations: SLOViolation[] = [];

    // Check parsing success rate
    if (metrics.parsingSuccessRate < actualThresholds.parsingSuccessRate) {
      violations.push({
        metric: 'parsingSuccessRate',
        current: metrics.parsingSuccessRate,
        threshold: actualThresholds.parsingSuccessRate,
        severity: metrics.parsingSuccessRate < 0.90 ? 'CRITICAL' : 'WARNING',
        timestamp: new Date().toISOString(),
        message: `Parsing success rate ${(metrics.parsingSuccessRate * 100).toFixed(1)}% is below threshold ${(actualThresholds.parsingSuccessRate * 100).toFixed(1)}%`,
      });
    }

    // Check schema validation pass rate
    if (metrics.schemaValidationPassRate < actualThresholds.schemaValidationPassRate) {
      violations.push({
        metric: 'schemaValidationPassRate',
        current: metrics.schemaValidationPassRate,
        threshold: actualThresholds.schemaValidationPassRate,
        severity: 'CRITICAL', // Schema validation failures are always critical
        timestamp: new Date().toISOString(),
        message: `Schema validation pass rate ${(metrics.schemaValidationPassRate * 100).toFixed(1)}% is below threshold ${(actualThresholds.schemaValidationPassRate * 100).toFixed(1)}%`,
      });
    }

    // Check rule engine strict pass rate
    if (metrics.ruleEngineStrictPassRate < actualThresholds.ruleEngineStrictPassRate) {
      violations.push({
        metric: 'ruleEngineStrictPassRate',
        current: metrics.ruleEngineStrictPassRate,
        threshold: actualThresholds.ruleEngineStrictPassRate,
        severity: metrics.ruleEngineStrictPassRate < 0.80 ? 'CRITICAL' : 'WARNING',
        timestamp: new Date().toISOString(),
        message: `Rule engine strict pass rate ${(metrics.ruleEngineStrictPassRate * 100).toFixed(1)}% is below threshold ${(actualThresholds.ruleEngineStrictPassRate * 100).toFixed(1)}%`,
      });
    }

    // Check human review rate (inverse - higher is worse)
    if (metrics.humanReviewRate > actualThresholds.humanReviewRate) {
      violations.push({
        metric: 'humanReviewRate',
        current: metrics.humanReviewRate,
        threshold: actualThresholds.humanReviewRate,
        severity: metrics.humanReviewRate > 0.40 ? 'CRITICAL' : 'WARNING',
        timestamp: new Date().toISOString(),
        message: `Human review rate ${(metrics.humanReviewRate * 100).toFixed(1)}% is above threshold ${(actualThresholds.humanReviewRate * 100).toFixed(1)}%`,
      });
    }

    return violations;
  }

  /**
   * Gets a health report with SLO status
   */
  static getHealthReport(windowHours: number = 24) {
    const metrics = this.calculateMetrics(windowHours);
    const violations = this.checkViolations({}, windowHours);
    
    const overallHealth = violations.length === 0 ? 'HEALTHY' : 
                         violations.some(v => v.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING';

    return {
      overall: overallHealth,
      metrics,
      violations,
      summary: {
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'CRITICAL').length,
        warningViolations: violations.filter(v => v.severity === 'WARNING').length,
        reportWindowHours: windowHours,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Clears metrics older than specified days
   */
  static cleanupMetrics(daysToKeep: number = 7) {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const cleaned = initialCount - this.metrics.length;
    console.log(`🧹 SLO: Cleaned up ${cleaned} old metrics (kept ${this.metrics.length})`);
    
    return { cleaned, remaining: this.metrics.length };
  }

  /**
   * Export metrics for external monitoring systems
   */
  static exportMetrics(format: 'json' | 'prometheus' = 'json', windowHours: number = 24) {
    const metrics = this.calculateMetrics(windowHours);
    
    if (format === 'prometheus') {
      return [
        `# HELP aicomply_parsing_success_rate Percentage of successful document parsing attempts`,
        `# TYPE aicomply_parsing_success_rate gauge`,
        `aicomply_parsing_success_rate ${metrics.parsingSuccessRate}`,
        ``,
        `# HELP aicomply_schema_validation_pass_rate Percentage of successful schema validations`,
        `# TYPE aicomply_schema_validation_pass_rate gauge`,
        `aicomply_schema_validation_pass_rate ${metrics.schemaValidationPassRate}`,
        ``,
        `# HELP aicomply_rule_engine_strict_pass_rate Percentage of documents passing rule engine validation`,
        `# TYPE aicomply_rule_engine_strict_pass_rate gauge`,
        `aicomply_rule_engine_strict_pass_rate ${metrics.ruleEngineStrictPassRate}`,
        ``,
        `# HELP aicomply_human_review_rate Percentage of documents requiring human review`,
        `# TYPE aicomply_human_review_rate gauge`,
        `aicomply_human_review_rate ${metrics.humanReviewRate}`,
      ].join('\n');
    }

    return metrics;
  }
}