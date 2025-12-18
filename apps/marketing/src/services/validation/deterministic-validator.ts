/**
 * Deterministic Validation Service
 * Non-AI rule engine and confidence calculator for final decisions
 */
import { AgentDecision, ParsedDocument, ValidationResult, ValidationResultSchema } from '@/contracts';
import { z } from 'zod';

interface RuleResult {
  rule: string;
  outcome: 'STRICT_PASS' | 'STRICT_FAIL' | 'SOFT_WARN';
  message: string;
}

export class DeterministicValidator {
  
  /**
   * Runs deterministic business rules on the parsed document and agent decision
   */
  static runRuleEngine(
    agentDecision: AgentDecision, 
    parsedDoc: ParsedDocument, 
    enterpriseId: string
  ): RuleResult[] {
    const results: RuleResult[] = [];

    // Rule: Low confidence parsing always requires review
    if (parsedDoc.parsingMethod === 'template-fallback' && parsedDoc.parserConfidence < 0.7) {
      results.push({
        rule: 'PARSER_CONFIDENCE_LOW',
        outcome: 'STRICT_FAIL',
        message: 'Document required low-confidence fallback parsing'
      });
    }

    // Rule: Rejections must have substantial rationale
    if (agentDecision.decision === 'REJECTED' && agentDecision.rationale.length < 50) {
      results.push({
        rule: 'INSUFFICIENT_RATIONALE',
        outcome: 'SOFT_WARN',
        message: 'Rejection rationale is too short for audit trail'
      });
    }

    // Rule: High risk decisions require human review
    if (agentDecision.riskLevel === 'CRITICAL' && agentDecision.confidence < 0.9) {
      results.push({
        rule: 'HIGH_RISK_LOW_CONFIDENCE',
        outcome: 'STRICT_FAIL',
        message: 'Critical risk decisions require high confidence or human review'
      });
    }

    // Rule: PHI documents need special handling
    if (parsedDoc.extractedText.toLowerCase().includes('phi') || 
        parsedDoc.extractedText.toLowerCase().includes('protected health')) {
      results.push({
        rule: 'PHI_DETECTED',
        outcome: 'SOFT_WARN',
        message: 'Potential PHI detected - ensure compliance protocols'
      });
    }

    if (results.length === 0) {
      results.push({
        rule: 'ALL_RULES_PASSED',
        outcome: 'STRICT_PASS',
        message: 'All validation rules passed'
      });
    }

    return results;
  }

  /**
   * Calculates final confidence using mathematical blending
   */
  static calculateFinalConfidence(
    agentDecision: AgentDecision,
    parsedDoc: ParsedDocument,
    ruleResults: RuleResult[]
  ): number {
    // Base weighted score from parsing and agent confidence
    const parserWeight = 0.3;
    const agentWeight = 0.7;
    
    let baseScore = (parsedDoc.parserConfidence * parserWeight) + 
                   (agentDecision.confidence * agentWeight);

    // Apply rule-based penalties
    if (ruleResults.some(r => r.outcome === 'STRICT_FAIL')) {
      return 0.0; // Automatic failure
    }
    
    if (ruleResults.some(r => r.outcome === 'SOFT_WARN')) {
      baseScore *= 0.85; // Confidence penalty for warnings
    }

    return Math.round(baseScore * 10000) / 10000; // 4 decimal precision
  }

  /**
   * Makes final gating decision based on confidence and rules
   */
  static gateOutcome(finalConfidence: number, ruleResults: RuleResult[]): ValidationResult['finalOutcome'] {
    const confidenceThreshold = 0.85;

    if (ruleResults.some(r => r.outcome === 'STRICT_FAIL')) {
      return 'REJECTED';
    }
    
    if (finalConfidence < confidenceThreshold) {
      return 'HUMAN_IN_LOOP';
    }
    
    return 'APPROVED';
  }

  /**
   * Complete validation pipeline
   */
  static async validate(
    agentDecision: AgentDecision,
    parsedDoc: ParsedDocument,
    enterpriseId: string
  ): Promise<ValidationResult> {
    const ruleResults = this.runRuleEngine(agentDecision, parsedDoc, enterpriseId);
    const finalConfidence = this.calculateFinalConfidence(agentDecision, parsedDoc, ruleResults);
    const finalOutcome = this.gateOutcome(finalConfidence, ruleResults);

    const result: ValidationResult = {
      ruleResults,
      finalConfidence,
      finalOutcome,
      processedAt: new Date().toISOString(),
    };

    // Validate against schema
    return ValidationResultSchema.parse(result);
  }
}