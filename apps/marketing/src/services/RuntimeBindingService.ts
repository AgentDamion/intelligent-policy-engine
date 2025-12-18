import { supabase } from "@/integrations/supabase/client";
import { RuntimeBinding, CreateRuntimeBindingInput, UpdateRuntimeBindingInput } from "@/types/runtimeBinding";

/**
 * Service for managing runtime bindings between policy instances and workspaces/partners
 */
export class RuntimeBindingService {
  /**
   * Create a new runtime binding for an approved policy instance
   */
  static async createBinding(
    policyInstanceId: string,
    workspaceId: string,
    enterpriseId: string
  ): Promise<RuntimeBinding> {
    const input: CreateRuntimeBindingInput = {
      policy_instance_id: policyInstanceId,
      workspace_id: workspaceId,
      enterprise_id: enterpriseId,
    };

    const { data, error } = await supabase
      .from('runtime_bindings' as any)
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  /**
   * Get all active bindings for a workspace
   */
  static async getActiveBindings(
    workspaceId: string,
    toolVersionId?: string
  ): Promise<RuntimeBinding[]> {
    let query = supabase
      .from('runtime_bindings' as any)
      .select(`
        *,
        policy_instance:policy_instances(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (toolVersionId) {
      query = query.eq('policy_instance.tool_version_id', toolVersionId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Toggle binding status
   */
  static async toggleBinding(
    bindingId: string,
    isActive: boolean
  ): Promise<void> {
    const status = isActive ? 'active' : 'suspended';
    
    const { error } = await supabase
      .from('runtime_bindings' as any)
      .update({ status })
      .eq('id', bindingId);

    if (error) throw error;
  }

  /**
   * Update binding status
   */
  static async updateBinding(
    bindingId: string,
    updates: UpdateRuntimeBindingInput
  ): Promise<RuntimeBinding> {
    const { data, error } = await supabase
      .from('runtime_bindings' as any)
      .update(updates)
      .eq('id', bindingId)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  /**
   * Get all bindings for a policy instance
   */
  static async getBindingsForInstance(
    policyInstanceId: string
  ): Promise<RuntimeBinding[]> {
    const { data, error } = await supabase
      .from('runtime_bindings' as any)
      .select('*')
      .eq('policy_instance_id', policyInstanceId);

    if (error) throw error;
    return (data as any) || [];
  }
}
