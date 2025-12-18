import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RiskAnalytics {
  totalSubmissions: number;
  averageRiskScore: number;
  riskDistribution: { level: string; count: number; percentage: number }[];
  categoryBreakdown: { category: string; avgScore: number; count: number }[];
  trendData: { date: string; avgRisk: number; count: number }[];
}

export const useRiskAnalytics = (workspaceId?: string) => {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('scores')
        .select(`
          *,
          submissions (workspace_id, created_at, status)
        `)
        .order('created_at', { ascending: false });

      // Filter by workspace through submissions table
      if (workspaceId) {
        query = query.eq('submissions.workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setScores(data || []);
    } catch (err) {
      console.error('Error fetching risk analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch risk data');
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo((): RiskAnalytics => {
    if (!scores.length) {
      return {
        totalSubmissions: 0,
        averageRiskScore: 0,
        riskDistribution: [],
        categoryBreakdown: [],
        trendData: []
      };
    }

    const validScores = scores.filter(s => s.overall_score !== null);
    const totalSubmissions = validScores.length;
    const averageRiskScore = totalSubmissions > 0 
      ? validScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / totalSubmissions 
      : 0;

    // Risk distribution
    const riskBuckets = { low: 0, medium: 0, high: 0 };
    validScores.forEach(score => {
      const risk = score.overall_score || 0;
      if (risk < 30) riskBuckets.low++;
      else if (risk < 70) riskBuckets.medium++;
      else riskBuckets.high++;
    });

    const riskDistribution = Object.entries(riskBuckets).map(([level, count]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count,
      percentage: totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0
    }));

    // Category breakdown
    const categoryData: Record<string, { total: number; count: number }> = {};
    validScores.forEach(score => {
      if (score.category_scores && typeof score.category_scores === 'object') {
        Object.entries(score.category_scores).forEach(([category, value]) => {
          if (typeof value === 'number') {
            if (!categoryData[category]) {
              categoryData[category] = { total: 0, count: 0 };
            }
            categoryData[category].total += value;
            categoryData[category].count += 1;
          }
        });
      }
    });

    const categoryBreakdown = Object.entries(categoryData).map(([category, data]) => ({
      category,
      avgScore: data.count > 0 ? data.total / data.count : 0,
      count: data.count
    }));

    // Trend data (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentScores = validScores.filter(score => 
      new Date(score.created_at) >= thirtyDaysAgo
    );

    const dailyData: Record<string, { total: number; count: number }> = {};
    recentScores.forEach(score => {
      const date = new Date(score.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, count: 0 };
      }
      dailyData[date].total += score.overall_score || 0;
      dailyData[date].count += 1;
    });

    const trendData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        avgRisk: data.count > 0 ? data.total / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSubmissions,
      averageRiskScore,
      riskDistribution,
      categoryBreakdown,
      trendData
    };
  }, [scores]);

  useEffect(() => {
    fetchScores();
  }, [workspaceId]);

  return { 
    analytics, 
    loading, 
    error, 
    refetch: fetchScores 
  };
};