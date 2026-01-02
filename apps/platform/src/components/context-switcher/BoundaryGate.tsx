/**
 * BoundaryGate Component
 * 
 * Conditionally renders children based on whether current context is in a boundary relationship.
 * Uses WorkspaceContext to determine boundary state.
 */

import React from 'react'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'

interface BoundaryGateProps {
  showInBoundary: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * BoundaryGate - Shows content based on boundary context state
 * 
 * @param showInBoundary - If true, shows content when in boundary context. If false, shows when NOT in boundary.
 */
export const BoundaryGate: React.FC<BoundaryGateProps> = ({
  showInBoundary,
  children,
  fallback = null,
}) => {
  const { boundaryContext } = useWorkspaceContext()
  
  const isInBoundary = boundaryContext !== null
  const shouldShow = showInBoundary ? isInBoundary : !isInBoundary

  if (!shouldShow) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

