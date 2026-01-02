/**
 * Workspace Context Provider
 * 
 * Provides workspace state management, brand selection, and boundary context.
 * Integrates with UnifiedAuthContext for context switching.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useUnifiedAuthContext, type ContextSwitchRequest } from '@/services/auth/unifiedAuthContext'
import {
  getUserWorkspaces,
  switchWorkspace,
  type Workspace,
  type Brand,
} from '@/services/workspace/workspaceContextService'
import { supabase } from '@/lib/supabase'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface BoundaryContext {
  enterpriseId: string
  enterpriseName: string
  partnerId?: string
  partnerName?: string
}

interface WorkspaceContextType {
  // Current workspace state
  currentWorkspace: Workspace | null
  currentBrand: Brand | null
  
  // Available workspaces (grouped by tenancy type)
  workspaces: Workspace[]
  owningWorkspaces: Workspace[]
  sharedWorkspaces: Workspace[]
  
  // Boundary context (enterprise ↔ partner relationship)
  boundaryContext: BoundaryContext | null
  
  // Loading and error states
  loading: boolean
  error: string | null
  
  // Actions
  switchToWorkspace: (workspaceId: string, brandId?: string) => Promise<void>
  selectBrand: (brandId: string) => void
  refreshWorkspaces: () => Promise<void>
}

// ============================================================
// CONTEXT CREATION
// ============================================================

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// ============================================================
// HOOK
// ============================================================

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const { currentContext, switchContext } = useUnifiedAuthContext()
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null)
  const [boundaryContext, setBoundaryContext] = useState<BoundaryContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Compute grouped workspaces
  const owningWorkspaces = workspaces.filter(w => w.tenancyType === 'owning')
  const sharedWorkspaces = workspaces.filter(w => w.tenancyType === 'shared')

  // Fetch workspaces for current user
  const refreshWorkspaces = useCallback(async () => {
    if (!user?.id) {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fetchedWorkspaces = await getUserWorkspaces(user.id)
      setWorkspaces(fetchedWorkspaces)

      // If we have a current context, try to find matching workspace
      if (currentContext?.workspaceId) {
        const matchingWorkspace = fetchedWorkspaces.find(w => w.id === currentContext.workspaceId)
        if (matchingWorkspace) {
          setCurrentWorkspace(matchingWorkspace)
          
          // Restore brand preference from localStorage
          const savedBrandId = localStorage.getItem(`workspace_${matchingWorkspace.id}_brand`)
          if (savedBrandId && matchingWorkspace.brands) {
            const brand = matchingWorkspace.brands.find(b => b.id === savedBrandId)
            if (brand) {
              setCurrentBrand(brand)
            }
          }
        }
      } else if (fetchedWorkspaces.length > 0) {
        // Default to first workspace if no current context
        setCurrentWorkspace(fetchedWorkspaces[0])
      }
    } catch (err) {
      console.error('[WorkspaceContext] Error fetching workspaces:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentContext?.workspaceId])

  // Fetch boundary context when workspace changes
  const fetchBoundaryContext = useCallback(async (workspace: Workspace | null, userId?: string) => {
    if (!workspace) {
      setBoundaryContext(null)
      return
    }

    try {
      if (!user?.id) {
        setBoundaryContext(null)
        return
      }

      // Check if this workspace is part of a partner-client relationship
      // Look for partner_client_contexts where user has access and this enterprise is the client
      const { data: contexts } = await supabase
        .from('partner_client_contexts')
        .select(`
          partner_enterprise_id,
          client_enterprise_id,
          enterprises!partner_client_contexts_partner_enterprise_id_fkey(id, name),
          enterprises!partner_client_contexts_client_enterprise_id_fkey(id, name)
        `)
        .eq('user_id', user.id)
        .eq('client_enterprise_id', workspace.enterpriseId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (contexts) {
        // Get partner enterprise name from the relationship
        const { data: partnerEnterprise } = await supabase
          .from('enterprises')
          .select('id, name')
          .eq('id', contexts.partner_enterprise_id)
          .single()

        if (partnerEnterprise) {
          setBoundaryContext({
            enterpriseId: workspace.enterpriseId,
            enterpriseName: workspace.enterpriseName,
            partnerId: contexts.partner_enterprise_id,
            partnerName: partnerEnterprise.name,
          })
          return
        }
      }

      setBoundaryContext(null)
    } catch (err) {
      console.error('[WorkspaceContext] Error fetching boundary context:', err)
      setBoundaryContext(null)
    }
  }, [user?.id])

  // Switch to a different workspace
  const switchToWorkspace = useCallback(async (workspaceId: string, brandId?: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      console.error('[WorkspaceContext] Workspace not found:', workspaceId)
      return
    }

    try {
      // Use UnifiedAuthContext to switch context
      const request: ContextSwitchRequest = {
        enterpriseId: workspace.enterpriseId,
        workspaceId: workspace.id,
        contextType: 'enterprise',
      }
      await switchContext(request)

      // Update local state
      setCurrentWorkspace(workspace)
      
      // Select brand if provided
      if (brandId && workspace.brands) {
        const brand = workspace.brands.find(b => b.id === brandId)
        if (brand) {
          setCurrentBrand(brand)
          localStorage.setItem(`workspace_${workspaceId}_brand`, brandId)
        }
      } else {
        setCurrentBrand(null)
        localStorage.removeItem(`workspace_${workspaceId}_brand`)
      }

      // Fetch boundary context for new workspace
      await fetchBoundaryContext(workspace, user?.id)
    } catch (err) {
      console.error('[WorkspaceContext] Error switching workspace:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch workspace')
    }
  }, [workspaces, switchContext, fetchBoundaryContext])

  // Select a brand within current workspace
  const selectBrand = useCallback((brandId: string) => {
    if (!currentWorkspace?.brands) return

    const brand = currentWorkspace.brands.find(b => b.id === brandId)
    if (brand) {
      setCurrentBrand(brand)
      if (currentWorkspace.id) {
        localStorage.setItem(`workspace_${currentWorkspace.id}_brand`, brandId)
      }
    }
  }, [currentWorkspace])

  // Initial load and refresh when user/context changes
  useEffect(() => {
    refreshWorkspaces()
  }, [refreshWorkspaces])

  // Update boundary context when workspace changes
  useEffect(() => {
    fetchBoundaryContext(currentWorkspace, user?.id)
  }, [currentWorkspace, user?.id, fetchBoundaryContext])

  // Sync with UnifiedAuthContext changes
  useEffect(() => {
    if (currentContext?.workspaceId && currentWorkspace?.id !== currentContext.workspaceId) {
      const matchingWorkspace = workspaces.find(w => w.id === currentContext.workspaceId)
      if (matchingWorkspace) {
        setCurrentWorkspace(matchingWorkspace)
      }
    }
  }, [currentContext, workspaces, currentWorkspace])

  const value: WorkspaceContextType = {
    currentWorkspace,
    currentBrand,
    workspaces,
    owningWorkspaces,
    sharedWorkspaces,
    boundaryContext,
    loading,
    error,
    switchToWorkspace,
    selectBrand,
    refreshWorkspaces,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Hook already exported at top level

