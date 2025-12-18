import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DimensionScores {
  dataSensitivity: number;
  externalExposure: number;
  modelTransparency: number;
  misuseVectors: number;
  legalIPRisk: number;
  operationalCriticality: number;
}

export const useRiskProfileSimulation = (enterpriseId: string, workspaceId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assessRiskProfile = useCallback(async (
    toolDescription: string,
    dimensionScores?: DimensionScores
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agentName: 'compliance',
          action: 'analyze',
          input: {
            toolDescription,
            manualDimensionScores: dimensionScores
          },
          context: {
            enterpriseId,
            workspaceId,
            operation: 'risk_profile_assessment'
          }
        }
      });

      if (functionError) throw functionError;
      if (!data?.success) throw new Error(data?.error || 'Assessment failed');

      return {
        tier: data.result.metadata.riskProfile.tier,
        dimensionScores: data.result.metadata.riskProfile.dimensionScores,
        auditChecklist: data.result.metadata.riskProfile.auditChecklist,
        confidence: data.result.confidence
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, workspaceId]);

  return {
    assessRiskProfile,
    loading,
    error
  };
};
