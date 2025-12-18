/**
 * useVERARealtime Hook
 * 
 * Subscribes to VERA real-time event channels for:
 * - vera-decisions: Governance decisions (approve, reject, escalate)
 * - vera-alerts: Policy violations, security incidents, compliance warnings
 * - vera-proofs: Proof Bundle generation and verification
 */

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Event Types
export interface VERADecisionEvent {
  enterprise_id: string
  timestamp: string
  decision_id: string
  decision_type: 'approved' | 'rejected' | 'escalated' | 'auto_cleared' | 'needs_review'
  tool_name?: string
  tool_vendor?: string
  confidence: number
  reasoning?: string
  policy_references: string[]
  is_draft_seal: boolean
}

export interface VERAAlertEvent {
  enterprise_id: string
  timestamp: string
  alert_id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  alert_type: 'policy_violation' | 'security_incident' | 'compliance_warning' | 'dlp_trigger' | 'anomaly_detected'
  title: string
  description: string
  affected_tool?: string
  affected_partner?: string
  recommended_actions: string[]
  requires_human_review: boolean
}

export interface VERAProofEvent {
  enterprise_id: string
  timestamp: string
  proof_bundle_id: string
  proof_type: 'generated' | 'verified' | 'invalidated'
  eps_id?: string
  eps_hash?: string
  status: 'draft' | 'verified' | 'blocked' | 'pending_verification'
  vera_mode: 'shadow' | 'enforcement' | 'disabled'
  decision_summary?: {
    totalDecisions: number
    autoCleared: number
    escalated: number
    blocked: number
  }
  certificate_url?: string
  qr_code?: string
}

export interface VERARealtimeCallbacks {
  onDecision?: (event: VERADecisionEvent) => void
  onAlert?: (event: VERAAlertEvent) => void
  onProof?: (event: VERAProofEvent) => void
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'error') => void
}

export interface UseVERARealtimeOptions {
  enabled?: boolean
  channels?: ('decisions' | 'alerts' | 'proofs')[]
}

/**
 * Hook to subscribe to VERA real-time event channels
 * 
 * @param enterpriseId - The enterprise ID to subscribe to
 * @param callbacks - Callback functions for each event type
 * @param options - Configuration options
 * @returns Object with connection status and manual subscription controls
 * 
 * @example
 * ```tsx
 * const { isConnected, subscribe, unsubscribe } = useVERARealtime(
 *   enterpriseId,
 *   {
 *     onDecision: (event) => {
 *       console.log('New decision:', event.decision_type)
 *       toast.info(`Decision: ${event.decision_type}`)
 *     },
 *     onAlert: (event) => {
 *       if (event.severity === 'critical') {
 *         toast.error(event.title)
 *       }
 *     },
 *     onProof: (event) => {
 *       console.log('Proof bundle:', event.proof_type)
 *     }
 *   }
 * )
 * ```
 */
export function useVERARealtime(
  enterpriseId: string | undefined,
  callbacks: VERARealtimeCallbacks,
  options: UseVERARealtimeOptions = {}
) {
  const {
    enabled = true,
    channels = ['decisions', 'alerts', 'proofs']
  } = options

  const channelRefs = useRef<Map<string, RealtimeChannel>>(new Map())
  const isConnectedRef = useRef(false)
  const callbacksRef = useRef(callbacks)

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  // Subscribe to a specific channel
  const subscribeToChannel = useCallback((channelType: 'decisions' | 'alerts' | 'proofs') => {
    if (!enterpriseId) return

    const channelName = `vera-${channelType}:${enterpriseId}`
    
    // Don't create duplicate subscriptions
    if (channelRefs.current.has(channelName)) {
      return
    }

    console.log(`[useVERARealtime] Subscribing to ${channelName}`)

    const channel = supabase.channel(channelName)

    channel.on('broadcast', { event: channelType === 'decisions' ? 'decision' : channelType === 'alerts' ? 'alert' : 'proof' }, (payload) => {
      console.log(`[useVERARealtime] Received ${channelType} event:`, payload)
      
      const eventData = payload.payload

      switch (channelType) {
        case 'decisions':
          callbacksRef.current.onDecision?.(eventData as VERADecisionEvent)
          break
        case 'alerts':
          callbacksRef.current.onAlert?.(eventData as VERAAlertEvent)
          break
        case 'proofs':
          callbacksRef.current.onProof?.(eventData as VERAProofEvent)
          break
      }
    })

    channel.subscribe((status) => {
      console.log(`[useVERARealtime] ${channelName} subscription status:`, status)
      
      if (status === 'SUBSCRIBED') {
        isConnectedRef.current = true
        callbacksRef.current.onConnectionChange?.('connected')
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isConnectedRef.current = false
        callbacksRef.current.onConnectionChange?.(status === 'CHANNEL_ERROR' ? 'error' : 'disconnected')
      }
    })

    channelRefs.current.set(channelName, channel)
  }, [enterpriseId])

  // Unsubscribe from a specific channel
  const unsubscribeFromChannel = useCallback((channelType: 'decisions' | 'alerts' | 'proofs') => {
    if (!enterpriseId) return

    const channelName = `vera-${channelType}:${enterpriseId}`
    const channel = channelRefs.current.get(channelName)

    if (channel) {
      console.log(`[useVERARealtime] Unsubscribing from ${channelName}`)
      supabase.removeChannel(channel)
      channelRefs.current.delete(channelName)
    }
  }, [enterpriseId])

  // Subscribe to all configured channels
  const subscribe = useCallback(() => {
    channels.forEach(subscribeToChannel)
  }, [channels, subscribeToChannel])

  // Unsubscribe from all channels
  const unsubscribe = useCallback(() => {
    channelRefs.current.forEach((channel, channelName) => {
      console.log(`[useVERARealtime] Unsubscribing from ${channelName}`)
      supabase.removeChannel(channel)
    })
    channelRefs.current.clear()
    isConnectedRef.current = false
  }, [])

  // Auto-subscribe on mount and cleanup on unmount
  useEffect(() => {
    if (!enabled || !enterpriseId) {
      return
    }

    subscribe()

    return () => {
      unsubscribe()
    }
  }, [enabled, enterpriseId, subscribe, unsubscribe])

  return {
    isConnected: isConnectedRef.current,
    subscribe,
    unsubscribe,
    subscribeToChannel,
    unsubscribeFromChannel
  }
}

/**
 * Hook to subscribe only to VERA decision events
 */
export function useVERADecisions(
  enterpriseId: string | undefined,
  onDecision: (event: VERADecisionEvent) => void,
  enabled = true
) {
  return useVERARealtime(
    enterpriseId,
    { onDecision },
    { enabled, channels: ['decisions'] }
  )
}

/**
 * Hook to subscribe only to VERA alert events
 */
export function useVERAAlerts(
  enterpriseId: string | undefined,
  onAlert: (event: VERAAlertEvent) => void,
  enabled = true
) {
  return useVERARealtime(
    enterpriseId,
    { onAlert },
    { enabled, channels: ['alerts'] }
  )
}

/**
 * Hook to subscribe only to VERA proof events
 */
export function useVERAProofs(
  enterpriseId: string | undefined,
  onProof: (event: VERAProofEvent) => void,
  enabled = true
) {
  return useVERARealtime(
    enterpriseId,
    { onProof },
    { enabled, channels: ['proofs'] }
  )
}

export default useVERARealtime

