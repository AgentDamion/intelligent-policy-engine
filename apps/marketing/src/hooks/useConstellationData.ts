import { useQuery } from '@tanstack/react-query';
import { spineService } from '@/services/spineService';

type ConstellationMode = 'collapsed' | 'expanded';

interface FeatureDriver {
  label: string;
  impact: string;
  weight: number;
}

interface CollapsedData {
  topThree: FeatureDriver[];
  confidence: number;
}

interface ExpandedData {
  topThree: FeatureDriver[];
  confidence: number;
  allFeatures: FeatureDriver[];
  decisionPath: string[];
  modelVersion: string;
}

export const useConstellationData = (threadId: string, mode: ConstellationMode = 'collapsed') => {
  return useQuery<CollapsedData | ExpandedData>({
    queryKey: ['constellation', threadId, mode],
    queryFn: async () => {
      const narrative = await spineService.fetchNarrative(threadId);
      const explainability = narrative.narrative.explainability;
      
      if (!explainability) {
        throw new Error('No explainability data available');
      }

      // Sort features by weight (with defensive check)
      const sortedFeatures = Array.isArray(explainability.features)
        ? [...explainability.features].sort((a, b) => b.weight - a.weight)
        : [];
      
      if (sortedFeatures.length === 0) {
        console.warn('No feature drivers available for thread:', threadId);
      }
      
      // Map to driver format
      const allDrivers: FeatureDriver[] = sortedFeatures.map(f => ({
        label: f.label,
        impact: `+${Math.round(f.weight * 100)}% confidence`,
        weight: f.weight
      }));

      const topThree = allDrivers.slice(0, 3);
      const confidence = typeof explainability.confidence === 'number'
        ? Math.round(explainability.confidence * 100)
        : 0;

      if (mode === 'collapsed') {
        return {
          topThree,
          confidence
        } as CollapsedData;
      }

      // Expanded mode: include all data
      return {
        topThree,
        confidence,
        allFeatures: allDrivers,
        decisionPath: Array.isArray(explainability.decisionPath) ? explainability.decisionPath : [],
        modelVersion: explainability.modelVersion
      } as ExpandedData;
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
