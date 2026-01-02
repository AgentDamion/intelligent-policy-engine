/**
 * RoleGate Component
 * 
 * Conditionally renders children based on user's role in current workspace.
 * Uses WorkspaceContext to determine current user role.
 */

import React from 'react'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'

interface RoleGateProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * RoleGate - Shows content only if user has one of the allowed roles
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { currentWorkspace } = useWorkspaceContext()
  
  const userRole = currentWorkspace?.userRole || ''
  const hasAccess = allowedRoles.some(role => 
    userRole.toLowerCase() === role.toLowerCase()
  )

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

