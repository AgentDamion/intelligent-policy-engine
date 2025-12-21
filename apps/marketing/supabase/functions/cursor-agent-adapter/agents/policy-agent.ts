import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Type for the observability context passed from cursor-agent-adapter
interface ObservabilityContext {
  logReasoning: (reasoning: string) => Promise<{ id: string } | null>;
  logToolCall: (toolName: string, args: Record<string, unknown>, result?: unknown, durationMs?: number, error?: string) => Promise<{ callId: string; responseId: string } | null>;
  getStepCount: () => number;
}

/**
 * AIRequestEvent - Replaces ToolUsageEvent for boundary governance
 */
export interface AIRequestEvent {
  partner_id: string;
  enterprise_id: string;
  workspace_id?: string;
  model: string;
  prompt: string;
  prompt_tokens?: number;
  max_tokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * PolicyEvaluationResult
 */
export interface PolicyEvaluationResult {
  allowed: boolean;
  decision: 'allow' | 'block' | 'warn';
  reasons: string[];
  violated_rules?: string[];
  policy_ids: string[];
  confidence: number;
  metadata: {
    evaluation_time_ms: number;
    rules_evaluated: number;
    cost_estimate?: number;
  };
}

/**
 * BoundaryRule - New structure for middleware policies
 */
export interface BoundaryRule {
  type: 'model_restriction' | 'content_filter' | 'rate_limit' | 'cost_control';
  config: Record<string, unknown>;
  severity: 'block' | 'warn' | 'monitor';
}

/**
 * PolicyAgent - Evolved for Boundary Governance
 * 
 * Responsibilities:
 * - Evaluate AI requests against boundary policies
 * - Support model restrictions, content filters, rate limits, cost controls
 * - Real-time evaluation (< 100ms latency)
 * - Return structured evaluation results
 */
export class PolicyAgent {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Process AI request evaluation
   */
  async process(input: AIRequestEvent, context: Record<string, unknown>): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    
    // Get observability context if provided
    const obsContext = context._observability as ObservabilityContext | undefined;
    
    console.log('PolicyAgent evaluating request:', {
      partner_id: input.partner_id,
      enterprise_id: input.enterprise_id,
      model: input.model,
      prompt_length: input.prompt?.length || 0
    });

    try {
      // Log reasoning: Loading policies
      await obsContext?.logReasoning(`Loading boundary policies for enterprise ${input.enterprise_id} and partner ${input.partner_id}`);
      
      // Load active policies for enterprise-partner relationship
      const loadPoliciesStart = Date.now();
      const policies = await this.loadBoundaryPolicies(input.enterprise_id, input.partner_id);
      
      // Log tool call: loadBoundaryPolicies
      await obsContext?.logToolCall(
        'loadBoundaryPolicies',
        { enterpriseId: input.enterprise_id, partnerId: input.partner_id },
        { policyCount: policies.length, policyIds: policies.map(p => p.id) },
        Date.now() - loadPoliciesStart
      );
      
      console.log(`Loaded ${policies.length} boundary policies`);

      // Log reasoning: Evaluating policies
      await obsContext?.logReasoning(`Evaluating ${policies.length} policies across 4 rule types: model_restriction, content_filter, rate_limit, cost_control`);

      // Evaluate each policy type
      const evaluations = await Promise.all([
        this.evaluateModelRestrictions(input, policies),
        this.evaluateContentFilters(input, policies),
        this.evaluateRateLimits(input, policies),
        this.evaluateCostControls(input, policies)
      ]);

      // Aggregate results
      const violations: string[] = [];
      const warnings: string[] = [];
      const reasons: string[] = [];
      let decision: 'allow' | 'block' | 'warn' = 'allow';

      for (const evalResult of evaluations) {
        if (evalResult.decision === 'block') {
          decision = 'block';
          violations.push(...evalResult.violated_rules);
          reasons.push(...evalResult.reasons);
        } else if (evalResult.decision === 'warn' && decision !== 'block') {
          decision = 'warn';
          warnings.push(...evalResult.reasons);
        }
        reasons.push(...evalResult.reasons);
      }

      const evaluationTimeMs = Date.now() - startTime;

      // Log reasoning: Decision summary
      await obsContext?.logReasoning(
        `Policy evaluation complete. Decision: ${decision.toUpperCase()}. ` +
        `Violations: ${violations.length}. Warnings: ${warnings.length}. ` +
        `Evaluation time: ${evaluationTimeMs}ms`
      );

      const result: PolicyEvaluationResult = {
        allowed: decision !== 'block',
        decision,
        reasons: [...new Set(reasons)], // Deduplicate
        violated_rules: violations.length > 0 ? violations : undefined,
        policy_ids: policies.map(p => p.id),
        confidence: this.calculateConfidence(evaluations),
        metadata: {
          evaluation_time_ms: evaluationTimeMs,
          rules_evaluated: evaluations.length,
          cost_estimate: this.estimateCost(input)
        }
      };

      console.log('PolicyAgent evaluation complete:', {
        decision: result.decision,
        evaluation_time_ms: evaluationTimeMs,
        violated_rules: result.violated_rules?.length || 0
      });

      return result;

    } catch (error) {
      console.error('PolicyAgent evaluation error:', error);
      
      // Log the error in observability
      await obsContext?.logReasoning(`Policy evaluation failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fail-safe: Allow request but log error
      return {
        allowed: true,
        decision: 'allow',
        reasons: ['Evaluation error - defaulting to allow with logging'],
        policy_ids: [],
        confidence: 0,
        metadata: {
          evaluation_time_ms: Date.now() - startTime,
          rules_evaluated: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Load boundary policies for enterprise-partner relationship
   */
  private async loadBoundaryPolicies(
    enterpriseId: string, 
    partnerId: string
  ): Promise<Array<{ id: string; rules: BoundaryRule[] }>> {
    // Query policy_instances with boundary governance rules
    const { data: policies, error } = await this.supabase
      .from('policy_instances')
      .select('id, effective_pom, current_eps_id')
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading policies:', error);
      return [];
    }

    // Extract boundary rules from POM
    return (policies || [])
      .map(p => ({
        id: p.id,
        rules: this.extractBoundaryRules(p.effective_pom)
      }))
      .filter(p => p.rules.length > 0);
  }

  /**
   * Extract boundary rules from policy POM
   */
  private extractBoundaryRules(pom: any): BoundaryRule[] {
    const rules: BoundaryRule[] = [];

    // Model restrictions
    if (pom?.model_restrictions) {
      rules.push({
        type: 'model_restriction',
        config: pom.model_restrictions,
        severity: pom.model_restrictions.severity || 'block'
      });
    }

    // Content filters
    if (pom?.content_filters) {
      rules.push({
        type: 'content_filter',
        config: pom.content_filters,
        severity: pom.content_filters.severity || 'block'
      });
    }

    // Rate limits
    if (pom?.rate_limits) {
      rules.push({
        type: 'rate_limit',
        config: pom.rate_limits,
        severity: pom.rate_limits.severity || 'warn'
      });
    }

    // Cost controls
    if (pom?.cost_controls) {
      rules.push({
        type: 'cost_control',
        config: pom.cost_controls,
        severity: pom.cost_controls.severity || 'warn'
      });
    }

    return rules;
  }

  /**
   * Evaluate model restriction rules
   */
  private async evaluateModelRestrictions(
    input: AIRequestEvent,
    policies: Array<{ id: string; rules: BoundaryRule[] }>
  ): Promise<{ decision: 'allow' | 'block' | 'warn'; reasons: string[]; violated_rules: string[] }> {
    const reasons: string[] = [];
    const violations: string[] = [];
    let decision: 'allow' | 'block' | 'warn' = 'allow';

    for (const policy of policies) {
      const modelRules = policy.rules.filter(r => r.type === 'model_restriction');
      
      for (const rule of modelRules) {
        const allowedModels = rule.config.allowed_models as string[] || [];
        
        if (allowedModels.length > 0 && !allowedModels.includes(input.model)) {
          if (rule.severity === 'block') {
            decision = 'block';
            violations.push(`model_restriction:${policy.id}`);
            reasons.push(`Model '${input.model}' not in allowed list: ${allowedModels.join(', ')}`);
          } else if (rule.severity === 'warn') {
            decision = decision === 'block' ? 'block' : 'warn';
            reasons.push(`Warning: Model '${input.model}' not in recommended list`);
          }
        }
      }
    }

    return { decision, reasons, violated_rules: violations };
  }

  /**
   * Evaluate content filter rules
   */
  private async evaluateContentFilters(
    input: AIRequestEvent,
    policies: Array<{ id: string; rules: BoundaryRule[] }>
  ): Promise<{ decision: 'allow' | 'block' | 'warn'; reasons: string[]; violated_rules: string[] }> {
    const reasons: string[] = [];
    const violations: string[] = [];
    let decision: 'allow' | 'block' | 'warn' = 'allow';

    for (const policy of policies) {
      const contentRules = policy.rules.filter(r => r.type === 'content_filter');
      
      for (const rule of contentRules) {
        const blockPatterns = rule.config.block_patterns as string[] || [];
        
        for (const pattern of blockPatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(input.prompt)) {
            if (rule.severity === 'block') {
              decision = 'block';
              violations.push(`content_filter:${policy.id}`);
              reasons.push(`Blocked pattern detected: ${pattern}`);
            } else if (rule.severity === 'warn') {
              decision = decision === 'block' ? 'block' : 'warn';
              reasons.push(`Warning: Sensitive pattern detected: ${pattern}`);
            }
          }
        }
      }
    }

    return { decision, reasons, violated_rules: violations };
  }

  /**
   * Evaluate rate limit rules
   */
  private async evaluateRateLimits(
    input: AIRequestEvent,
    policies: Array<{ id: string; rules: BoundaryRule[] }>
  ): Promise<{ decision: 'allow' | 'block' | 'warn'; reasons: string[]; violated_rules: string[] }> {
    const reasons: string[] = [];
    const violations: string[] = [];
    let decision: 'allow' | 'block' | 'warn' = 'allow';

    // Query recent requests for rate limiting
    const { data: recentRequests, error } = await this.supabase
      .from('middleware_requests')
      .select('created_at')
      .eq('partner_id', input.partner_id)
      .eq('enterprise_id', input.enterprise_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking rate limits:', error);
      return { decision: 'allow', reasons: ['Rate limit check skipped'], violated_rules: [] };
    }

    const requestCount = (recentRequests || []).length;

    for (const policy of policies) {
      const rateLimitRules = policy.rules.filter(r => r.type === 'rate_limit');
      
      for (const rule of rateLimitRules) {
        const maxRequestsPerDay = rule.config.max_requests_per_day as number || Infinity;
        
        if (requestCount >= maxRequestsPerDay) {
          if (rule.severity === 'block') {
            decision = 'block';
            violations.push(`rate_limit:${policy.id}`);
            reasons.push(`Daily rate limit exceeded: ${requestCount}/${maxRequestsPerDay}`);
          } else if (rule.severity === 'warn') {
            decision = decision === 'block' ? 'block' : 'warn';
            reasons.push(`Warning: Approaching rate limit: ${requestCount}/${maxRequestsPerDay}`);
          }
        }
      }
    }

    return { decision, reasons, violated_rules: violations };
  }

  /**
   * Evaluate cost control rules
   */
  private async evaluateCostControls(
    input: AIRequestEvent,
    policies: Array<{ id: string; rules: BoundaryRule[] }>
  ): Promise<{ decision: 'allow' | 'block' | 'warn'; reasons: string[]; violated_rules: string[] }> {
    const reasons: string[] = [];
    const violations: string[] = [];
    let decision: 'allow' | 'block' | 'warn' = 'allow';

    const estimatedCost = this.estimateCost(input);

    for (const policy of policies) {
      const costRules = policy.rules.filter(r => r.type === 'cost_control');
      
      for (const rule of costRules) {
        const maxMonthlyCost = rule.config.max_monthly_spend as number || Infinity;
        
        // TODO: Query actual monthly spend from middleware_requests
        // For now, just check estimated cost
        if (estimatedCost > maxMonthlyCost) {
          if (rule.severity === 'block') {
            decision = 'block';
            violations.push(`cost_control:${policy.id}`);
            reasons.push(`Request cost exceeds limit: $${estimatedCost.toFixed(4)}`);
          } else if (rule.severity === 'warn') {
            decision = decision === 'block' ? 'block' : 'warn';
            reasons.push(`Warning: High cost request: $${estimatedCost.toFixed(4)}`);
          }
        }
      }
    }

    return { decision, reasons, violated_rules: violations };
  }

  /**
   * Estimate cost of AI request
   */
  private estimateCost(input: AIRequestEvent): number {
    // Simple cost estimation based on model and token count
    const modelCosts: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
      'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
      'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 }
    };

    const cost = modelCosts[input.model] || modelCosts['gpt-3.5-turbo'];
    const inputTokens = input.prompt_tokens || Math.ceil(input.prompt.length / 4);
    const outputTokens = input.max_tokens || 500;

    return (inputTokens * cost.input) + (outputTokens * cost.output);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(evaluations: Array<{ decision: string }>): number {
    // Simple confidence: 1.0 if all evaluations agree, lower if mixed
    const decisions = evaluations.map(e => e.decision);
    const uniqueDecisions = new Set(decisions);
    return uniqueDecisions.size === 1 ? 1.0 : 0.7;
  }
}
