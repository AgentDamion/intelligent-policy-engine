import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeclarationFilters {
  partnerId?: string;
  projectId?: string;
  status?: string;
  dateRange?: { from: string; to: string };
  fileType?: string;
  riskTier?: string;
}

export function useAssetDeclarations(filters: DeclarationFilters = {}) {
  return useQuery({
    queryKey: ['asset-declarations', filters],
    queryFn: async () => {
      let query = supabase
        .from('asset_declarations')
        .select('*')
        .order('declared_at', { ascending: false });

      if (filters.partnerId) {
        query = query.eq('partner_id', filters.partnerId);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.status) {
        query = query.eq('validation_status', filters.status);
      }
      if (filters.riskTier) {
        query = query.eq('aggregated_risk_tier', filters.riskTier);
      }
      if (filters.fileType) {
        query = query.ilike('file_type', `%${filters.fileType}%`);
      }
      if (filters.dateRange?.from) {
        query = query.gte('declared_at', filters.dateRange.from);
      }
      if (filters.dateRange?.to) {
        query = query.lte('declared_at', filters.dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
