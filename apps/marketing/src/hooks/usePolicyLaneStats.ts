import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PolicyLaneStats {
  governance_compliance: number;
  security_access: number;
  integration_scalability: number;
  business_ops: number;
}

/**
 * Hook to fetch policy lane statistics for a workspace or enterprise
 * Uses SECURITY DEFINER RPCs for tenant-safe reads
 */
export const usePolicyLaneStats = (
  scope: 'workspace' | 'enterprise',
  id: string | undefined
) => {
  const [stats, setStats] = useState<PolicyLaneStats>({
    governance_compliance: 0,
    security_access: 0,
    integration_scalability: 0,
    business_ops: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const rpcName =
          scope === 'workspace'
            ? 'app_policy_lane_stats_by_workspace'
            : 'app_policy_lane_stats_by_enterprise';

        const param =
          scope === 'workspace'
            ? { _workspace_id: id }
            : { _enterprise_id: id };

        const { data, error } = await supabase.rpc(rpcName as any, param);

        if (error) throw error;

        setStats(
          (data as PolicyLaneStats) || {
            governance_compliance: 0,
            security_access: 0,
            integration_scalability: 0,
            business_ops: 0,
          }
        );
      } catch (error) {
        console.error('Failed to fetch policy lane stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load policy lane statistics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id, scope, toast]);

  return { stats, loading };
};
