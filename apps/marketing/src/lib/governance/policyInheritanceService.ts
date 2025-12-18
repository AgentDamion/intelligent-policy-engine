import { supabase } from '@/integrations/supabase/client';
import type { 
  Scope, 
  ScopedPolicy, 
  PolicyConflict, 
  EffectivePolicy,
  ScopeHierarchy,
  PolicyTreeNode 
} from '@/types/policy-inheritance';

export class PolicyInheritanceService {
  /**
   * Get the complete scope hierarchy for an enterprise
   */
  static async getScopeHierarchy(enterpriseId: string): Promise<ScopeHierarchy | null> {
    const { data: scopes, error } = await supabase
      .from('scopes')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('scope_path');

    if (error) {
      console.error('Failed to fetch scope hierarchy:', error);
      return null;
    }

    if (!scopes || scopes.length === 0) return null;

    // Build tree structure
    const scopeMap = new Map<string, Scope>();
    const rootScopes: Scope[] = [];

    scopes.forEach(scope => {
      const mappedScope: Scope = {
        ...scope,
        name: scope.scope_name,
        parent_scope_id: scope.parent_id || undefined,
        children: []
      };
      scopeMap.set(scope.id, mappedScope);
    });

    scopes.forEach(scope => {
      const node = scopeMap.get(scope.id)!;
      if (scope.parent_id) {
        const parent = scopeMap.get(scope.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootScopes.push(node);
      }
    });

    const enterprise = rootScopes.find(s => s.scope_type === 'enterprise');
    const regions = Array.from(scopeMap.values()).filter(s => s.scope_type === 'region');
    const countries = Array.from(scopeMap.values()).filter(s => s.scope_type === 'country');
    const brands = Array.from(scopeMap.values()).filter(s => s.scope_type === 'brand');

    return {
      enterprise: enterprise!,
      regions,
      countries,
      brands,
      tree: enterprise!
    };
  }

  /**
   * Get all policies with their inheritance relationships
   */
  static async getPolicyInheritanceTree(enterpriseId: string): Promise<PolicyTreeNode[]> {
    const { data: policies, error } = await supabase
      .from('scoped_policies')
      .select(`
        *,
        scopes (
          scope_name,
          scope_type,
          scope_path
        )
      `)
      .eq('enterprise_id', enterpriseId);

    if (error) {
      console.error('Failed to fetch policy inheritance tree:', error);
      return [];
    }

    if (!policies || policies.length === 0) {
      return [];
    }

    // Build tree structure based on scope hierarchy
    const policyMap = new Map<string, PolicyTreeNode>();
    const rootNodes: PolicyTreeNode[] = [];

    policies.forEach((policy: any) => {
      const scope = policy.scopes;
      const node: PolicyTreeNode = {
        policy: {
          id: policy.id,
          scope_id: policy.scope_id,
          scope_path: scope?.scope_path || '',
          scope_name: scope?.scope_name || '',
          scope_type: (scope?.scope_type as any) || 'enterprise',
          policy_name: policy.policy_name,
          inheritance_mode: policy.inheritance_mode,
          rules: policy.rules || {},
          override_rules: policy.override_rules,
          enterprise_id: policy.enterprise_id,
          created_at: policy.created_at,
          updated_at: policy.updated_at,
          created_by: policy.created_by,
          parent_policy_id: policy.parent_policy_id,
        },
        children: [],
        hasConflicts: false
      };
      policyMap.set(policy.id, node);
    });

    policies.forEach((policy: any) => {
      const node = policyMap.get(policy.id)!;
      if (policy.parent_policy_id) {
        const parent = policyMap.get(policy.parent_policy_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  /**
   * Get the effective policy for a specific scope
   */
  static async getEffectivePolicy(scopeId: string): Promise<EffectivePolicy | null> {
    const { data, error } = await supabase
      .rpc('get_effective_policy', { p_scope_id: scopeId });

    if (error) {
      console.error('Failed to get effective policy:', error);
      return null;
    }

    return data as unknown as EffectivePolicy;
  }

  /**
   * Trigger conflict detection for a policy
   */
  static async detectConflicts(policyId: string): Promise<boolean> {
    const { error } = await supabase
      .rpc('detect_policy_conflicts', { p_child_policy_id: policyId });

    if (error) {
      console.error('Failed to detect conflicts:', error);
      return false;
    }

    return true;
  }

  /**
   * Get all conflicts for a policy
   */
  static async getPolicyConflicts(policyId: string): Promise<PolicyConflict[]> {
    const { data, error } = await supabase
      .from('policy_conflicts')
      .select('*')
      .or(`child_policy_id.eq.${policyId},parent_policy_id.eq.${policyId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch policy conflicts:', error);
      return [];
    }

    // Map database fields to our interface
    return (data || []).map((conflict: any) => ({
      id: conflict.id,
      policy_id: conflict.child_policy_id,
      parent_policy_id: conflict.parent_policy_id,
      conflict_type: conflict.conflict_type as any,
      severity: conflict.severity as any,
      conflicting_rule: conflict.field_path,
      parent_value: conflict.parent_value,
      child_value: conflict.child_value,
      description: 'Policy conflict detected',
      resolution_status: 'unresolved',
      resolved_at: conflict.resolved_at || undefined,
      resolved_by: conflict.resolved_by || undefined,
      resolution_notes: conflict.resolution_notes || undefined,
      created_at: conflict.created_at
    }));
  }

  /**
   * Resolve a conflict
   */
  static async resolveConflict(
    conflictId: string, 
    resolution: 'accept_child' | 'revert_to_parent' | 'acknowledge',
    notes?: string
  ): Promise<boolean> {
    const user = await supabase.auth.getUser();
    const { error } = await supabase
      .from('policy_conflicts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.data.user?.id,
        resolution_notes: notes
      })
      .eq('id', conflictId);

    if (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }

    return true;
  }

  /**
   * Create a scoped policy
   */
  static async createScopedPolicy(data: {
    scope_id: string;
    policy_name: string;
    inheritance_mode: 'replace' | 'merge' | 'append';
    rules: Record<string, any>;
    override_rules?: Record<string, any>;
    parent_policy_id?: string;
    enterprise_id: string;
  }): Promise<string | null> {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    const { data: result, error } = await supabase
      .from('scoped_policies')
      .insert({
        scope_id: data.scope_id,
        policy_name: data.policy_name,
        inheritance_mode: data.inheritance_mode,
        rules: data.rules,
        override_rules: data.override_rules,
        parent_policy_id: data.parent_policy_id,
        enterprise_id: data.enterprise_id,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create scoped policy:', error);
      return null;
    }

    return result?.id || null;
  }

  /**
   * Get policy count by scope
   */
  static async getPolicyCountByScope(scopeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('scoped_policies')
      .select('*', { count: 'exact', head: true })
      .eq('scope_id', scopeId);

    if (error) {
      console.error('Failed to get policy count:', error);
      return 0;
    }

    return count || 0;
  }
}
