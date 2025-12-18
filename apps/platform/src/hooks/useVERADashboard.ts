/**
 * useVERADashboard Hook
 * 
 * Fetches and manages all VERA dashboard data:
 * - Velocity metrics
 * - Decision queue
 * - Compliance score
 * - VERA state
 * 
 * Supports auto-refresh and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getVERADashboardData,
  getVelocityMetrics,
  getDecisionQueue,
  getComplianceScore,
  getVERAState,
  type VERADashboardData,
  type VelocityMetrics,
  type DecisionQueueItem,
  type ComplianceScore,
  type VERAStateSnapshot
} from '../services/vera/veraDashboardService'
import { useVERARealtime } from './useVERARealtime'

export interface UseVERADashboardOptions {
  /** Enable automatic refresh interval */
  autoRefresh?: boolean
  /** Refresh interval in milliseconds (default: 30000 = 30 seconds) */
  refreshInterval?: number
  /** Enable real-time event updates */
  realtimeEnabled?: boolean
  /** Initial data to use while loading */
  initialData?: Partial<VERADashboardData>
}

export interface UseVERADashboardReturn {
  // Data
  velocityMetrics: VelocityMetrics | null
  decisionQueue: DecisionQueueItem[]
  complianceScore: ComplianceScore | null
  veraState: VERAStateSnapshot | null
  lastUpdated: Date | null

  // Status
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  isRealtimeConnected: boolean

  // Actions
  refresh: () => Promise<void>
  refreshMetrics: () => Promise<void>
  refreshQueue: () => Promise<void>
  refreshCompliance: () => Promise<void>
}

export function useVERADashboard(
  enterpriseId: string | undefined,
  options: UseVERADashboardOptions = {}
): UseVERADashboardReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    realtimeEnabled = true,
    initialData
  } = options

  // State
  const [velocityMetrics, setVelocityMetrics] = useState<VelocityMetrics | null>(
    initialData?.velocityMetrics || null
  )
  const [decisionQueue, setDecisionQueue] = useState<DecisionQueueItem[]>(
    initialData?.decisionQueue || []
  )
  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(
    initialData?.complianceScore || null
  )
  const [veraState, setVeraState] = useState<VERAStateSnapshot | null>(
    initialData?.state || null
  )
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Real-time event handlers - update metrics when events occur
  const handleDecisionEvent = useCallback(() => {
    // Refresh metrics and queue when a new decision comes in
    if (enterpriseId) {
      getVelocityMetrics(enterpriseId).then(setVelocityMetrics).catch(console.error)
      getDecisionQueue(enterpriseId).then(setDecisionQueue).catch(console.error)
    }
  }, [enterpriseId])

  const handleAlertEvent = useCallback(() => {
    // Could trigger a notification or update compliance score
    if (enterpriseId) {
      getComplianceScore(enterpriseId).then(setComplianceScore).catch(console.error)
    }
  }, [enterpriseId])

  const handleProofEvent = useCallback(() => {
    // Refresh state when proof bundles change
    if (enterpriseId) {
      getVERAState(enterpriseId).then(setVeraState).catch(console.error)
    }
  }, [enterpriseId])

  // Subscribe to real-time events
  useVERARealtime(
    enterpriseId,
    {
      onDecision: handleDecisionEvent,
      onAlert: handleAlertEvent,
      onProof: handleProofEvent,
      onConnectionChange: (status) => {
        setIsRealtimeConnected(status === 'connected')
      }
    },
    { enabled: realtimeEnabled && !!enterpriseId }
  )

  // Fetch all dashboard data
  const refresh = useCallback(async () => {
    if (!enterpriseId) return

    setIsRefreshing(true)
    setError(null)

    try {
      const data = await getVERADashboardData(enterpriseId)
      
      if (isMountedRef.current) {
        setVelocityMetrics(data.velocityMetrics)
        setDecisionQueue(data.decisionQueue)
        setComplianceScore(data.complianceScore)
        setVeraState(data.state)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        console.error('[useVERADashboard] Error refreshing:', err)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [enterpriseId])

  // Individual refresh functions
  const refreshMetrics = useCallback(async () => {
    if (!enterpriseId) return
    try {
      const metrics = await getVelocityMetrics(enterpriseId)
      if (isMountedRef.current) setVelocityMetrics(metrics)
    } catch (err) {
      console.error('[useVERADashboard] Error refreshing metrics:', err)
    }
  }, [enterpriseId])

  const refreshQueue = useCallback(async () => {
    if (!enterpriseId) return
    try {
      const queue = await getDecisionQueue(enterpriseId)
      if (isMountedRef.current) setDecisionQueue(queue)
    } catch (err) {
      console.error('[useVERADashboard] Error refreshing queue:', err)
    }
  }, [enterpriseId])

  const refreshCompliance = useCallback(async () => {
    if (!enterpriseId) return
    try {
      const score = await getComplianceScore(enterpriseId)
      if (isMountedRef.current) setComplianceScore(score)
    } catch (err) {
      console.error('[useVERADashboard] Error refreshing compliance:', err)
    }
  }, [enterpriseId])

  // Initial load
  useEffect(() => {
    isMountedRef.current = true
    
    if (enterpriseId) {
      refresh()
    } else {
      setIsLoading(false)
    }

    return () => {
      isMountedRef.current = false
    }
  }, [enterpriseId, refresh])

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && enterpriseId) {
      refreshIntervalRef.current = setInterval(refresh, refreshInterval)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [autoRefresh, refreshInterval, enterpriseId, refresh])

  return {
    // Data
    velocityMetrics,
    decisionQueue,
    complianceScore,
    veraState,
    lastUpdated,

    // Status
    isLoading,
    isRefreshing,
    error,
    isRealtimeConnected,

    // Actions
    refresh,
    refreshMetrics,
    refreshQueue,
    refreshCompliance
  }
}

export default useVERADashboard

