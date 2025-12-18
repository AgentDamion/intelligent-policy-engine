import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromotionAnalytics {
  tool_id: number;
  tool_name: string;
  promotion_tier: string;
  impressions: number;
  clicks: number;
  requests: number;
  conversion_rate: number;
  cost_per_click: number;
  roi: number;
}

export const usePromotionAnalytics = () => {
  const [analytics, setAnalytics] = useState<PromotionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch active promotions with analytics data
      const { data, error } = await supabase
        .from('vendor_promotions')
        .select(`
          tool_id,
          promotion_tier,
          analytics_data,
          marketplace_tools!tool_id (
            name,
            promotion_analytics
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      const analyticsData = data?.map(promotion => {
        const toolData = promotion.marketplace_tools as any;
        const promotionAnalytics = toolData?.promotion_analytics || {};
        const analyticsData = promotion.analytics_data || {};

        const impressions = promotionAnalytics.impressions || 0;
        const clicks = promotionAnalytics.clicks || 0;
        const requests = promotionAnalytics.requests || 0;
        const conversionRate = impressions > 0 ? (requests / impressions) * 100 : 0;
        
        // Mock cost per click based on tier
        const costPerClick = {
          'featured': 2.50,
          'premium': 1.80,
          'standard': 1.20
        }[promotion.promotion_tier] || 1.00;

        const totalCost = clicks * costPerClick;
        const revenue = requests * 50; // Assume $50 average revenue per request
        const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0;

        return {
          tool_id: promotion.tool_id,
          tool_name: toolData?.name || 'Unknown Tool',
          promotion_tier: promotion.promotion_tier,
          impressions,
          clicks,
          requests,
          conversion_rate: conversionRate,
          cost_per_click: costPerClick,
          roi
        };
      }) || [];

      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching promotion analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (toolId: number) => {
    try {
      await supabase.rpc('update_promotion_analytics', {
        p_tool_id: toolId,
        p_event_type: 'impressions',
        p_count: 1
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async (toolId: number) => {
    try {
      await supabase.rpc('update_promotion_analytics', {
        p_tool_id: toolId,
        p_event_type: 'clicks',
        p_count: 1
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const trackRequest = async (toolId: number) => {
    try {
      await supabase.rpc('update_promotion_analytics', {
        p_tool_id: toolId,
        p_event_type: 'requests',
        p_count: 1
      });
    } catch (error) {
      console.error('Error tracking request:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
    trackImpression,
    trackClick,
    trackRequest
  };
};