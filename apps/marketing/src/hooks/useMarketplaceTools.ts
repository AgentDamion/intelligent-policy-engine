import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketplaceTool {
  id: number;
  name: string;
  vendor_enterprise_id: string;
  category: string;
  description: string | null;
  website: string | null;
  pricing_tier: string;
  status: string;
  compliance_certifications: string[];
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  vendor_logo?: string;
  promotion_tier?: string | null;
  is_promoted?: boolean;
}

export interface MarketplaceFilters {
  searchTerm: string;
  industries: string[];
  compliance: string[];
  dataTypes: string[];
  agenticVerified: boolean;
  status?: string;
}

export const useMarketplaceTools = (filters?: MarketplaceFilters) => {
  const [tools, setTools] = useState<MarketplaceTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('marketplace_tools')
        .select(`
          *,
          enterprises!vendor_enterprise_id (
            name,
            domain
          ),
          vendor_promotions!tool_id (
            promotion_tier,
            expires_at,
            status
          )
        `)
        .eq('status', 'verified'); // Only show verified tools by default

      // Apply search filter
      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      // Apply category filter (map industries to categories)
      if (filters?.industries && filters.industries.length > 0) {
        const categoryFilters = filters.industries.map(industry => {
          switch (industry.toLowerCase()) {
            case 'pharma': return 'Medical Imaging';
            case 'healthcare': return 'Healthcare';
            case 'marketing': return 'Marketing Analytics';
            case 'finance': return 'Financial Services';
            case 'manufacturing': return 'Manufacturing';
            default: return industry;
          }
        });
        query = query.in('category', categoryFilters);
      }

      // Apply compliance filter
      if (filters?.compliance && filters.compliance.length > 0) {
        query = query.overlaps('compliance_certifications', filters.compliance);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include vendor name and ensure proper typing
      const transformedTools: MarketplaceTool[] = data?.map(tool => {
        // Safely handle compliance_certifications which is Json type from Supabase
        let certifications: string[] = [];
        if (Array.isArray(tool.compliance_certifications)) {
          certifications = tool.compliance_certifications.filter(cert => typeof cert === 'string') as string[];
        } else if (typeof tool.compliance_certifications === 'string') {
          try {
            const parsed = JSON.parse(tool.compliance_certifications);
            if (Array.isArray(parsed)) {
              certifications = parsed.filter(cert => typeof cert === 'string');
            }
          } catch {
            certifications = [];
          }
        }

        // Get promotion data
        const activePromotion = (tool.vendor_promotions as any[])?.find(
          promo => promo.status === 'active' && new Date(promo.expires_at) > new Date()
        );

        return {
          ...tool,
          vendor_name: (tool.enterprises as any)?.name || 'Unknown Vendor',
          vendor_logo: getVendorLogo(tool.category),
          compliance_certifications: certifications,
          promotion_tier: activePromotion?.promotion_tier || null,
          is_promoted: !!activePromotion
        };
      }) || [];

      // Sort tools: promoted first, then by creation date
      const sortedTools = transformedTools.sort((a, b) => {
        // Promoted tools first
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;
        
        // Among promoted tools, sort by tier (featured > premium > standard)
        if (a.is_promoted && b.is_promoted) {
          const tierOrder = { 'featured': 3, 'premium': 2, 'standard': 1 };
          const aTier = tierOrder[a.promotion_tier as keyof typeof tierOrder] || 0;
          const bTier = tierOrder[b.promotion_tier as keyof typeof tierOrder] || 0;
          if (aTier !== bTier) return bTier - aTier;
        }
        
        // Then by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setTools(sortedTools);
    } catch (err) {
      console.error('Error fetching marketplace tools:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [filters]);

  const getVendorLogo = (category: string): string => {
    const logoMap: { [key: string]: string } = {
      'Medical Imaging': '🏥',
      'Healthcare': '💊',
      'Financial Services': '💰',
      'Marketing Analytics': '📊',
      'Data Security': '🛡️',
      'Compliance Monitoring': '🤖',
      'Manufacturing': '🏭',
      'default': '🔧'
    };
    return logoMap[category] || logoMap.default;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'CheckCircle2';
      case 'pending_verification':
        return 'Clock';
      case 'update_required':
        return 'AlertTriangle';
      default:
        return 'Clock';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'bg-brand-green/10 text-brand-green';
      case 'pending_verification':
        return 'bg-brand-orange/10 text-brand-orange';
      case 'update_required':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return {
    tools,
    loading,
    error,
    refetch: fetchTools,
    getStatusIcon,
    getStatusColor
  };
};