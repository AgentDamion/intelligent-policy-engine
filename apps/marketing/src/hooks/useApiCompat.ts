import { unifiedApi } from '@/services/unified-api';
import { useToast } from '@/hooks/use-toast';

/**
 * Enhanced API hook that provides both backward compatibility
 * and access to new unified features
 */
export const useApiCompat = () => {
  const { toast } = useToast();

  // Enhanced methods that leverage unified API
  const getPolicies = async () => {
    try {
      return await unifiedApi.tools.getPolicies();
    } catch (error) {
      console.error('Failed to get policies:', error);
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive"
      });
      return [];
    }
  };

  const getLiveMetrics = async () => {
    try {
      return await unifiedApi.tools.getLiveMetrics();
    } catch (error) {
      console.error('Failed to get live metrics:', error);
      return {};
    }
  };

  const getRecentDecisions = async (limit: number = 5) => {
    try {
      return await unifiedApi.tools.getRecentDecisions(limit);
    } catch (error) {
      console.error('Failed to get recent decisions:', error);
      return [];
    }
  };

  return {
    // Core API methods
    getPolicies,
    getLiveMetrics,
    getRecentDecisions,
    
    // Direct access to unified services
    unified: unifiedApi,
    
    // Individual service access
    documents: unifiedApi.documents,
    approvals: unifiedApi.approvals,
    compliance: unifiedApi.compliance,
    audit: unifiedApi.audit,
    governance: unifiedApi.governance,
    reports: unifiedApi.reports,
    websocket: unifiedApi.websocket
  };
};