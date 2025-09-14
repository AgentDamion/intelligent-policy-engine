/**
 * Deterministic Confidence Calculator
 * Blends multiple signals to calculate final confidence score
 * No AI dependencies - pure mathematical calculation
 */

import { z } from "zod";
import { ConfidenceCalculation, ConfidenceCalculationType } from "../io/contracts";

interface ConfidenceSignals {
  parserMethod: number;
  schemaConformance: number;
  ruleOutcome: number;
  modelReliability: number;
  historicalAgreement: number;
}

interface ConfidenceWeights {
  parserMethod: number;
  schemaConformance: number;
  ruleOutcome: number;
  modelReliability: number;
  historicalAgreement: number;
}

interface HistoricalData {
  enterpriseId: string;
  similarDecisions: number;
  agreementRate: number;
  lastUpdated: string;
}

export class DeterministicConfidenceCalculator {
  private weights: ConfidenceWeights;
  private historicalData: Map<string, HistoricalData>;
  private modelReliabilityScores: Map<string, number>;

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
  }

  /**
   * Calculate final confidence score from multiple signals
   */
  calculateConfidence(signals: ConfidenceSignals, context: any): ConfidenceCalculationType {
    // Validate input signals
    const validatedSignals = this.validateSignals(signals);
    
    // Calculate weighted average
    const finalConfidence = this.calculateWeightedAverage(validatedSignals);
    
    // Apply context-specific adjustments
    const adjustedConfidence = this.applyContextAdjustments(finalConfidence, context);
    
    // Create breakdown for transparency
    const breakdown = this.createBreakdown(validatedSignals);
    
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
  private validateSignals(signals: ConfidenceSignals): ConfidenceSignals {
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
  private calculateWeightedAverage(signals: ConfidenceSignals): number {
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
  private applyContextAdjustments(baseConfidence: number, context: any): number {
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
  private createBreakdown(signals: ConfidenceSignals): Record<string, number> {
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
  private getEnterpriseTrustLevel(enterpriseId: string): number {
    const historical = this.historicalData.get(enterpriseId);
    if (!historical) {
      return 0.5; // Default trust level
    }
    
    return historical.agreementRate;
  }

  /**
   * Update historical data for an enterprise
   */
  updateHistoricalData(enterpriseId: string, decision: any, outcome: 'success' | 'failure'): void {
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
  }

  /**
   * Get model reliability score
   */
  getModelReliability(modelName: string): number {
    return this.modelReliabilityScores.get(modelName) || 0.8; // Default reliability
  }

  /**
   * Update model reliability score
   */
  updateModelReliability(modelName: string, successRate: number): void {
    this.modelReliabilityScores.set(modelName, Math.max(0, Math.min(1, successRate)));
  }

  /**
   * Initialize model reliability scores
   */
  private initializeModelReliability(): void {
    // Initialize with default scores for common models
    this.modelReliabilityScores.set('gpt-4', 0.92);
    this.modelReliabilityScores.set('gpt-3.5-turbo', 0.85);
    this.modelReliabilityScores.set('claude-3', 0.90);
    this.modelReliabilityScores.set('claude-2', 0.88);
    this.modelReliabilityScores.set('default', 0.80);
  }

  /**
   * Calculate confidence for specific scenarios
   */
  calculateDocumentProcessingConfidence(parsedDoc: any): number {
    const signals: ConfidenceSignals = {
      parserMethod: this.getParserMethodConfidence(parsedDoc.method),
      schemaConformance: 1.0, // Assume schema validation passed
      ruleOutcome: 1.0, // Assume rules passed
      modelReliability: 0.8, // Default model reliability
      historicalAgreement: 0.8 // Default historical agreement
    };
    
    const result = this.calculateConfidence(signals, {});
    return result.finalConfidence;
  }

  calculatePolicyDecisionConfidence(decision: any, context: any): number {
    const signals: ConfidenceSignals = {
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
  private getParserMethodConfidence(method: string): number {
    const methodScores: Record<string, number> = {
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
  getConfidenceThresholds(): Record<string, number> {
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
  getActionFromConfidence(confidence: number): string {
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
  getStats(): Record<string, any> {
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
  private getAverageEnterpriseTrust(): number {
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
  reset(): void {
    this.historicalData.clear();
    this.initializeModelReliability();
  }
}

// ===== FACTORY FUNCTION =====

export function createConfidenceCalculator(): DeterministicConfidenceCalculator {
  return new DeterministicConfidenceCalculator();
}

// ===== DEFAULT CALCULATOR =====

export const defaultConfidenceCalculator = createConfidenceCalculator();