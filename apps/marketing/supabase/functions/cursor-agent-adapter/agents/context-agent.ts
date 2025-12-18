import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AIRequestEvent } from "./policy-agent.ts";

/**
 * RequestAnalysis - Context analysis result
 */
export interface RequestAnalysis {
  risk_score: number; // 0-100
  complexity_level: 'low' | 'medium' | 'high';
  data_sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  cost_tier: 'budget' | 'standard' | 'premium' | 'enterprise';
  anomaly_flags: string[];
  confidence: number;
  metadata: {
    prompt_length: number;
    estimated_tokens: number;
    model_tier: string;
    analysis_time_ms: number;
  };
}

/**
 * ContextAgent - Evolved for AI Request Analysis
 * 
 * Responsibilities:
 * - Analyze AI request context and characteristics
 * - Detect prompt complexity and risk
 * - Identify data sensitivity levels
 * - Calculate cost implications
 * - Flag usage pattern anomalies
 */
export class ContextAgent {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Process request context analysis
   */
  async process(input: AIRequestEvent, context: Record<string, unknown>): Promise<RequestAnalysis> {
    const startTime = Date.now();
    
    console.log('ContextAgent analyzing request:', {
      partner_id: input.partner_id,
      model: input.model,
      prompt_length: input.prompt?.length || 0
    });

    try {
      // Parallel analysis
      const [
        complexityLevel,
        dataSensitivity,
        costTier,
        anomalyFlags,
        riskScore
      ] = await Promise.all([
        this.analyzeComplexity(input),
        this.detectDataSensitivity(input),
        this.calculateCostTier(input),
        this.detectAnomalies(input),
        this.calculateRiskScore(input)
      ]);

      const analysisTimeMs = Date.now() - startTime;

      const result: RequestAnalysis = {
        risk_score: riskScore,
        complexity_level: complexityLevel,
        data_sensitivity: dataSensitivity,
        cost_tier: costTier,
        anomaly_flags: anomalyFlags,
        confidence: this.calculateConfidence(input),
        metadata: {
          prompt_length: input.prompt.length,
          estimated_tokens: Math.ceil(input.prompt.length / 4),
          model_tier: this.getModelTier(input.model),
          analysis_time_ms: analysisTimeMs
        }
      };

      console.log('ContextAgent analysis complete:', {
        risk_score: result.risk_score,
        complexity: result.complexity_level,
        sensitivity: result.data_sensitivity,
        anomalies: result.anomaly_flags.length
      });

      return result;

    } catch (error) {
      console.error('ContextAgent analysis error:', error);
      
      // Fail-safe: Return conservative analysis
      return {
        risk_score: 50,
        complexity_level: 'medium',
        data_sensitivity: 'internal',
        cost_tier: 'standard',
        anomaly_flags: ['analysis_error'],
        confidence: 0,
        metadata: {
          prompt_length: input.prompt?.length || 0,
          estimated_tokens: 0,
          model_tier: 'unknown',
          analysis_time_ms: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Analyze prompt complexity
   */
  private async analyzeComplexity(input: AIRequestEvent): Promise<'low' | 'medium' | 'high'> {
    const promptLength = input.prompt.length;
    const lineCount = input.prompt.split('\n').length;
    const hasCodeBlocks = /```/.test(input.prompt);
    const hasStructuredData = /\{|\[|\</.test(input.prompt);
    
    // Complexity scoring
    let score = 0;
    
    if (promptLength > 5000) score += 3;
    else if (promptLength > 1000) score += 2;
    else if (promptLength > 500) score += 1;
    
    if (lineCount > 50) score += 2;
    else if (lineCount > 20) score += 1;
    
    if (hasCodeBlocks) score += 2;
    if (hasStructuredData) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Detect data sensitivity level
   */
  private async detectDataSensitivity(
    input: AIRequestEvent
  ): Promise<'public' | 'internal' | 'confidential' | 'restricted'> {
    const prompt = input.prompt.toLowerCase();
    
    // High-risk patterns (restricted)
    const restrictedPatterns = [
      /ssn|social security/i,
      /credit card|visa|mastercard|amex/i,
      /password|api[_\s]?key|secret|token/i,
      /patient|medical record|phi/i,
      /insider|confidential|proprietary/i
    ];
    
    for (const pattern of restrictedPatterns) {
      if (pattern.test(prompt)) {
        return 'restricted';
      }
    }
    
    // Medium-risk patterns (confidential)
    const confidentialPatterns = [
      /financial|revenue|budget/i,
      /strategy|roadmap|planning/i,
      /personnel|hr|employee/i,
      /contract|agreement|terms/i
    ];
    
    for (const pattern of confidentialPatterns) {
      if (pattern.test(prompt)) {
        return 'confidential';
      }
    }
    
    // Low-risk patterns (internal)
    const internalPatterns = [
      /internal|company|organization/i,
      /team|department|division/i,
      /project|initiative/i
    ];
    
    for (const pattern of internalPatterns) {
      if (pattern.test(prompt)) {
        return 'internal';
      }
    }
    
    // Default: public
    return 'public';
  }

  /**
   * Calculate cost tier
   */
  private async calculateCostTier(
    input: AIRequestEvent
  ): Promise<'budget' | 'standard' | 'premium' | 'enterprise'> {
    const modelTier = this.getModelTier(input.model);
    const estimatedTokens = Math.ceil(input.prompt.length / 4) + (input.max_tokens || 500);
    
    if (modelTier === 'enterprise' || estimatedTokens > 10000) {
      return 'enterprise';
    } else if (modelTier === 'premium' || estimatedTokens > 5000) {
      return 'premium';
    } else if (modelTier === 'standard' || estimatedTokens > 1000) {
      return 'standard';
    } else {
      return 'budget';
    }
  }

  /**
   * Detect usage pattern anomalies
   */
  private async detectAnomalies(input: AIRequestEvent): Promise<string[]> {
    const anomalies: string[] = [];
    
    try {
      // Query recent requests for pattern analysis
      const { data: recentRequests, error } = await this.supabase
        .from('middleware_requests')
        .select('created_at, model, metadata')
        .eq('partner_id', input.partner_id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error checking anomalies:', error);
        return ['anomaly_check_failed'];
      }

      const requests = recentRequests || [];
      
      // Anomaly 1: Burst detection (> 10 requests in 1 minute)
      const lastMinute = requests.filter(
        r => new Date(r.created_at).getTime() > Date.now() - 60 * 1000
      );
      if (lastMinute.length > 10) {
        anomalies.push('burst_traffic_detected');
      }
      
      // Anomaly 2: Model switching (>3 different models in last hour)
      const uniqueModels = new Set(requests.map(r => r.model));
      if (uniqueModels.size > 3) {
        anomalies.push('frequent_model_switching');
      }
      
      // Anomaly 3: Unusually large prompt
      if (input.prompt.length > 10000) {
        anomalies.push('unusually_large_prompt');
      }
      
      // Anomaly 4: Off-hours usage (if metadata contains timezone info)
      const hour = new Date().getUTCHours();
      if (hour < 6 || hour > 22) {
        anomalies.push('off_hours_usage');
      }

    } catch (error) {
      console.error('Anomaly detection error:', error);
      anomalies.push('anomaly_detection_error');
    }
    
    return anomalies;
  }

  /**
   * Calculate overall risk score
   */
  private async calculateRiskScore(input: AIRequestEvent): Promise<number> {
    let score = 0;
    
    // Base score from complexity
    const complexity = await this.analyzeComplexity(input);
    if (complexity === 'high') score += 30;
    else if (complexity === 'medium') score += 15;
    
    // Add score from sensitivity
    const sensitivity = await this.detectDataSensitivity(input);
    if (sensitivity === 'restricted') score += 40;
    else if (sensitivity === 'confidential') score += 25;
    else if (sensitivity === 'internal') score += 10;
    
    // Add score from anomalies
    const anomalies = await this.detectAnomalies(input);
    score += anomalies.length * 10;
    
    // Add score from cost tier
    const costTier = await this.calculateCostTier(input);
    if (costTier === 'enterprise') score += 20;
    else if (costTier === 'premium') score += 10;
    
    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Get model tier classification
   */
  private getModelTier(model: string): 'budget' | 'standard' | 'premium' | 'enterprise' {
    const enterpriseModels = ['gpt-4', 'claude-3-opus', 'claude-3.5-sonnet'];
    const premiumModels = ['gpt-4-turbo', 'claude-3-sonnet', 'gemini-pro'];
    const standardModels = ['gpt-3.5-turbo', 'claude-3-haiku'];
    
    if (enterpriseModels.some(m => model.includes(m))) return 'enterprise';
    if (premiumModels.some(m => model.includes(m))) return 'premium';
    if (standardModels.some(m => model.includes(m))) return 'standard';
    return 'budget';
  }

  /**
   * Calculate analysis confidence
   */
  private calculateConfidence(input: AIRequestEvent): number {
    // Confidence based on data completeness
    let confidence = 0.5; // Base confidence
    
    if (input.prompt && input.prompt.length > 0) confidence += 0.2;
    if (input.model) confidence += 0.1;
    if (input.partner_id && input.enterprise_id) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }
}
