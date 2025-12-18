import { supabase } from "@/integrations/supabase/client";
import { EffectivePolicySnapshot } from "@/types/effectivePolicySnapshot";

export class EffectivePolicySnapshotService {
  /**
   * Generate EPS by calling edge function
   */
  static async generate(
    policyInstanceId: string,
    scopeId?: string,
    triggerSource: 'approval' | 'activation' | 'scoped_policy_change' | 'clause_mapping' = 'activation'
  ): Promise<EffectivePolicySnapshot> {
    const { data, error } = await supabase.functions.invoke('generate-eps', {
      body: {
        policy_instance_id: policyInstanceId,
        scope_id: scopeId,
        trigger_source: triggerSource
      }
    });

    if (error) {
      console.error('Failed to generate EPS:', error);
      throw new Error(`EPS generation failed: ${error.message}`);
    }

    return data.eps as EffectivePolicySnapshot;
  }

  /**
   * Get current EPS for a policy instance
   */
  static async getCurrent(policyInstanceId: string): Promise<EffectivePolicySnapshot | null> {
    const { data: instance, error } = await supabase
      .from('policy_instances' as any)
      .select('current_eps_id')
      .eq('id', policyInstanceId)
      .single();

    if (error || !(instance as any)?.current_eps_id) return null;

    const { data: eps, error: epsError } = await supabase
      .from('effective_policy_snapshots' as any)
      .select('*')
      .eq('id', (instance as any).current_eps_id)
      .single();

    if (epsError) return null;
    return eps as unknown as EffectivePolicySnapshot;
  }

  /**
   * Get all EPS versions for a policy instance
   */
  static async getHistory(policyInstanceId: string): Promise<EffectivePolicySnapshot[]> {
    const { data, error } = await supabase
      .from('effective_policy_snapshots' as any)
      .select('*')
      .eq('policy_instance_id', policyInstanceId)
      .order('version', { ascending: false });

    if (error) return [];
    return (data as unknown as EffectivePolicySnapshot[]) || [];
  }
}
