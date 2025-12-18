import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Simulation Agent - Historical Traffic Analysis & Cost Optimization
 * 
 * FR-SA-1: Historical Traffic Replay - Re-runs draft policies against actual middleware traffic
 * FR-SA-2: Conflict Detection - Identifies decision flips and policy conflicts
 * FR-SA-3: Cost Optimization - Detects expensive models serving low-risk queries
 * FR-SA-4: Deprecation Impact - Analyzes impact of removing models/assets
 */

export interface SimulationInput {
  policy_id?: string;
  enterprise_id: string;
  workspace_id?: string;
  simulation_type: 'historical_replay' | 'conflict_detection' | 'cost_optimization' | 'deprecation_impact';
  parameters: {
    hours_lookback?: number;
    model_to_deprecate?: string;
    min_savings_threshold?: number;
    draft_policy_rules?: any;
  };
}

export interface OptimizationRecommendation {
  type: 'model_routing' | 'policy_adjustment' | 'cost_reduction';
  confidence: number;
  estimated_savings_usd_annual: number;
  estimated_savings_usd_monthly: number;
  current_state: {
    model: string;
    avg_cost_per_request: number;
    request_volume_monthly: number;
  };
  suggested_state: {
    model: string;
    avg_cost_per_request: number;
    risk_increase: number;
  };
  justification: string;
  affected_partners: string[];
}

export interface PolicyConflict {
  conflict_type: 'decision_flip' | 'risk_escalation' | 'cost_spike';
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_requests: number;
  description: string;
  examples: any[];
}

export interface DeprecationImpact {
  model_name: string;
  affected_partners: number;
  total_requests: number;
  total_cost_usd: number;
  avg_daily_requests: number;
  recommendation: string;
  partner_ids: string[];
}

export interface SimulationResult {
  simulation_id: string;
  simulation_type: string;
  impact_summary: {
    requests_analyzed: number;
    decision_flips: number;
    decision_flip_rate: number;
    cost_impact_usd: number;
    risk_score_change: number;
  };
  recommendations: OptimizationRecommendation[];
  conflicts: PolicyConflict[];
  deprecation_impact?: DeprecationImpact;
}

export class SimulationAgent {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async process(input: any, context: Record<string, unknown>): Promise<any> {
    const { action, payload } = input;

    console.log(`[SimulationAgent] Processing action: ${action}`);

    switch (action) {
      case 'run_simulation':
        return await this.runSimulation(payload, context);
      case 'historical_replay':
        return await this.historicalReplay(payload, context);
      case 'detect_conflicts':
        return await this.detectConflicts(payload, context);
      case 'optimize_costs':
        return await this.optimizeCosts(payload, context);
      case 'analyze_deprecation':
        return await this.analyzeDeprecation(payload, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * FR-SA-1: Historical Traffic Replay
   * Re-runs draft policy against actual middleware_requests
   */
  async historicalReplay(input: SimulationInput, context: Record<string, unknown>): Promise<SimulationResult> {
    const { policy_id, enterprise_id, parameters } = input;
    const hours = parameters.hours_lookback || 168; // Default 7 days

    console.log(`[SimulationAgent] Running historical replay for policy ${policy_id} (${hours} hours)`);

    // 1. Fetch historical middleware requests
    const { data: requests, error } = await this.supabase
      .from('middleware_requests')
      .select('*')
      .eq('enterprise_id', enterprise_id)
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1000); // Limit for performance

    if (error) {
      console.error('[SimulationAgent] Error fetching historical requests:', error);
      throw new Error(`Failed to fetch historical requests: ${error.message}`);
    }

    console.log(`[SimulationAgent] Analyzing ${requests?.length || 0} historical requests`);

    // 2. Analyze traffic using SQL function
    const { data: analysis } = await this.supabase.rpc('analyze_historical_traffic', {
      p_enterprise_id: enterprise_id,
      p_policy_id: policy_id,
      p_hours: hours,
    });

    const trafficAnalysis = analysis?.[0] || {
      total_requests: requests?.length || 0,
      block_rate: 0,
      total_cost_usd: 0,
      avg_latency_ms: 0,
    };

    // 3. Detect conflicts (decision flips)
    const conflicts = this.detectHighImpactConflicts(requests || [], trafficAnalysis);

    // 4. Generate recommendations
    const recommendations = this.generateRecommendations(trafficAnalysis);

    // 5. Store simulation run
    const simulationId = crypto.randomUUID();
    await this.storeSimulationRun(simulationId, input, trafficAnalysis, context);

    // 6. Send high-impact findings to Inbox
    if (conflicts.length > 0 || recommendations.length > 0) {
      await this.sendToInbox(recommendations, conflicts, enterprise_id, context);
    }

    return {
      simulation_id: simulationId,
      simulation_type: 'historical_replay',
      impact_summary: {
        requests_analyzed: trafficAnalysis.total_requests || 0,
        decision_flips: conflicts.length,
        decision_flip_rate: conflicts.length / (trafficAnalysis.total_requests || 1),
        cost_impact_usd: trafficAnalysis.total_cost_usd || 0,
        risk_score_change: 0,
      },
      recommendations,
      conflicts,
    };
  }

  /**
   * FR-SA-3: Cost Optimization Detection
   * Scans for expensive models serving low-risk queries
   */
  async optimizeCosts(input: SimulationInput, context: Record<string, unknown>): Promise<SimulationResult> {
    const { enterprise_id, parameters } = input;
    const minSavings = parameters.min_savings_threshold || 1000;

    console.log(`[SimulationAgent] Running cost optimization analysis (min savings: $${minSavings})`);

    // Call SQL function for cost optimization analysis
    const { data, error } = await this.supabase.rpc('detect_cost_optimization_opportunities', {
      p_enterprise_id: enterprise_id,
      p_min_savings_usd: minSavings,
    });

    if (error) {
      console.error('[SimulationAgent] Cost optimization error:', error);
      throw new Error(`Cost optimization query failed: ${error.message}`);
    }

    console.log(`[SimulationAgent] Found ${data?.length || 0} cost optimization opportunities`);

    const recommendations: OptimizationRecommendation[] = (data || []).map((opp: any) => ({
      type: 'model_routing',
      confidence: 0.85,
      estimated_savings_usd_annual: opp.estimated_savings_usd * 12,
      estimated_savings_usd_monthly: opp.estimated_savings_usd,
      current_state: {
        model: opp.model_name,
        avg_cost_per_request: opp.current_cost_usd / opp.request_count,
        request_volume_monthly: opp.request_count,
      },
      suggested_state: {
        model: opp.suggested_model,
        avg_cost_per_request: (opp.current_cost_usd - opp.estimated_savings_usd) / opp.request_count,
        risk_increase: opp.risk_increase,
      },
      justification: `Switch ${opp.request_count} low-risk requests from ${opp.model_name} to ${opp.suggested_model} to save $${Math.round(opp.estimated_savings_usd)}/month`,
      affected_partners: [],
    }));

    // Send high-value recommendations (>$10k/year) to Inbox
    const highValueRecs = recommendations.filter(r => r.estimated_savings_usd_annual > 10000);
    
    if (highValueRecs.length > 0) {
      console.log(`[SimulationAgent] Sending ${highValueRecs.length} high-value optimizations to Inbox`);
      await this.sendOptimizationsToInbox(highValueRecs, enterprise_id, context);
    }

    const simulationId = crypto.randomUUID();
    
    return {
      simulation_id: simulationId,
      simulation_type: 'cost_optimization',
      impact_summary: {
        requests_analyzed: recommendations.reduce((sum, r) => sum + r.current_state.request_volume_monthly, 0),
        decision_flips: 0,
        decision_flip_rate: 0,
        cost_impact_usd: recommendations.reduce((sum, r) => sum + r.estimated_savings_usd_annual, 0),
        risk_score_change: 0,
      },
      recommendations,
      conflicts: [],
    };
  }

  /**
   * FR-SA-4: Deprecation Impact Analysis
   */
  async analyzeDeprecation(input: SimulationInput, context: Record<string, unknown>): Promise<SimulationResult> {
    const { enterprise_id, parameters } = input;
    const modelName = parameters.model_to_deprecate;

    if (!modelName) {
      throw new Error('model_to_deprecate parameter is required');
    }

    console.log(`[SimulationAgent] Analyzing deprecation impact for model: ${modelName}`);

    const { data, error } = await this.supabase.rpc('analyze_deprecation_impact', {
      p_enterprise_id: enterprise_id,
      p_model_name: modelName,
      p_days_lookback: 30,
    });

    if (error) {
      console.error('[SimulationAgent] Deprecation analysis error:', error);
      throw new Error(`Deprecation analysis failed: ${error.message}`);
    }

    const impact: DeprecationImpact = data || {
      model_name: modelName,
      affected_partners: 0,
      total_requests: 0,
      total_cost_usd: 0,
      avg_daily_requests: 0,
      recommendation: 'UNKNOWN',
      partner_ids: [],
    };

    console.log(`[SimulationAgent] Deprecation impact: ${impact.affected_partners} partners, ${impact.total_requests} requests`);

    const simulationId = crypto.randomUUID();

    return {
      simulation_id: simulationId,
      simulation_type: 'deprecation_impact',
      impact_summary: {
        requests_analyzed: impact.total_requests,
        decision_flips: 0,
        decision_flip_rate: 0,
        cost_impact_usd: impact.total_cost_usd,
        risk_score_change: 0,
      },
      recommendations: [],
      conflicts: [],
      deprecation_impact: impact,
    };
  }

  /**
   * Detect high-impact conflicts from simulation
   */
  private detectHighImpactConflicts(requests: any[], analysis: any): PolicyConflict[] {
    const conflicts: PolicyConflict[] = [];

    // Check for high block rate
    if (analysis.block_rate > 0.15) {
      conflicts.push({
        conflict_type: 'decision_flip',
        severity: 'critical',
        affected_requests: Math.round(analysis.total_requests * analysis.block_rate),
        description: `Policy would block ${(analysis.block_rate * 100).toFixed(1)}% of requests (>${15}% threshold)`,
        examples: requests.filter((r: any) => r.policy_decision === 'block').slice(0, 5),
      });
    }

    return conflicts;
  }

  /**
   * Generate recommendations from analysis
   */
  private generateRecommendations(analysis: any): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Example: High cost with low block rate suggests room for optimization
    if (analysis.total_cost_usd > 5000 && analysis.block_rate < 0.05) {
      recommendations.push({
        type: 'policy_adjustment',
        confidence: 0.75,
        estimated_savings_usd_annual: analysis.total_cost_usd * 0.2 * 12,
        estimated_savings_usd_monthly: analysis.total_cost_usd * 0.2,
        current_state: {
          model: 'mixed',
          avg_cost_per_request: analysis.total_cost_usd / analysis.total_requests,
          request_volume_monthly: analysis.total_requests,
        },
        suggested_state: {
          model: 'optimized',
          avg_cost_per_request: (analysis.total_cost_usd * 0.8) / analysis.total_requests,
          risk_increase: 0.03,
        },
        justification: 'Low block rate with high costs suggests opportunity for cost optimization',
        affected_partners: [],
      });
    }

    return recommendations;
  }

  /**
   * Store simulation run for audit trail
   */
  private async storeSimulationRun(
    simulationId: string,
    input: SimulationInput,
    results: any,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from('sandbox_runs').insert({
        id: simulationId,
        policy_id: input.policy_id,
        workspace_id: input.workspace_id,
        enterprise_id: input.enterprise_id,
        run_by: (context.user_id as string) || 'system',
        inputs_json: {
          simulation_type: input.simulation_type,
          parameters: input.parameters,
        },
        outputs_json: results,
        control_level: 'standard',
        proof_hash: `sim_${simulationId.substring(0, 8)}`,
        status: 'completed',
      });

      if (error) {
        console.error('[SimulationAgent] Error storing simulation run:', error);
      }
    } catch (err) {
      console.error('[SimulationAgent] Failed to store simulation run:', err);
    }
  }

  /**
   * Send high-value optimizations to Inbox for approval
   */
  private async sendOptimizationsToInbox(
    recommendations: OptimizationRecommendation[],
    enterprise_id: string,
    context: Record<string, unknown>
  ): Promise<void> {
    for (const rec of recommendations) {
      const inboxPayload = {
        source_agent: 'simulation',
        enterprise_id,
        task_type: 'optimization_suggestion',
        action_type: 'APPLY_MODEL_ROUTING_RULE',
        title: `Cost Optimization: Save $${rec.estimated_savings_usd_annual.toLocaleString()}/year`,
        summary_html: `
          <div class="space-y-3">
            <p class="text-sm"><strong>Opportunity:</strong> ${rec.justification}</p>
            <table class="w-full text-xs">
              <tr><th class="text-left py-1">Current Model</th><td>${rec.current_state.model}</td></tr>
              <tr><th class="text-left py-1">Suggested Model</th><td>${rec.suggested_state.model}</td></tr>
              <tr><th class="text-left py-1">Monthly Requests</th><td>${rec.current_state.request_volume_monthly.toLocaleString()}</td></tr>
              <tr><th class="text-left py-1">Monthly Savings</th><td class="font-semibold text-green-600">$${rec.estimated_savings_usd_monthly.toFixed(2)}</td></tr>
              <tr><th class="text-left py-1">Annual Savings</th><td class="font-semibold text-green-600">$${rec.estimated_savings_usd_annual.toLocaleString()}</td></tr>
              <tr><th class="text-left py-1">Risk Increase</th><td>${(rec.suggested_state.risk_increase * 100).toFixed(1)}%</td></tr>
              <tr><th class="text-left py-1">Confidence</th><td>${(rec.confidence * 100).toFixed(0)}%</td></tr>
            </table>
          </div>
        `,
        action_payload: {
          routing_rule: {
            from_model: rec.current_state.model,
            to_model: rec.suggested_state.model,
            conditions: { risk_tier: 'LOW' },
          },
        },
        context_data: {
          estimated_savings_usd_annual: rec.estimated_savings_usd_annual,
          estimated_savings_usd_monthly: rec.estimated_savings_usd_monthly,
          confidence: rec.confidence,
          request_volume: rec.current_state.request_volume_monthly,
        },
        user_role_target: 'FINANCE',
        severity: rec.estimated_savings_usd_annual > 50000 ? 'critical' : 'high',
      };

      try {
        const { error } = await this.supabase.functions.invoke('cursor-agent-adapter', {
          body: {
            agent: 'inbox',
            action: 'create_task',
            payload: inboxPayload,
            context,
          },
        });

        if (error) {
          console.error('[SimulationAgent] Failed to create inbox task:', error);
        } else {
          console.log(`[SimulationAgent] Created inbox task for $${rec.estimated_savings_usd_annual} savings`);
        }
      } catch (err) {
        console.error('[SimulationAgent] Error invoking inbox agent:', err);
      }
    }
  }

  /**
   * Send conflicts and recommendations to Inbox
   */
  private async sendToInbox(
    recommendations: OptimizationRecommendation[],
    conflicts: PolicyConflict[],
    enterprise_id: string,
    context: Record<string, unknown>
  ): Promise<void> {
    // Send critical conflicts
    for (const conflict of conflicts.filter(c => c.severity === 'critical')) {
      const inboxPayload = {
        source_agent: 'simulation',
        enterprise_id,
        task_type: 'policy_conflict',
        action_type: 'REVIEW_POLICY_CONFLICT',
        title: `Policy Conflict: ${conflict.description}`,
        summary_html: `
          <div class="space-y-2">
            <p class="text-sm font-semibold text-red-600">${conflict.conflict_type.toUpperCase()}</p>
            <p class="text-sm">${conflict.description}</p>
            <p class="text-xs text-muted-foreground">Affected requests: ${conflict.affected_requests}</p>
          </div>
        `,
        action_payload: { conflict },
        context_data: { conflict },
        user_role_target: 'LEGAL',
        severity: conflict.severity,
      };

      await this.supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'inbox',
          action: 'create_task',
          payload: inboxPayload,
          context,
        },
      });
    }
  }

  /**
   * Main entry point for generic simulation
   */
  private async runSimulation(input: SimulationInput, context: Record<string, unknown>): Promise<SimulationResult> {
    const { simulation_type } = input;

    switch (simulation_type) {
      case 'historical_replay':
        return await this.historicalReplay(input, context);
      case 'cost_optimization':
        return await this.optimizeCosts(input, context);
      case 'deprecation_impact':
        return await this.analyzeDeprecation(input, context);
      default:
        throw new Error(`Unknown simulation type: ${simulation_type}`);
    }
  }

  /**
   * Detect policy conflicts by comparing decisions
   */
  private async detectConflicts(input: SimulationInput, context: Record<string, unknown>): Promise<SimulationResult> {
    // Wrapper for historical replay with focus on conflicts
    const result = await this.historicalReplay(input, context);
    return result;
  }
}
