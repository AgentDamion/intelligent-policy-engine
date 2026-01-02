/**
 * Workspace Context Service
 * 
 * Service layer for fetching workspace data with compliance metrics and brand information.
 * Used by WorkspaceContext provider and ContextSwitcher component.
 */

import { supabase } from '@/lib/supabase'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Workspace {
  id: string
  name: string
  enterpriseId: string
  enterpriseName: string
  tenancyType: 'owning' | 'shared'
  userRole: string
  complianceScore?: number
  pendingActions?: number
  brands?: Brand[]
}

export interface Brand {
  id: string
  name: string
  workspaceId: string
}

export interface WorkspaceMetrics {
  complianceScore: number
  pendingCount: number
}

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

/**
 * Get all workspaces accessible to a user with metrics
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_accessible_workspaces', {
      p_user_id: userId,
    })

    if (error) {
      console.error('[workspaceContextService] Error fetching workspaces:', error)
      throw error
    }

    if (!data) return []

    // Transform the results and fetch brands for each workspace
    const workspaces = await Promise.all(
      data.map(async (row: any) => {
        const brands = await getWorkspaceBrands(row.workspace_id)
        
        return {
          id: row.workspace_id,
          name: row.workspace_name,
          enterpriseId: row.enterprise_id,
          enterpriseName: row.enterprise_name,
          tenancyType: row.tenancy_type as 'owning' | 'shared',
          userRole: row.user_role,
          complianceScore: row.compliance_score,
          pendingActions: row.pending_count,
          brands: brands.length > 0 ? brands : undefined,
        }
      })
    )

    return workspaces
  } catch (error) {
    console.error('[workspaceContextService] Error in getUserWorkspaces:', error)
    return []
  }
}

/**
 * Get brands for a workspace
 */
export async function getWorkspaceBrands(workspaceId: string): Promise<Brand[]> {
  try {
    const { data, error } = await supabase.rpc('get_workspace_brands', {
      p_workspace_id: workspaceId,
    })

    if (error) {
      // Brand workspaces table may not exist - this is OK
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        return []
      }
      console.error('[workspaceContextService] Error fetching brands:', error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.brand_id,
      name: row.brand_name,
      workspaceId: row.workspace_id,
    }))
  } catch (error) {
    console.error('[workspaceContextService] Error in getWorkspaceBrands:', error)
    return []
  }
}

/**
 * Get compliance metrics for a workspace
 */
export async function getWorkspaceMetrics(workspaceId: string): Promise<WorkspaceMetrics> {
  try {
    const [scoreResult, countResult] = await Promise.all([
      supabase.rpc('get_workspace_compliance_score', {
        p_workspace_id: workspaceId,
      }),
      supabase.rpc('get_workspace_pending_count', {
        p_workspace_id: workspaceId,
      }),
    ])

    if (scoreResult.error) {
      console.error('[workspaceContextService] Error fetching compliance score:', scoreResult.error)
    }

    if (countResult.error) {
      console.error('[workspaceContextService] Error fetching pending count:', countResult.error)
    }

    return {
      complianceScore: scoreResult.data ?? 0,
      pendingCount: countResult.data ?? 0,
    }
  } catch (error) {
    console.error('[workspaceContextService] Error in getWorkspaceMetrics:', error)
    return {
      complianceScore: 0,
      pendingCount: 0,
    }
  }
}

/**
 * Switch to a different workspace (delegates to UnifiedAuthContext)
 * This function exists for API consistency but actual switching is handled by UnifiedAuthContext
 */
export async function switchWorkspace(
  workspaceId: string,
  brandId?: string
): Promise<void> {
  // Workspace switching is handled by UnifiedAuthContext service
  // This function is kept for API consistency but may be expanded in the future
  // to handle brand-specific context switching
  console.log('[workspaceContextService] switchWorkspace called:', { workspaceId, brandId })
  
  // Store brand preference in localStorage if provided
  if (brandId) {
    localStorage.setItem(`workspace_${workspaceId}_brand`, brandId)
  }
}

