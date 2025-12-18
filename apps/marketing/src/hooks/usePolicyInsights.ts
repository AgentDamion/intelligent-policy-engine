import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PolicyInsight {
  id: string;
  enterprise_id: string;
  insight_type: 'anomaly' | 'optimization' | 'compliance' | 'cleanup';
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
  recommendations: Recommendation[];
  status: 'active' | 'resolved' | 'dismissed';
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
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

export interface PolicyHealthSummary {
  critical_issues: number;
  warnings: number;
  optimization_suggestions: number;
  cleanup_recommendations: number;
  last_analysis_at?: string;
}

export const usePolicyInsights = (enterpriseId: string) => {
  const [insights, setInsights] = useState<PolicyInsight[]>([]);
  const [healthSummary, setHealthSummary] = useState<PolicyHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Fetch active insights
  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_insights')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .eq('status', 'active')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights((data || []) as unknown as PolicyInsight[]);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: 'Error loading insights',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch health summary
  const fetchHealthSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_health_summary')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
      setHealthSummary(data || {
        critical_issues: 0,
        warnings: 0,
        optimization_suggestions: 0,
        cleanup_recommendations: 0
      });
    } catch (error) {
      console.error('Error fetching health summary:', error);
    }
  };

  // Run policy health analysis
  const runAnalysis = async (analysisType: 'all' | 'anomaly' | 'optimization' | 'compliance' | 'cleanup' = 'all') => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agentName: 'policy-maintenance',
          action: 'analyze',
          input: {
            enterprise_id: enterpriseId,
            analysis_type: analysisType,
            time_range: '7days'
          },
          context: {}
        }
      });

      if (error) throw error;

      // Store insights in database
      if (data?.result?.insights && data.result.insights.length > 0) {
        const insightsToStore = data.result.insights.map((insight: any) => ({
          enterprise_id: enterpriseId,
          insight_type: insight.type,
          severity: insight.severity,
          title: insight.title,
          description: insight.description,
          affected_policies: insight.affected_policies,
          affected_partners: insight.affected_partners,
          data_evidence: insight.data_evidence,
          recommendations: data.result.recommendations.filter((r: any) => r.insight_id === insight.id),
          status: 'active'
        }));

        const { error: insertError } = await supabase
          .from('policy_insights')
          .insert(insightsToStore);

        if (insertError) throw insertError;

        toast({
          title: 'Analysis complete',
          description: `Found ${data.result.insights.length} insights`
        });

        // Refresh insights
        await fetchInsights();
        await fetchHealthSummary();
      } else {
        toast({
          title: 'Analysis complete',
          description: 'No new insights detected'
        });
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dismiss an insight
  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('policy_insights')
        .update({ status: 'dismissed' })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(prev => prev.filter(i => i.id !== insightId));
      await fetchHealthSummary();

      toast({
        title: 'Insight dismissed',
        description: 'This insight has been removed from your active list'
      });
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss insight',
        variant: 'destructive'
      });
    }
  };

  // Resolve an insight
  const resolveInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('policy_insights')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(prev => prev.filter(i => i.id !== insightId));
      await fetchHealthSummary();

      toast({
        title: 'Insight resolved',
        description: 'This issue has been marked as resolved'
      });
    } catch (error) {
      console.error('Error resolving insight:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve insight',
        variant: 'destructive'
      });
    }
  };

  // Execute a recommendation
  const executeRecommendation = async (recommendation: Recommendation) => {
    try {
      if (!recommendation.auto_executable) {
        toast({
          title: 'Manual action required',
          description: 'This recommendation requires manual review',
          variant: 'default'
        });
        return false;
      }

      // Execute based on action type
      switch (recommendation.action_type) {
        case 'adjust_policy':
          // This would need to update the policy through the proper flow
          // For now, just mark as needing manual review
          toast({
            title: 'Policy adjustment required',
            description: 'Please review and update the policy manually',
            variant: 'default'
          });
          return false;

        case 'revoke_key':
          const keyId = recommendation.action_payload.key_id as string;
          
          const { error: keyError } = await supabase
            .from('partner_api_keys')
            .update({ is_active: false })
            .eq('id', keyId);

          if (keyError) throw keyError;
          break;

        case 'archive_policy':
          // This would need to update the policy through the proper flow
          // For now, just mark as needing manual review
          toast({
            title: 'Policy archival required',
            description: 'Please archive the policy manually',
            variant: 'default'
          });
          return false;

        default:
          throw new Error(`Unknown action type: ${recommendation.action_type}`);
      }

      toast({
        title: 'Recommendation applied',
        description: recommendation.title
      });

      // Resolve the associated insight
      await resolveInsight(recommendation.insight_id);
      return true;
    } catch (error) {
      console.error('Error executing recommendation:', error);
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    fetchInsights();
    fetchHealthSummary();

    const channel = supabase
      .channel('policy-insights-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policy_insights',
          filter: `enterprise_id=eq.${enterpriseId}`
        },
        () => {
          fetchInsights();
          fetchHealthSummary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enterpriseId]);

  return {
    insights,
    healthSummary,
    isLoading,
    isAnalyzing,
    runAnalysis,
    dismissInsight,
    resolveInsight,
    executeRecommendation,
    refreshInsights: fetchInsights
  };
};
