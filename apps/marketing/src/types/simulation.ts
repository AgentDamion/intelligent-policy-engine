// Simulation Agent Types

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
