/**
 * Surface Context Provider
 * 
 * Tracks the current UI surface for Action Catalog guardrails.
 * Surfaces determine which actions are allowed from each view.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

// Action Catalog surfaces
export type Surface = 
  | 'Inbox'
  | 'Weave'
  | 'Decisions'
  | 'Configuration'
  | 'Workbench'
  | 'Middleware'
  | 'Test'

// Surface metadata for UI
interface SurfaceInfo {
  surface: Surface
  label: string
  description: string
  allowsFinalDecisions: boolean
  allowsTriage: boolean
}

const SURFACE_INFO: Record<Surface, Omit<SurfaceInfo, 'surface'>> = {
  Inbox: {
    label: 'Inbox',
    description: 'Thread triage and assignment',
    allowsFinalDecisions: false,
    allowsTriage: true,
  },
  Decisions: {
    label: 'Decisions',
    description: 'Final decision actions on governance threads',
    allowsFinalDecisions: true,
    allowsTriage: false,
  },
  Weave: {
    label: 'Weave',
    description: 'Collaborative workspace for complex decisions',
    allowsFinalDecisions: false,
    allowsTriage: false,
  },
  Configuration: {
    label: 'Configuration',
    description: 'System and policy configuration',
    allowsFinalDecisions: false,
    allowsTriage: false,
  },
  Workbench: {
    label: 'Workbench',
    description: 'Agent testing and development',
    allowsFinalDecisions: false,
    allowsTriage: false,
  },
  Middleware: {
    label: 'Middleware',
    description: 'Agent automation layer',
    allowsFinalDecisions: false,
    allowsTriage: false,
  },
  Test: {
    label: 'Test',
    description: 'Testing environment',
    allowsFinalDecisions: false,
    allowsTriage: false,
  },
}

interface SurfaceContextValue {
  // Current surface
  surface: Surface
  surfaceInfo: SurfaceInfo
  
  // Set surface (for programmatic changes)
  setSurface: (surface: Surface) => void
  
  // Check if an action is allowed on current surface
  canMakeFinalDecision: boolean
  canTriage: boolean
  
  // Mode tracking (optional)
  mode: string | null
  setMode: (mode: string | null) => void
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null)

interface SurfaceProviderProps {
  children: ReactNode
  defaultSurface?: Surface
}

/**
 * Surface Provider
 * 
 * Wrap your app or specific views with this provider to track the current surface.
 * The surface is used for Action Catalog guardrails.
 */
export function SurfaceProvider({ children, defaultSurface = 'Inbox' }: SurfaceProviderProps) {
  const [surface, setSurface] = useState<Surface>(defaultSurface)
  const [mode, setMode] = useState<string | null>(null)

  const surfaceInfo = useMemo((): SurfaceInfo => ({
    surface,
    ...SURFACE_INFO[surface],
  }), [surface])

  const value = useMemo((): SurfaceContextValue => ({
    surface,
    surfaceInfo,
    setSurface,
    canMakeFinalDecision: surfaceInfo.allowsFinalDecisions,
    canTriage: surfaceInfo.allowsTriage,
    mode,
    setMode,
  }), [surface, surfaceInfo, mode])

  return (
    <SurfaceContext.Provider value={value}>
      {children}
    </SurfaceContext.Provider>
  )
}

/**
 * Hook to access the current surface context
 */
export function useSurface(): SurfaceContextValue {
  const context = useContext(SurfaceContext)
  if (!context) {
    throw new Error('useSurface must be used within a SurfaceProvider')
  }
  return context
}

/**
 * Hook to get just the current surface (for action submission)
 */
export function useCurrentSurface(): Surface {
  const context = useContext(SurfaceContext)
  // Default to Inbox if no context (backward compat)
  return context?.surface || 'Inbox'
}

/**
 * Higher-order component to inject surface context
 */
export function withSurface<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  surface: Surface
) {
  return function WithSurfaceWrapper(props: P) {
    return (
      <SurfaceProvider defaultSurface={surface}>
        <WrappedComponent {...props} />
      </SurfaceProvider>
    )
  }
}

/**
 * Component to set surface on mount (for route-based surface switching)
 */
export function SetSurface({ surface, mode }: { surface: Surface; mode?: string }) {
  const context = useContext(SurfaceContext)
  
  // Set surface on mount
  if (context && context.surface !== surface) {
    context.setSurface(surface)
  }
  if (context && mode !== undefined && context.mode !== mode) {
    context.setMode(mode)
  }
  
  return null
}

/**
 * Hook for surface-aware action helpers
 */
export function useSurfaceActions() {
  const { surface, canMakeFinalDecision, canTriage } = useSurface()
  
  const validateAction = useCallback((actionType: string): { allowed: boolean; reason?: string } => {
    const finalDecisionActions = [
      'HumanApproveDecision',
      'HumanBlockDecision',
      'HumanApproveWithConditions',
      'approve',
      'reject',
    ]
    
    const triageActions = [
      'SetSeverity',
      'AssignOwner',
      'AssignReviewers',
      'RequestMoreInfo',
    ]
    
    if (finalDecisionActions.includes(actionType) && !canMakeFinalDecision) {
      return {
        allowed: false,
        reason: `Final decision actions are only allowed from the Decisions surface. Current surface: ${surface}`,
      }
    }
    
    if (triageActions.includes(actionType) && !canTriage && surface !== 'Decisions') {
      return {
        allowed: false,
        reason: `Triage actions are only allowed from Inbox or Decisions. Current surface: ${surface}`,
      }
    }
    
    return { allowed: true }
  }, [surface, canMakeFinalDecision, canTriage])
  
  return {
    surface,
    canMakeFinalDecision,
    canTriage,
    validateAction,
  }
}

// Export types
export type { SurfaceInfo, SurfaceContextValue }

