import { supabase } from "@/integrations/supabase/client";
import { 
  PolicyInstance, 
  CreatePolicyInstanceInput, 
  UpdatePolicyInstanceInput,
  PolicyInstanceStatus 
} from "@/types/policyInstance";

export class PolicyInstanceService {
  /**
   * Create a new policy instance
   */
  static async createInstance(
    input: CreatePolicyInstanceInput
  ): Promise<PolicyInstance> {
    const { data, error } = await supabase
      .from('policy_instances' as any)
      .insert({
        template_id: input.template_id,
        tool_version_id: input.tool_version_id,
        use_case: input.use_case,
        jurisdiction: input.jurisdiction,
        audience: input.audience,
        pom: input.pom as any,
        enterprise_id: input.enterprise_id,
        workspace_id: input.workspace_id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  /**
   * Get a single policy instance by ID
   */
  static async getInstance(id: string): Promise<PolicyInstance | null> {
    const { data, error } = await supabase
      .from('policy_instances' as any)
      .select(`
        *,
        template:template_id(id, title, policy_type),
        tool_version:tool_version_id(
          id,
          version,
          tool:tool_id(id, name, provider)
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  /**
   * List policy instances with filters
   */
  static async listInstances(filters: {
    enterprise_id?: string;
    workspace_id?: string;
    tool_version_id?: string;
    status?: PolicyInstanceStatus;
    template_id?: string;
  }): Promise<PolicyInstance[]> {
    let query = supabase
      .from('policy_instances' as any)
      .select(`
        *,
        template:template_id(id, title, policy_type),
        tool_version:tool_version_id(
          id,
          version,
          tool:tool_id(id, name, provider)
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.enterprise_id) {
      query = query.eq('enterprise_id', filters.enterprise_id);
    }
    if (filters.workspace_id) {
      query = query.eq('workspace_id', filters.workspace_id);
    }
    if (filters.tool_version_id) {
      query = query.eq('tool_version_id', filters.tool_version_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.template_id) {
      query = query.eq('template_id', filters.template_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Update a policy instance
   */
  static async updateInstance(
    id: string,
    updates: UpdatePolicyInstanceInput
  ): Promise<PolicyInstance> {
    const { data, error } = await supabase
      .from('policy_instances' as any)
      .update({
        ...updates,
        pom: updates.pom as any,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  /**
   * Delete a policy instance
   */
  static async deleteInstance(id: string): Promise<void> {
    const { error } = await supabase
      .from('policy_instances' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Submit instance for approval
   */
  static async submitForApproval(instanceId: string): Promise<void> {
    await this.updateInstance(instanceId, { status: 'in_review' });
    
    // Create approval record
    const { error } = await supabase
      .from('approvals' as any)
      .insert({
        object_type: 'policy_instance',
        object_id: instanceId,
        stage: 'initial_review',
        required_roles: ['admin', 'owner'],
      });

    if (error) throw error;
  }

  /**
   * Approve a policy instance and generate EPS
   */
  static async approveInstance(
    instanceId: string,
    approverId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('policy_instances' as any)
      .update({ 
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', instanceId);

    if (error) throw error;

    // Generate EPS on approval
    try {
      const { data: instance } = await supabase
        .from('policy_instances' as any)
        .select('scope_id')
        .eq('id', instanceId)
        .single();

      const { EffectivePolicySnapshotService } = await import('./EffectivePolicySnapshotService');
      await EffectivePolicySnapshotService.generate(
        instanceId,
        (instance as any)?.scope_id,
        'approval'
      );
    } catch (epsError) {
      console.error('Failed to generate EPS on approval:', epsError);
      // Don't fail approval if EPS generation fails
    }
  }

  /**
   * Activate a policy instance and generate/activate EPS
   */
  static async activateInstance(instanceId: string): Promise<void> {
    await this.updateInstance(instanceId, { status: 'active' });

    // Generate and activate EPS
    try {
      const { data: instance } = await supabase
        .from('policy_instances' as any)
        .select('scope_id')
        .eq('id', instanceId)
        .single();

      const { EffectivePolicySnapshotService } = await import('./EffectivePolicySnapshotService');
      await EffectivePolicySnapshotService.generate(
        instanceId,
        (instance as any)?.scope_id,
        'activation'
      );
    } catch (epsError) {
      console.error('Failed to generate EPS on activation:', epsError);
      throw epsError; // Activation should fail if EPS can't be generated
    }
  }

  /**
   * Deprecate a policy instance
   */
  static async deprecateInstance(instanceId: string): Promise<void> {
    await this.updateInstance(instanceId, { status: 'deprecated' });
  }

  /**
   * Get instances by tool version (useful for version upgrades)
   */
  static async getInstancesByToolVersion(
    toolVersionId: string
  ): Promise<PolicyInstance[]> {
    return this.listInstances({ tool_version_id: toolVersionId });
  }
}
