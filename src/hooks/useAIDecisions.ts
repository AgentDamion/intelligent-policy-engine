// Enhanced AI Decisions Hook with Real-time Cursor Agent Integration
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { webSocketService } from '../services/webSocketService'
import { useAuth } from '../contexts/AuthContext'
import { useEnterprise } from '../contexts/EnterpriseContext'

export interface AIDecision {
  id: string
  agent: string
  action: string
  outcome: 'approved' | 'rejected' | 'needs_review'
  risk: 'low' | 'medium' | 'high'
  details: any
  created_at: string
  enterprise_id: string
}

export const useAIDecisions = () => {
  const { session } = useAuth()
  const { currentEnterprise } = useEnterprise()
  const [decisions, setDecisions] = useState<AIDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  // Fetch historical decisions from database
  useEffect(() => {
    if (!currentEnterprise) return

    const fetchDecisions = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_agent_decisions')
          .select('*')
          .eq('enterprise_id', currentEnterprise.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setDecisions(data || [])
      } catch (error) {
        console.error('Error fetching AI decisions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDecisions()
  }, [currentEnterprise])

  // Set up real-time subscription to AI agents
  useEffect(() => {
    if (!session || !currentEnterprise) return

    let unsubscribe: (() => void) | null = null

    const setupWebSocket = async () => {
      try {
        // Connect WebSocket service
        await webSocketService.connect(session)
        setConnected(true)

        // Subscribe to Cursor AI agents
        unsubscribe = webSocketService.subscribeToCursorAgents((decision) => {
          // Only add decisions for current enterprise
          if (decision.enterprise_id === currentEnterprise.id) {
            setDecisions(prev => [decision, ...prev])
          }
        })

        // Also listen for custom events from CursorAIAgent
        const handleAIDecision = (event: CustomEvent) => {
          const decision = event.detail
          if (decision.enterprise_id === currentEnterprise.id) {
            setDecisions(prev => [decision, ...prev])
          }
        }

        window.addEventListener('ai-decision', handleAIDecision as any)

        return () => {
          window.removeEventListener('ai-decision', handleAIDecision as any)
        }
      } catch (error) {
        console.error('Error setting up WebSocket:', error)
        setConnected(false)
      }
    }

    setupWebSocket()

    return () => {
      if (unsubscribe) unsubscribe()
      webSocketService.disconnect()
    }
  }, [session, currentEnterprise])

  // Function to manually trigger AI analysis
  const analyzeDocument = async (document: any) => {
    if (!currentEnterprise) return

    try {
      // This would call your CursorAIAgent
      const { CursorAIAgent } = await import('../services/CursorAIAgent')
      const decision = await CursorAIAgent.processDocument(document, currentEnterprise.id)
      return decision
    } catch (error) {
      console.error('Error analyzing document:', error)
      throw error
    }
  }

  return {
    decisions,
    loading,
    connected,
    analyzeDocument
  }
}
