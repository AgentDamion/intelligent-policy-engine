import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MiddlewareRequest, FilterTimeRange, QuickViewFilter, SortOption } from '@/components/agentic/middleware/types';

interface UseMiddlewareRequestsProps {
  timeRange: FilterTimeRange;
  quickView: QuickViewFilter;
  sortBy: SortOption;
  searchQuery: string;
  customDateRange?: { start: Date; end: Date };
}

export const useMiddlewareRequests = ({
  timeRange,
  quickView,
  sortBy,
  searchQuery,
  customDateRange,
}: UseMiddlewareRequestsProps) => {
  const [requests, setRequests] = useState<MiddlewareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
    const fetchRequests = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('middleware_requests')
          .select('*')
          .gte('created_at', getTimeRangeFilter());

        // Apply quick view filters
        if (quickView === 'blocked') {
          query = query.eq('policy_decision', 'block');
        } else if (quickView === 'warned') {
          query = query.eq('policy_decision', 'warn');
        } else if (quickView === 'allowed') {
          query = query.eq('policy_decision', 'allow');
        } else if (quickView === 'slow') {
          query = query.gte('response_time_ms', 500);
        }

        // Apply search
        if (searchQuery) {
          query = query.or(`model.ilike.%${searchQuery}%,partner_id.ilike.%${searchQuery}%`);
        }

        // Apply sorting
        if (sortBy === 'recent') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        } else if (sortBy === 'cost') {
          query = query.order('estimated_cost_usd', { ascending: false, nullsFirst: false });
        } else if (sortBy === 'slowest') {
          query = query.order('response_time_ms', { ascending: false, nullsFirst: false });
        }

        query = query.limit(1000);

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setRequests((data || []) as MiddlewareRequest[]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch requests'));
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Real-time subscription
    const channel = supabase
      .channel('middleware_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'middleware_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange, quickView, sortBy, searchQuery, customDateRange]);

  return { requests, loading, error };
};
