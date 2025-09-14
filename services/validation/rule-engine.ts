/**
 * Deterministic Rule Engine
 * Implements strict rule validation with no AI dependencies
 * Based on lessons from hackathon: deterministic validation prevents drift
 */

import { z } from "zod";
import { RuleEngineResult, ValidationResult, RuleEngineResultType, ValidationResultType } from "../io/contracts";

interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'security' | 'business' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  validator: (context: RuleContext) => RuleResult;
}

interface RuleContext {
  input: any;
  parsedDoc?: any;
  enterpriseId: string;
  partnerId?: string;
  userId?: string;
  timestamp: string;
}

interface RuleResult {
  outcome: 'STRICT_PASS' | 'STRICT_FAIL' | 'SOFT_WARN';
  message: string;
  confidence: number;
  applicable: boolean;
  details?: Record<string, any>;
}

export class DeterministicRuleEngine {
  private rules: Map<string, Rule>;
  private ruleCategories: Map<string, Rule[]>;
  private executionStats: Map<string, { executions: number; passes: number; fails: number; warnings: number }>;

  constructor() {
    this.rules = new Map();
    this.ruleCategories = new Map();
    this.executionStats = new Map();
    this.initializeDefaultRules();
  }

  /**
   * Execute all applicable rules against context
   */
  async executeRules(context: RuleContext): Promise<ValidationResultType> {
    const results: RuleEngineResultType[] = [];
    
    // Get applicable rules
    const applicableRules = this.getApplicableRules(context);
    
    // Execute each rule
    for (const rule of applicableRules) {
      try {
        const result = rule.validator(context);
        const ruleResult: RuleEngineResultType = {
          ruleId: rule.id,
          ruleName: rule.name,
          outcome: result.outcome,
          message: result.message,
          confidence: result.confidence,
          applicable: result.applicable
        };
        
        results.push(ruleResult);
        this.updateRuleStats(rule.id, result.outcome);
        
      } catch (error) {
        console.error(`Rule ${rule.id} execution failed:`, error);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          outcome: 'STRICT_FAIL',
          message: `Rule execution failed: ${error}`,
          confidence: 0,
          applicable: true
        });
      }
    }

    // Calculate overall validation result
    const overallResult = this.calculateOverallResult(results);
    
    return {
      overall: overallResult,
      rules: results,
      confidence: this.calculateConfidence(results),
      humanReviewRequired: this.requiresHumanReview(results),
      recommendations: this.generateRecommendations(results)
    };
  }

  /**
   * Get applicable rules for context
   */
  private getApplicableRules(context: RuleContext): Rule[] {
    const applicable: Rule[] = [];
    
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
  private isRuleApplicable(rule: Rule, context: RuleContext): boolean {
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
  private calculateOverallResult(results: RuleEngineResultType[]): 'STRICT_PASS' | 'STRICT_FAIL' | 'SOFT_WARN' {
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
  private calculateConfidence(results: RuleEngineResultType[]): number {
    if (results.length === 0) {
      return 1.0;
    }
    
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    return totalConfidence / results.length;
  }

  /**
   * Determine if human review is required
   */
  private requiresHumanReview(results: RuleEngineResultType[]): boolean {
    return results.some(r => 
      r.outcome === 'STRICT_FAIL' || 
      r.outcome === 'SOFT_WARN' ||
      r.confidence < 0.7
    );
  }

  /**
   * Generate recommendations based on rule results
   */
  private generateRecommendations(results: RuleEngineResultType[]): string[] {
    const recommendations: string[] = [];
    
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
  private updateRuleStats(ruleId: string, outcome: 'STRICT_PASS' | 'STRICT_FAIL' | 'SOFT_WARN'): void {
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
  private initializeDefaultRules(): void {
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
  }

  /**
   * Add a new rule
   */
  addRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
    
    // Update category mapping
    if (!this.ruleCategories.has(rule.category)) {
      this.ruleCategories.set(rule.category, []);
    }
    this.ruleCategories.get(rule.category)!.push(rule);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
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
    
    return true;
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = enabled;
    return true;
  }

  /**
   * Get rule statistics
   */
  getRuleStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
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
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): Rule[] {
    return this.ruleCategories.get(category) || [];
  }
}

// ===== FACTORY FUNCTION =====

export function createRuleEngine(): DeterministicRuleEngine {
  return new DeterministicRuleEngine();
}

// ===== DEFAULT RULE ENGINE =====

export const defaultRuleEngine = createRuleEngine();