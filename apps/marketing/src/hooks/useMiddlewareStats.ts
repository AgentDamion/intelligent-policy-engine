import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MiddlewareStats, FilterTimeRange } from '@/components/agentic/middleware/types';

export const useMiddlewareStats = (timeRange: FilterTimeRange, customDateRange?: { start: Date; end: Date }) => {
  const [stats, setStats] = useState<MiddlewareStats>({
    totalRequests: 0,
    blockRate: 0,
    avgResponseTime: 0,
    totalCost: 0,
    topModels: [],
    requestsByDecision: [],
  });
  const [loading, setLoading] = useState(true);

  const getTimeRangeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'custom':
        return customDateRange?.start.toISOString() || new Date(0).toISOString();
      default:
        return new Date(0).toISOString();
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('middleware_requests')
          .select('*')
          .gte('created_at', getTimeRangeFilter());

        if (error) throw error;

        const requests = data || [];
        const totalRequests = requests.length;
        const blockedRequests = requests.filter((r) => r.policy_decision === 'block').length;
        const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;
        
        const totalResponseTime = requests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);
        const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
        
        const totalCost = requests.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0);

        // Top models
        const modelCounts = requests.reduce((acc, r) => {
          const model = r.model || 'unknown';
          acc[model] = (acc[model] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const topModels = Object.entries(modelCounts)
          .map(([model, count]) => ({ model, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Requests by decision
        const decisionCounts = requests.reduce((acc, r) => {
          const decision = r.policy_decision || 'unknown';
          acc[decision] = (acc[decision] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const requestsByDecision = Object.entries(decisionCounts)
          .map(([decision, count]) => ({ decision, count }));

        setStats({
          totalRequests,
          blockRate,
          avgResponseTime,
          totalCost,
          topModels,
          requestsByDecision,
        });
      } catch (error) {
        console.error('Error fetching middleware stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange, customDateRange]);

  return { stats, loading };
};
