import { supabase } from '@/lib/supabase';

export interface RoleArchetype {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
}

/**
 * Get all role archetypes
 */
export async function getRoleArchetypes(): Promise<{ data: RoleArchetype[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('role_archetypes')
      .select('id, name, description, icon, color, display_order')
      .order('display_order', { ascending: true });

    return { data: data as RoleArchetype[] | null, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get role archetype by ID
 */
export async function getRoleArchetype(id: string): Promise<{ data: RoleArchetype | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('role_archetypes')
      .select('id, name, description, icon, color, display_order')
      .eq('id', id)
      .single();

    return { data: data as RoleArchetype | null, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Default role archetype mapping (fallback if database is unavailable)
 */
export const DEFAULT_ROLE_ARCHETYPES: Record<string, { name: string; icon: string; color: string }> = {
  client_owner: { name: 'Client Owner', icon: 'user-check', color: 'amber' },
  team_lead: { name: 'Team Lead', icon: 'users', color: 'stone' },
  creative_director: { name: 'Creative Director', icon: 'palette', color: 'violet' },
  compliance_reviewer: { name: 'Compliance Reviewer', icon: 'search', color: 'emerald' },
  legal_counsel: { name: 'Legal Counsel', icon: 'scale', color: 'blue' },
  contributor: { name: 'Contributor', icon: 'user', color: 'stone' },
  workflow_coordinator: { name: 'Workflow Coordinator', icon: 'git-branch', color: 'stone' },
  internal_compliance: { name: 'Internal Compliance', icon: 'clipboard-check', color: 'emerald' },
  governance_admin: { name: 'Governance Administrator', icon: 'shield', color: 'amber' },
  enterprise_owner: { name: 'Enterprise Owner', icon: 'crown', color: 'amber' },
  enterprise_admin: { name: 'Enterprise Administrator', icon: 'settings', color: 'stone' },
};

