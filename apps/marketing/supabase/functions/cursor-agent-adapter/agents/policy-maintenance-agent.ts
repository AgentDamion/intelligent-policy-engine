import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * PolicyMaintenanceAgent - Continuous policy health monitoring and optimization
 * 
 * Analyzes middleware request logs to detect:
 * - Anomalies (spikes in blocks, cost, latency)
 * - Optimization opportunities (strict/ineffective policies)
 * - Compliance violations (retention mismatches)
 * - Cleanup needs (unused/stale policies)
 */

export interface MaintenanceInput {
  enterprise_id: string;
  analysis_type: 'anomaly' | 'optimization' | 'compliance' | 'cleanup' | 'all';
  time_range?: string; // e.g., '7days', '30days', '24hours'
  policy_id?: string; // For targeted analysis
}

export interface MaintenanceResult {
  insights: Insight[];
  recommendations: Recommendation[];
  confidence: number;
  metadata: {
    analysis_time_ms: number;
    data_points_analyzed: number;
    severity_distribution: Record<string, number>;
  };
}

export interface Insight {
  id: string;
  type: 'anomaly' | 'optimization' | 'compliance' | 'cleanup';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affected_policies: string[];
  affected_partners: string[];
  data_evidence: {
    metric: string;
    current_value: number;
    threshold: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  detected_at: string;
}

export interface Recommendation {
  insight_id: string;
  action_type: 'revoke_key' | 'adjust_policy' | 'archive_policy' | 'increase_budget' | 'add_rule' | 'review_policy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  auto_executable: boolean;
  action_payload: Record<string, unknown>;
}

export class PolicyMaintenanceAgent {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async process(input: MaintenanceInput, context: Record<string, unknown>): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const insights: Insight[] = [];
    const recommendations: Recommendation[] = [];

    try {
      // Run requested analysis types
      if (input.analysis_type === 'all' || input.analysis_type === 'anomaly') {
        const anomalies = await this.detectAnomalies(input.enterprise_id, input.time_range || '24hours');
        insights.push(...anomalies.insights);
        recommendations.push(...anomalies.recommendations);
      }

      if (input.analysis_type === 'all' || input.analysis_type === 'optimization') {
        const optimizations = await this.suggestOptimizations(input.enterprise_id, input.time_range || '30days', input.policy_id);
        insights.push(...optimizations.insights);
        recommendations.push(...optimizations.recommendations);
      }

      if (input.analysis_type === 'all' || input.analysis_type === 'compliance') {
        const compliance = await this.validateCompliance(input.enterprise_id);
        insights.push(...compliance.insights);
        recommendations.push(...compliance.recommendations);
      }

      if (input.analysis_type === 'all' || input.analysis_type === 'cleanup') {
        const cleanup = await this.identifyUnusedPolicies(input.enterprise_id);
        insights.push(...cleanup.insights);
        recommendations.push(...cleanup.recommendations);
      }

      const analysisTime = Date.now() - startTime;
      const severityDistribution = this.calculateSeverityDistribution(insights);

      return {
        insights,
        recommendations,
        confidence: insights.length > 0 ? 0.85 : 1.0,
        metadata: {
          analysis_time_ms: analysisTime,
          data_points_analyzed: insights.length,
          severity_distribution: severityDistribution
        }
      };
    } catch (error) {
      console.error('PolicyMaintenanceAgent error:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in middleware request patterns
   */
  private async detectAnomalies(enterpriseId: string, timeRange: string): Promise<{ insights: Insight[]; recommendations: Recommendation[] }> {
    const insights: Insight[] = [];
    const recommendations: Recommendation[] = [];

    try {
      // Calculate time window
      const hours = this.parseTimeRange(timeRange);
      
      // Get hourly stats for anomaly detection
      const { data: hourlyStats, error } = await this.supabase.rpc('get_middleware_hourly_stats', {
        p_enterprise_id: enterpriseId,
        p_hours: hours
      });

      if (error) {
        console.error('Error fetching hourly stats:', error);
        return { insights, recommendations };
      }

      if (!hourlyStats || hourlyStats.length === 0) {
        return { insights, recommendations };
      }

      // Analyze block rate spikes
      const blockRateAnomaly = this.detectBlockRateSpike(hourlyStats);
      if (blockRateAnomaly) {
        insights.push(blockRateAnomaly.insight);
        recommendations.push(...blockRateAnomaly.recommendations);
      }

      // Analyze cost spikes
      const costAnomaly = this.detectCostSpike(hourlyStats);
      if (costAnomaly) {
        insights.push(costAnomaly.insight);
        recommendations.push(...costAnomaly.recommendations);
      }

      // Analyze latency degradation
      const latencyAnomaly = this.detectLatencyDegradation(hourlyStats);
      if (latencyAnomaly) {
        insights.push(latencyAnomaly.insight);
        recommendations.push(...latencyAnomaly.recommendations);
      }

    } catch (error) {
      console.error('Anomaly detection error:', error);
    }

    return { insights, recommendations };
  }

  /**
   * Suggest policy optimizations based on enforcement patterns
   */
  private async suggestOptimizations(enterpriseId: string, timeRange: string, policyId?: string): Promise<{ insights: Insight[]; recommendations: Recommendation[] }> {
    const insights: Insight[] = [];
    const recommendations: Recommendation[] = [];

    try {
      const hours = this.parseTimeRange(timeRange);

      // Get policy effectiveness stats
      const { data: policyStats, error } = await this.supabase.rpc('get_policy_effectiveness', {
        p_enterprise_id: enterpriseId,
        p_hours: hours,
        p_policy_id: policyId
      });

      if (error || !policyStats) {
        console.error('Error fetching policy stats:', error);
        return { insights, recommendations };
      }

      for (const stat of policyStats) {
        // Check for overly strict policies (>90% block rate)
        if (stat.block_rate > 0.9 && stat.request_count > 10) {
          const insightId = `opt_strict_${stat.policy_id}`;
          insights.push({
            id: insightId,
            type: 'optimization',
            severity: 'warning',
            title: 'Policy Too Restrictive',
            description: `Policy ${stat.policy_id} blocks ${(stat.block_rate * 100).toFixed(0)}% of requests. Consider adjusting rules or adding fallback options.`,
            affected_policies: [stat.policy_id],
            affected_partners: [],
            data_evidence: {
              metric: 'block_rate',
              current_value: stat.block_rate,
              threshold: 0.30,
              trend: 'stable'
            },
            detected_at: new Date().toISOString()
          });

          recommendations.push({
            insight_id: insightId,
            action_type: 'review_policy',
            title: 'Review Policy Rules',
            description: 'Analyze blocked requests to identify common patterns and adjust policy rules',
            impact: 'medium',
            effort: 'medium',
            auto_executable: false,
            action_payload: { policy_id: stat.policy_id }
          });
        }

        // Check for ineffective policies (0% block rate)
        if (stat.block_rate === 0 && stat.request_count > 50) {
          const insightId = `opt_ineffective_${stat.policy_id}`;
          insights.push({
            id: insightId,
            type: 'optimization',
            severity: 'info',
            title: 'Policy Has No Effect',
            description: `Policy ${stat.policy_id} has not blocked any requests in ${timeRange}. Consider archiving or adjusting.`,
            affected_policies: [stat.policy_id],
            affected_partners: [],
            data_evidence: {
              metric: 'block_rate',
              current_value: 0,
              threshold: 0.01,
              trend: 'stable'
            },
            detected_at: new Date().toISOString()
          });

          recommendations.push({
            insight_id: insightId,
            action_type: 'archive_policy',
            title: 'Archive Unused Policy',
            description: 'Mark policy as inactive since it has no enforcement impact',
            impact: 'low',
            effort: 'low',
            auto_executable: true,
            action_payload: { policy_id: stat.policy_id }
          });
        }

        // Check for high cost, low value policies
        if (stat.avg_cost > 0.05 && stat.block_rate < 0.1 && stat.request_count > 20) {
          const insightId = `opt_expensive_${stat.policy_id}`;
          insights.push({
            id: insightId,
            type: 'optimization',
            severity: 'warning',
            title: 'Expensive Policy with Low Value',
            description: `Policy ${stat.policy_id} incurs high costs ($${stat.avg_cost.toFixed(3)}/request) but blocks only ${(stat.block_rate * 100).toFixed(1)}% of requests.`,
            affected_policies: [stat.policy_id],
            affected_partners: [],
            data_evidence: {
              metric: 'cost_per_request',
              current_value: stat.avg_cost,
              threshold: 0.01,
              trend: 'stable'
            },
            detected_at: new Date().toISOString()
          });

          recommendations.push({
            insight_id: insightId,
            action_type: 'adjust_policy',
            title: 'Optimize Cost Controls',
            description: 'Consider using cheaper models for low-risk requests',
            impact: 'high',
            effort: 'medium',
            auto_executable: false,
            action_payload: { policy_id: stat.policy_id }
          });
        }
      }

    } catch (error) {
      console.error('Optimization analysis error:', error);
    }

    return { insights, recommendations };
  }

  /**
   * Validate compliance configuration
   */
  private async validateCompliance(enterpriseId: string): Promise<{ insights: Insight[]; recommendations: Recommendation[] }> {
    const insights: Insight[] = [];
    const recommendations: Recommendation[] = [];

    try {
      // Get all active policies with compliance requirements
      const { data: policies, error } = await this.supabase
        .from('policy_instances')
        .select('id, name, boundary_rules, created_at')
        .eq('enterprise_id', enterpriseId)
        .eq('is_active', true);

      if (error || !policies) {
        console.error('Error fetching policies:', error);
        return { insights, recommendations };
      }

      for (const policy of policies) {
        const rules = policy.boundary_rules as any;
        
        // Check HIPAA retention requirements
        if (rules?.compliance_requirements?.includes('HIPAA')) {
          const retentionDays = rules?.audit_retention || 30;
          const requiredDays = 2555; // 7 years

          if (retentionDays < requiredDays) {
            const insightId = `comp_hipaa_retention_${policy.id}`;
            insights.push({
              id: insightId,
              type: 'compliance',
              severity: 'critical',
              title: 'HIPAA Retention Violation',
              description: `Policy "${policy.name}" requires HIPAA compliance but audit retention is only ${retentionDays} days (required: ${requiredDays} days / 7 years)`,
              affected_policies: [policy.id],
              affected_partners: [],
              data_evidence: {
                metric: 'audit_retention_days',
                current_value: retentionDays,
                threshold: requiredDays,
                trend: 'stable'
              },
              detected_at: new Date().toISOString()
            });

            recommendations.push({
              insight_id: insightId,
              action_type: 'adjust_policy',
              title: 'Fix Retention Period',
              description: `Update audit retention to ${requiredDays} days to meet HIPAA requirements`,
              impact: 'high',
              effort: 'low',
              auto_executable: true,
              action_payload: {
                policy_id: policy.id,
                new_rules: {
                  ...rules,
                  audit_retention: requiredDays
                }
              }
            });
          }
        }

        // Check for PII/PHI scope inconsistencies
        const dataScope = rules?.data_scope || [];
        if (dataScope.includes('pii') && !dataScope.includes('phi') && rules?.compliance_requirements?.includes('HIPAA')) {
          const insightId = `comp_scope_inconsistency_${policy.id}`;
          insights.push({
            id: insightId,
            type: 'compliance',
            severity: 'warning',
            title: 'Data Scope Inconsistency',
            description: `Policy "${policy.name}" includes PII filtering but not PHI, despite HIPAA requirement`,
            affected_policies: [policy.id],
            affected_partners: [],
            data_evidence: {
              metric: 'data_scope_completeness',
              current_value: 0.5,
              threshold: 1.0,
              trend: 'stable'
            },
            detected_at: new Date().toISOString()
          });

          recommendations.push({
            insight_id: insightId,
            action_type: 'adjust_policy',
            title: 'Add PHI to Data Scope',
            description: 'Include Protected Health Information (PHI) in the data scope filter',
            impact: 'high',
            effort: 'low',
            auto_executable: false,
            action_payload: { policy_id: policy.id }
          });
        }
      }

    } catch (error) {
      console.error('Compliance validation error:', error);
    }

    return { insights, recommendations };
  }

  /**
   * Identify unused or stale policies
   */
  private async identifyUnusedPolicies(enterpriseId: string): Promise<{ insights: Insight[]; recommendations: Recommendation[] }> {
    const insights: Insight[] = [];
    const recommendations: Recommendation[] = [];

    try {
      // Get policy usage stats
      const { data: usageStats, error } = await this.supabase.rpc('get_policy_usage_stats', {
        p_enterprise_id: enterpriseId,
        p_days: 90
      });

      if (error || !usageStats) {
        console.error('Error fetching usage stats:', error);
        return { insights, recommendations };
      }

      for (const stat of usageStats) {
        // Unused policies (0 requests in 90 days)
        if (stat.request_count === 0) {
          const insightId = `cleanup_unused_${stat.policy_id}`;
          insights.push({
            id: insightId,
            type: 'cleanup',
            severity: 'info',
            title: 'Unused Policy Detected',
            description: `Policy "${stat.policy_name}" has had no enforcement activity in 90 days`,
            affected_policies: [stat.policy_id],
            affected_partners: [],
            data_evidence: {
              metric: 'request_count',
              current_value: 0,
              threshold: 10,
              trend: 'decreasing'
            },
            detected_at: new Date().toISOString()
          });

          recommendations.push({
            insight_id: insightId,
            action_type: 'archive_policy',
            title: 'Archive Policy',
            description: 'Mark policy as inactive since it has no usage',
            impact: 'low',
            effort: 'low',
            auto_executable: true,
            action_payload: { policy_id: stat.policy_id }
          });
        }

        // Stale policies (not updated in 365 days with low usage)
        const daysSinceUpdate = Math.floor((Date.now() - new Date(stat.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 365 && stat.request_count < 10) {
          const insightId = `cleanup_stale_${stat.policy_id}`;
          insights.push({
            id: insightId,
            type: 'cleanup',
            severity: 'info',
            title: 'Stale Policy',
            description: `Policy "${stat.policy_name}" hasn't been updated in ${daysSinceUpdate} days and has minimal usage`,
            affected_policies: [stat.policy_id],
            affected_partners: [],
            data_evidence: {
              metric: 'days_since_update',
              current_value: daysSinceUpdate,
              threshold: 365,
              trend: 'increasing'
            },
            detected_at: new Date().toISOString()
          });

          recommendations.push({
            insight_id: insightId,
            action_type: 'review_policy',
            title: 'Review and Update Policy',
            description: 'Verify policy is still relevant and update rules if needed',
            impact: 'low',
            effort: 'medium',
            auto_executable: false,
            action_payload: { policy_id: stat.policy_id }
          });
        }
      }

    } catch (error) {
      console.error('Cleanup analysis error:', error);
    }

    return { insights, recommendations };
  }

  // Helper methods

  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/(\d+)(hour|day|week)s?/);
    if (!match) return 24; // Default to 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'hour': return value;
      case 'day': return value * 24;
      case 'week': return value * 24 * 7;
      default: return 24;
    }
  }

  private detectBlockRateSpike(hourlyStats: any[]): { insight: Insight; recommendations: Recommendation[] } | null {
    if (hourlyStats.length < 2) return null;

    const recent = hourlyStats[0];
    const previous = hourlyStats.slice(1);
    
    const avgBlockRate = previous.reduce((sum, h) => sum + (h.block_rate || 0), 0) / previous.length;
    const stdDev = Math.sqrt(previous.reduce((sum, h) => sum + Math.pow((h.block_rate || 0) - avgBlockRate, 2), 0) / previous.length);
    
    const threshold = avgBlockRate + (2 * stdDev);
    
    if (recent.block_rate > threshold && recent.block_rate > 0.3) {
      const insightId = `anomaly_block_spike_${Date.now()}`;
      return {
        insight: {
          id: insightId,
          type: 'anomaly',
          severity: recent.block_rate > 0.5 ? 'critical' : 'warning',
          title: 'Critical Spike in Policy Blocks',
          description: `Block rate increased from ${(avgBlockRate * 100).toFixed(1)}% to ${(recent.block_rate * 100).toFixed(1)}% in the last hour`,
          affected_policies: [],
          affected_partners: [],
          data_evidence: {
            metric: 'block_rate',
            current_value: recent.block_rate,
            threshold: avgBlockRate,
            trend: 'increasing'
          },
          detected_at: new Date().toISOString()
        },
        recommendations: [
          {
            insight_id: insightId,
            action_type: 'review_policy',
            title: 'Investigate Policy Configuration',
            description: 'Review recent policy changes or partner activity patterns',
            impact: 'high',
            effort: 'medium',
            auto_executable: false,
            action_payload: {}
          }
        ]
      };
    }

    return null;
  }

  private detectCostSpike(hourlyStats: any[]): { insight: Insight; recommendations: Recommendation[] } | null {
    if (hourlyStats.length < 2) return null;

    const recent = hourlyStats[0];
    const previous = hourlyStats.slice(1);
    
    const avgCost = previous.reduce((sum, h) => sum + (h.total_cost || 0), 0) / previous.length;
    
    if (recent.total_cost > avgCost * 3 && avgCost > 0) {
      const insightId = `anomaly_cost_spike_${Date.now()}`;
      return {
        insight: {
          id: insightId,
          type: 'anomaly',
          severity: 'warning',
          title: 'Cost Spike Detected',
          description: `Hourly cost increased from $${avgCost.toFixed(2)} to $${recent.total_cost.toFixed(2)}`,
          affected_policies: [],
          affected_partners: [],
          data_evidence: {
            metric: 'hourly_cost',
            current_value: recent.total_cost,
            threshold: avgCost,
            trend: 'increasing'
          },
          detected_at: new Date().toISOString()
        },
        recommendations: [
          {
            insight_id: insightId,
            action_type: 'review_policy',
            title: 'Review Model Usage',
            description: 'Check if expensive models are being used unexpectedly',
            impact: 'high',
            effort: 'low',
            auto_executable: false,
            action_payload: {}
          }
        ]
      };
    }

    return null;
  }

  private detectLatencyDegradation(hourlyStats: any[]): { insight: Insight; recommendations: Recommendation[] } | null {
    if (hourlyStats.length < 2) return null;

    const recent = hourlyStats[0];
    const previous = hourlyStats.slice(1);
    
    const avgLatency = previous.reduce((sum, h) => sum + (h.avg_latency || 0), 0) / previous.length;
    
    if (recent.avg_latency > avgLatency * 2 && recent.avg_latency > 500) {
      const insightId = `anomaly_latency_${Date.now()}`;
      return {
        insight: {
          id: insightId,
          type: 'anomaly',
          severity: 'warning',
          title: 'Performance Degradation',
          description: `Average latency increased from ${avgLatency.toFixed(0)}ms to ${recent.avg_latency.toFixed(0)}ms`,
          affected_policies: [],
          affected_partners: [],
          data_evidence: {
            metric: 'avg_latency_ms',
            current_value: recent.avg_latency,
            threshold: 500,
            trend: 'increasing'
          },
          detected_at: new Date().toISOString()
        },
        recommendations: [
          {
            insight_id: insightId,
            action_type: 'review_policy',
            title: 'Investigate Performance',
            description: 'Check OpenAI API status or policy evaluation overhead',
            impact: 'medium',
            effort: 'medium',
            auto_executable: false,
            action_payload: {}
          }
        ]
      };
    }

    return null;
  }

  private calculateSeverityDistribution(insights: Insight[]): Record<string, number> {
    return insights.reduce((acc, insight) => {
      acc[insight.severity] = (acc[insight.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
