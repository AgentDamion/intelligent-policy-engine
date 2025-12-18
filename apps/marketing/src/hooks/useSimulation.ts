import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SimulationInput, SimulationResult } from '@/types/simulation';
import { useToast } from '@/hooks/use-toast';

export function useSimulation(enterpriseId: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const { toast } = useToast();

  const runSimulation = async (input: Omit<SimulationInput, 'enterprise_id'>) => {
    setLoading(true);
    setResult(null);

    try {
      console.log('[useSimulation] Starting simulation:', input.simulation_type);

      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'simulation',
          action: input.simulation_type,
          payload: {
            ...input,
            enterprise_id: enterpriseId,
          },
          context: { enterprise_id: enterpriseId },
        },
      });

      if (error) throw error;

      console.log('[useSimulation] Simulation completed:', data);
      setResult(data);

      toast({
        title: "Simulation Complete",
        description: `Analyzed ${data.impact_summary.requests_analyzed} requests with ${data.recommendations.length} recommendations`,
      });

      return data;
    } catch (error) {
      console.error('[useSimulation] Error:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const runCostOptimization = async (minSavingsThreshold: number = 1000) => {
    return runSimulation({
      simulation_type: 'cost_optimization',
      parameters: {
        min_savings_threshold: minSavingsThreshold,
      },
    });
  };

  const runHistoricalReplay = async (policyId: string, hoursLookback: number = 168) => {
    return runSimulation({
      policy_id: policyId,
      simulation_type: 'historical_replay',
      parameters: {
        hours_lookback: hoursLookback,
      },
    });
  };

  const analyzeDeprecation = async (modelName: string) => {
    return runSimulation({
      simulation_type: 'deprecation_impact',
      parameters: {
        model_to_deprecate: modelName,
      },
    });
  };

  return {
    runSimulation,
    runCostOptimization,
    runHistoricalReplay,
    analyzeDeprecation,
    loading,
    result,
  };
}
