import { supabase } from "@/integrations/supabase/client";
import { EffectivePolicySnapshotService } from "./EffectivePolicySnapshotService";

export interface ClauseMapping {
  clause_id: string;
  field_path: string;
  suggested_value: any;
  rationale: string;
  confidence: number;
}

export class ClauseMappingService {
  /**
   * Get approved/auto-applied clause mappings for a policy instance
   */
  static async getForInstance(policyInstanceId: string): Promise<ClauseMapping[]> {
    const { data, error } = await supabase
      .from('policy_clauses' as any)
      .select('id, pom_field_mappings')
      .contains('applied_to_instances', [policyInstanceId]);

    if (error) {
      console.error('Failed to fetch clause mappings:', error);
      return [];
    }

    const mappings: ClauseMapping[] = [];
    for (const clause of (data as any) || []) {
      const fieldMappings = clause.pom_field_mappings as any[];
      if (!fieldMappings) continue;

      for (const mapping of fieldMappings) {
        mappings.push({
          clause_id: clause.id,
          field_path: mapping.field_path,
          suggested_value: mapping.suggested_value,
          rationale: mapping.rationale || '',
          confidence: mapping.confidence || 1.0
        });
      }
    }

    return mappings;
  }

  /**
   * Apply a clause mapping to a policy instance and trigger EPS regeneration
   */
  static async applyToInstance(
    clauseId: string,
    policyInstanceId: string
  ): Promise<void> {
    const { data: clause, error } = await supabase
      .from('policy_clauses' as any)
      .select('applied_to_instances')
      .eq('id', clauseId)
      .single();

    if (error) throw error;

    const currentInstances = (clause as any).applied_to_instances || [];
    if (!currentInstances.includes(policyInstanceId)) {
      await supabase
        .from('policy_clauses' as any)
        .update({
          applied_to_instances: [...currentInstances, policyInstanceId]
        } as any)
        .eq('id', clauseId);

      // Trigger EPS regeneration
      await EffectivePolicySnapshotService.generate(
        policyInstanceId,
        undefined,
        'clause_mapping'
      );
    }
  }
}
