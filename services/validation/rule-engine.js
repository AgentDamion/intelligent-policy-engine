/**
 * Deterministic Rule Engine
 * Implements strict rule validation with no AI dependencies
 * Based on lessons from hackathon: deterministic validation prevents drift
 */

class DeterministicRuleEngine {
  constructor() {
    this.rules = new Map();
    this.ruleCategories = new Map();
    this.executionStats = new Map();
    this.initializeDefaultRules();
    
    console.log('🔧 Deterministic Rule Engine initialized');
  }

  /**
   * Execute all applicable rules against context
   */
  async executeRules(context) {
    console.log('🔍 Executing rule engine validation');
    
    const results = [];
    
    // Get applicable rules
    const applicableRules = this.getApplicableRules(context);
    
    // Execute each rule
    for (const rule of applicableRules) {
      try {
        const result = rule.validator(context);
        const ruleResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          outcome: result.outcome,
          message: result.message,
          confidence: result.confidence,
          applicable: result.applicable
        };
        
        results.push(ruleResult);
        this.updateRuleStats(rule.id, result.outcome);
        
        console.log(`   Rule ${rule.id}: ${result.outcome} - ${result.message}`);
        
      } catch (error) {
        console.error(`❌ Rule ${rule.id} execution failed:`, error);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          outcome: 'STRICT_FAIL',
          message: `Rule execution failed: ${error.message}`,
          confidence: 0,
          applicable: true
        });
      }
    }

    // Calculate overall validation result
    const overallResult = this.calculateOverallResult(results);
    const confidence = this.calculateConfidence(results);
    const requiresHumanReview = this.requiresHumanReview(results);
    const recommendations = this.generateRecommendations(results);
    
    console.log(`✅ Rule engine validation completed: ${overallResult} (confidence: ${confidence.toFixed(2)})`);
    
    return {
      overall: overallResult,
      rules: results,
      confidence,
      humanReviewRequired: requiresHumanReview,
      recommendations
    };
  }

  /**
   * Get applicable rules for context
   */
  getApplicableRules(context) {
    const applicable = [];
    
    for (const rule of this.rules.values()) {
      if (rule.enabled && this.isRuleApplicable(rule, context)) {
        applicable.push(rule);
      }
    }
    
    return applicable;
  }

  /**
   * Check if rule is applicable to context
   */
  isRuleApplicable(rule, context) {
    // Basic applicability checks
    if (rule.category === 'compliance' && !context.enterpriseId) {
      return false;
    }
    
    if (rule.category === 'security' && !context.input) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate overall validation result
   */
  calculateOverallResult(results) {
    if (results.length === 0) {
      return 'STRICT_PASS';
    }

    const hasStrictFail = results.some(r => r.outcome === 'STRICT_FAIL');
    const hasSoftWarn = results.some(r => r.outcome === 'SOFT_WARN');
    
    if (hasStrictFail) {
      return 'STRICT_FAIL';
    }
    
    if (hasSoftWarn) {
      return 'SOFT_WARN';
    }
    
    return 'STRICT_PASS';
  }

  /**
   * Calculate overall confidence
   */
  calculateConfidence(results) {
    if (results.length === 0) {
      return 1.0;
    }
    
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    return totalConfidence / results.length;
  }

  /**
   * Determine if human review is required
   */
  requiresHumanReview(results) {
    return results.some(r => 
      r.outcome === 'STRICT_FAIL' || 
      r.outcome === 'SOFT_WARN' ||
      r.confidence < 0.7
    );
  }

  /**
   * Generate recommendations based on rule results
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    for (const result of results) {
      if (result.outcome === 'STRICT_FAIL') {
        recommendations.push(`CRITICAL: ${result.message}`);
      } else if (result.outcome === 'SOFT_WARN') {
        recommendations.push(`WARNING: ${result.message}`);
      }
    }
    
    return recommendations;
  }

  /**
   * Update rule execution statistics
   */
  updateRuleStats(ruleId, outcome) {
    const stats = this.executionStats.get(ruleId) || {
      executions: 0,
      passes: 0,
      fails: 0,
      warnings: 0
    };
    
    stats.executions++;
    
    switch (outcome) {
      case 'STRICT_PASS':
        stats.passes++;
        break;
      case 'STRICT_FAIL':
        stats.fails++;
        break;
      case 'SOFT_WARN':
        stats.warnings++;
        break;
    }
    
    this.executionStats.set(ruleId, stats);
  }

  /**
   * Initialize default rules
   */
  initializeDefaultRules() {
    console.log('📋 Initializing default rules');
    
    // Compliance Rules
    this.addRule({
      id: 'compliance-gdpr-data-types',
      name: 'GDPR Data Types Check',
      description: 'Ensure GDPR compliance for personal data processing',
      category: 'compliance',
      severity: 'critical',
      enabled: true,
      validator: (context) => {
        const dataTypes = context.input?.dataTypes || [];
        const hasPersonalData = dataTypes.includes('personal_data');
        
        if (hasPersonalData && !context.input?.gdprCompliance) {
          return {
            outcome: 'STRICT_FAIL',
            message: 'GDPR compliance required for personal data processing',
            confidence: 1.0,
            applicable: true
          };
        }
        
        return {
          outcome: 'STRICT_PASS',
          message: 'GDPR compliance check passed',
          confidence: 1.0,
          applicable: true
        };
      }
    });

    // Security Rules
    this.addRule({
      id: 'security-client-facing-restriction',
      name: 'Client-Facing Tool Restriction',
      description: 'Restrict certain tools from client-facing use',
      category: 'security',
      severity: 'high',
      enabled: true,
      validator: (context) => {
        const toolName = context.input?.toolName?.toLowerCase() || '';
        const clientFacing = context.input?.clientFacing || false;
        
        const restrictedTools = ['image-generator', 'deepfake', 'voice-clone'];
        const isRestricted = restrictedTools.some(tool => toolName.includes(tool));
        
        if (isRestricted && clientFacing) {
          return {
            outcome: 'STRICT_FAIL',
            message: `Tool '${toolName}' is restricted for client-facing use`,
            confidence: 1.0,
            applicable: true
          };
        }
        
        return {
          outcome: 'STRICT_PASS',
          message: 'Client-facing tool restriction check passed',
          confidence: 1.0,
          applicable: true
        };
      }
    });

    // Business Rules
    this.addRule({
      id: 'business-urgency-approval',
      name: 'Urgency Approval Requirement',
      description: 'High urgency requests require additional approval',
      category: 'business',
      severity: 'medium',
      enabled: true,
      validator: (context) => {
        const urgencyLevel = context.input?.urgencyLevel || 0;
        
        if (urgencyLevel > 0.8 && !context.input?.urgentApproval) {
          return {
            outcome: 'SOFT_WARN',
            message: 'High urgency requests should have additional approval',
            confidence: 0.8,
            applicable: true
          };
        }
        
        return {
          outcome: 'STRICT_PASS',
          message: 'Urgency approval check passed',
          confidence: 1.0,
          applicable: true
        };
      }
    });

    // Technical Rules
    this.addRule({
      id: 'technical-file-size-limit',
      name: 'File Size Limit',
      description: 'Enforce file size limits for processing',
      category: 'technical',
      severity: 'medium',
      enabled: true,
      validator: (context) => {
        const sizeBytes = context.input?.sizeBytes || 0;
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (sizeBytes > maxSize) {
          return {
            outcome: 'STRICT_FAIL',
            message: `File size ${sizeBytes} exceeds limit of ${maxSize} bytes`,
            confidence: 1.0,
            applicable: true
          };
        }
        
        return {
          outcome: 'STRICT_PASS',
          message: 'File size check passed',
          confidence: 1.0,
          applicable: true
        };
      }
    });

    // Document Processing Rules
    this.addRule({
      id: 'document-processing-confidence',
      name: 'Document Processing Confidence',
      description: 'Ensure document processing meets minimum confidence threshold',
      category: 'technical',
      severity: 'high',
      enabled: true,
      validator: (context) => {
        const confidence = context.parsedDoc?.confidence || 0;
        const minConfidence = 0.7;
        
        if (confidence < minConfidence) {
          return {
            outcome: 'SOFT_WARN',
            message: `Document processing confidence ${confidence} below threshold ${minConfidence}`,
            confidence: confidence,
            applicable: true
          };
        }
        
        return {
          outcome: 'STRICT_PASS',
          message: 'Document processing confidence check passed',
          confidence: 1.0,
          applicable: true
        };
      }
    });

    console.log(`✅ Initialized ${this.rules.size} default rules`);
  }

  /**
   * Add a new rule
   */
  addRule(rule) {
    this.rules.set(rule.id, rule);
    
    // Update category mapping
    if (!this.ruleCategories.has(rule.category)) {
      this.ruleCategories.set(rule.category, []);
    }
    this.ruleCategories.get(rule.category).push(rule);
    
    console.log(`📋 Added rule: ${rule.id} (${rule.category})`);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    this.rules.delete(ruleId);
    
    // Update category mapping
    const categoryRules = this.ruleCategories.get(rule.category);
    if (categoryRules) {
      const index = categoryRules.findIndex(r => r.id === ruleId);
      if (index >= 0) {
        categoryRules.splice(index, 1);
      }
    }
    
    console.log(`🗑️ Removed rule: ${ruleId}`);
    return true;
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = enabled;
    console.log(`⚙️ Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get rule statistics
   */
  getRuleStats() {
    const stats = {};
    
    for (const [ruleId, stat] of this.executionStats.entries()) {
      stats[ruleId] = {
        ...stat,
        passRate: stat.executions > 0 ? stat.passes / stat.executions : 0,
        failRate: stat.executions > 0 ? stat.fails / stat.executions : 0,
        warningRate: stat.executions > 0 ? stat.warnings / stat.executions : 0
      };
    }
    
    return stats;
  }

  /**
   * Get all rules
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    return this.ruleCategories.get(category) || [];
  }

  /**
   * Health check
   */
  async healthCheck() {
    const stats = this.getRuleStats();
    const totalExecutions = Object.values(stats).reduce((sum, stat) => sum + stat.executions, 0);
    const totalFailures = Object.values(stats).reduce((sum, stat) => sum + stat.fails, 0);
    const failureRate = totalExecutions > 0 ? totalFailures / totalExecutions : 0;
    
    const healthy = failureRate < 0.1; // Less than 10% failure rate
    
    return {
      healthy,
      stats: {
        totalRules: this.rules.size,
        totalExecutions,
        totalFailures,
        failureRate,
        ruleStats: stats
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DeterministicRuleEngine;