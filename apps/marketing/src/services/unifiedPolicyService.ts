import { supabase } from '@/integrations/supabase/client';
import { PolicyTemplate } from '@/types/policy';
import type { 
  ScopedPolicy, 
  PolicyConflict, 
  EffectivePolicy,
  ScopeHierarchy,
  PolicyTreeNode 
} from '@/types/policy-inheritance';

/**
 * Unified Policy Service
 * Handles both template-based policies (Track 1) and scoped policies (Track 2)
 */
export class UnifiedPolicyService {
  // ========== Template-based Policy Operations (Track 1) ==========
  
  /**
   * Fetch all policy templates
   */
  static async fetchPolicyTemplates(): Promise<PolicyTemplate[]> {
    const response = await fetch('/api/policy-templates');
    if (!response.ok) throw new Error('Failed to fetch templates');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.templates)) {
      return data.templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        industry: template.industry,
        template_type: template.template_type,
        rules: template.base_rules || {},
        default_rules: template.base_rules || {}
      }));
    } else {
      throw new Error('Invalid API response format');
    }
  }

  /**
   * Save a custom policy from a template
   */
  static async saveCustomPolicy(
    organizationId: string,
    organizationType: string,
    templateId: string,
    policyName: string,
    customizedRules: Record<string, any>
  ): Promise<any> {
    const response = await fetch('/api/policy-templates/customize-policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        templateId,
        customizations: customizedRules,
        policyName,
      }),
    });

    if (!response.ok) throw new Error('Failed to save policy');
    return response.json();
  }

  // ========== Scoped Policy Operations (Track 2) ==========

  /**
   * Get scope hierarchy for an enterprise
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
    const scopeMap = new Map<string, any>();
    const rootScopes: any[] = [];

    scopes.forEach(scope => {
      const mappedScope = { ...scope, name: scope.scope_name, parent_scope_id: scope.parent_id, children: [] };
      scopeMap.set(scope.id, mappedScope);
    });

    scopes.forEach(scope => {
      const node = scopeMap.get(scope.id)!;
      if (scope.parent_id) {
        const parent = scopeMap.get(scope.parent_id);
        if (parent) parent.children.push(node);
      } else {
        rootScopes.push(node);
      }
    });

    const enterprise = rootScopes.find(s => s.scope_type === 'enterprise');
    const regions = Array.from(scopeMap.values()).filter(s => s.scope_type === 'region');
    const countries = Array.from(scopeMap.values()).filter(s => s.scope_type === 'country');
    const brands = Array.from(scopeMap.values()).filter(s => s.scope_type === 'brand');

    return { enterprise, regions, countries, brands, tree: enterprise };
  }

  /**
   * Get policy inheritance tree
   */
  static async getPolicyInheritanceTree(enterpriseId: string): Promise<PolicyTreeNode[]> {
    const { data: policies, error } = await supabase
      .from('scoped_policies')
      .select(`*, scopes (scope_name, scope_type, scope_path)`)
      .eq('enterprise_id', enterpriseId);

    if (error || !policies || policies.length === 0) return [];

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
          scope_type: scope?.scope_type || 'enterprise',
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
        if (parent) parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  /**
   * Get effective policy for a scope
   */
  static async getEffectivePolicy(scopeId: string): Promise<EffectivePolicy | null> {
    const { data, error } = await supabase.rpc('get_effective_policy', { p_scope_id: scopeId });
    if (error) return null;
    return data as unknown as EffectivePolicy;
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

    // Auto-detect conflicts after creation
    if (result?.id) {
      await this.detectConflicts(result.id);
    }

    return result?.id || null;
  }

  /**
   * Update a scoped policy
   */
  static async updateScopedPolicy(
    policyId: string,
    updates: {
      policy_name?: string;
      inheritance_mode?: 'replace' | 'merge' | 'append';
      rules?: Record<string, any>;
      override_rules?: Record<string, any>;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from('scoped_policies')
      .update(updates)
      .eq('id', policyId);

    if (error) {
      console.error('Failed to update scoped policy:', error);
      return false;
    }

    // Re-detect conflicts after update
    await this.detectConflicts(policyId);
    return true;
  }

  /**
   * Get inherited rules for a scope
   */
  static async getInheritedRules(scopeId: string): Promise<Record<string, any>> {
    const effectivePolicy = await this.getEffectivePolicy(scopeId);
    return effectivePolicy?.effective_rules || {};
  }

  /**
   * Detect conflicts for a policy
   */
  static async detectConflicts(policyId: string): Promise<boolean> {
    const { error } = await supabase.rpc('detect_policy_conflicts', { p_child_policy_id: policyId });
    if (error) return false;
    return true;
  }

  /**
   * Get policy conflicts
   */
  static async getPolicyConflicts(policyId: string): Promise<PolicyConflict[]> {
    const { data, error } = await supabase
      .from('policy_conflicts')
      .select('*')
      .or(`child_policy_id.eq.${policyId},parent_policy_id.eq.${policyId}`)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []).map((conflict: any) => ({
      id: conflict.id,
      policy_id: conflict.child_policy_id,
      parent_policy_id: conflict.parent_policy_id,
      conflict_type: conflict.conflict_type,
      severity: conflict.severity,
      conflicting_rule: conflict.field_path,
      parent_value: conflict.parent_value,
      child_value: conflict.child_value,
      description: 'Policy conflict detected',
      resolution_status: 'unresolved',
      resolved_at: conflict.resolved_at,
      resolved_by: conflict.resolved_by,
      resolution_notes: conflict.resolution_notes,
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

    return !error;
  }

  /**
   * Get policy count by scope
   */
  static async getPolicyCountByScope(scopeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('scoped_policies')
      .select('*', { count: 'exact', head: true })
      .eq('scope_id', scopeId);

    if (error) return 0;
    return count || 0;
  }
}
