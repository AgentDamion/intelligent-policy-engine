/**
 * Hooks Index
 * 
 * Centralized exports for all custom React hooks
 */

// VERA Hooks
export { useVERARealtime, useVERADecisions, useVERAAlerts, useVERAProofs } from './useVERARealtime'
export type { 
  VERADecisionEvent, 
  VERAAlertEvent, 
  VERAProofEvent, 
  VERARealtimeCallbacks,
  UseVERARealtimeOptions 
} from './useVERARealtime'

export { useVERADashboard } from './useVERADashboard'
export type { UseVERADashboardOptions, UseVERADashboardReturn } from './useVERADashboard'

// Policy Context Hooks
export { 
  usePolicyContext, 
  usePolicyArtifact, 
  usePolicyActivationHistory,
  useAvailablePolicyArtifacts,
  policyContextKeys 
} from './usePolicyContext'
export type { 
  PolicyContext, 
  PolicyContextResult 
} from './usePolicyContext'

