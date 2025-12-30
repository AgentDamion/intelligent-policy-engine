import { supabase } from '@/lib/supabase'

export interface MSAVisibilityConfig {
  id: string
  agency_enterprise_id: string
  client_enterprise_id: string
  visibility_level: 'role_only' | 'person_level' | 'full_detail'
  overrides: {
    brands?: Record<string, 'role_only' | 'person_level' | 'full_detail'>
    roles?: Record<string, 'role_only' | 'person_level' | 'full_detail'>
  }
  msa_reference?: string
  effective_date?: string
  expiration_date?: string
  created_at: string
  updated_at: string
}

/**
 * Get MSA visibility configuration for a relationship
 */
export async function getMSAVisibility(
  agencyId: string,
  clientId: string
): Promise<{ data: MSAVisibilityConfig | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('msa_visibility')
      .select('*')
      .eq('agency_enterprise_id', agencyId)
      .eq('client_enterprise_id', clientId)
      .single()

    return { data: data as MSAVisibilityConfig | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Create new MSA visibility configuration
 */
export async function createMSAVisibility(
  config: Omit<MSAVisibilityConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: MSAVisibilityConfig | null; error: any }> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    const { data, error } = await supabase
      .from('msa_visibility')
      .insert({
        ...config,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    return { data: data as MSAVisibilityConfig | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update MSA visibility configuration
 */
export async function updateMSAVisibility(
  id: string,
  updates: Partial<Omit<MSAVisibilityConfig, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: MSAVisibilityConfig | null; error: any }> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    const { data, error } = await supabase
      .from('msa_visibility')
      .update({
        ...updates,
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single()

    return { data: data as MSAVisibilityConfig | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get effective visibility level with overrides
 */
export async function getEffectiveVisibilityLevel(
  agencyId: string,
  clientId: string,
  brandId?: string,
  role?: string
): Promise<{ data: 'role_only' | 'person_level' | 'full_detail' | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_visibility_level', {
      p_agency_enterprise_id: agencyId,
      p_client_enterprise_id: clientId,
      p_brand_id: brandId || null,
      p_role: role || null,
    })

    return { data: data as 'role_only' | 'person_level' | 'full_detail' | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Test visibility level with sample data
 */
export async function testVisibilityLevel(
  level: 'role_only' | 'person_level' | 'full_detail',
  sampleData: {
    actor_id: string
    actor_name: string
    actor_email: string
    actor_role: string
  }
): Promise<{
  visible_data: {
    actor_id: string | null
    actor_name: string | null
    actor_email: string | null
    actor_role: string | null
  }
}> {
  // Simulate what enterprise would see at each level
  switch (level) {
    case 'role_only':
      return {
        visible_data: {
          actor_id: null,
          actor_name: null,
          actor_email: null,
          actor_role: sampleData.actor_role,
        },
      }
    case 'person_level':
      return {
        visible_data: {
          actor_id: sampleData.actor_id,
          actor_name: sampleData.actor_name,
          actor_email: null,
          actor_role: null,
        },
      }
    case 'full_detail':
      return {
        visible_data: {
          actor_id: sampleData.actor_id,
          actor_name: sampleData.actor_name,
          actor_email: sampleData.actor_email,
          actor_role: sampleData.actor_role,
        },
      }
  }
}

