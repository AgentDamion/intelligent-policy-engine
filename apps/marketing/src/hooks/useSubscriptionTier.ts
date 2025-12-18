import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TierData {
  tier: 'foundation' | 'enterprise' | 'network_command';
  maxPartners: number;
  maxWorkspaces: number;
  currentPartners: number;
  currentWorkspaces: number;
  canAddPartner: boolean;
  canAddWorkspace: boolean;
  upgradeRequired: boolean;
  nextTierRecommendation: string;
  features: {
    audit_export: boolean;
    tool_intelligence: boolean;
    advanced_workflows: boolean;
  };
  loading: boolean;
}

export const useSubscriptionTier = (enterpriseId?: string) => {
  const [tierData, setTierData] = useState<TierData>({
    tier: 'foundation',
    maxPartners: 10,
    maxWorkspaces: 5,
    currentPartners: 0,
    currentWorkspaces: 0,
    canAddPartner: true,
    canAddWorkspace: true,
    upgradeRequired: false,
    nextTierRecommendation: 'enterprise',
    features: {
      audit_export: false,
      tool_intelligence: false,
      advanced_workflows: false,
    },
    loading: true,
  });

  useEffect(() => {
    const fetchTierData = async () => {
      if (!enterpriseId) {
        setTierData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get enterprise with subscription tier
        const { data: enterprise } = await supabase
          .from('enterprises')
          .select('subscription_tier')
          .eq('id', enterpriseId)
          .single();

        if (!enterprise) {
          setTierData(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get tier limits
        const { data: tierLimits } = await supabase
          .from('subscription_tier_limits')
          .select('*')
          .eq('tier', enterprise.subscription_tier)
          .single();

        if (!tierLimits) {
          setTierData(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get current partner count using the database function
        const { data: partnerCountData } = await supabase
          .rpc('get_enterprise_partner_count', {
            enterprise_id_param: enterpriseId
          });

        const currentPartners = partnerCountData || 0;

        // Get current workspace count
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id')
          .eq('enterprise_id', enterpriseId);

        const currentWorkspaces = workspaces?.length || 0;

        // Determine next tier recommendation
        let nextTierRecommendation = 'enterprise';
        if (enterprise.subscription_tier === 'foundation') {
          nextTierRecommendation = 'enterprise';
        } else if (enterprise.subscription_tier === 'enterprise') {
          nextTierRecommendation = 'network_command';
        } else {
          nextTierRecommendation = 'network_command';
        }

        setTierData({
          tier: enterprise.subscription_tier as TierData['tier'],
          maxPartners: tierLimits.max_partners,
          maxWorkspaces: tierLimits.max_workspaces,
          currentPartners,
          currentWorkspaces,
          canAddPartner: currentPartners < tierLimits.max_partners,
          canAddWorkspace: currentWorkspaces < tierLimits.max_workspaces,
          upgradeRequired: currentPartners >= tierLimits.max_partners || currentWorkspaces >= tierLimits.max_workspaces,
          nextTierRecommendation,
          features: tierLimits.features as TierData['features'],
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching tier data:', error);
        setTierData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTierData();
  }, [enterpriseId]);

  return tierData;
};