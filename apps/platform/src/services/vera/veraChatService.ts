// VERA Chat Service - Connects to AGO Orchestrator for policy queries
import { supabase } from '../../lib/supabase'

export interface VERAChatMessage {
  id: string
  type: 'user' | 'vera' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    queryType?: 'policy_explanation' | 'decision_reasoning' | 'compliance_guidance' | 'general'
    toolId?: string
    submissionId?: string
    decisionId?: string
    policyReferences?: string[]
    confidence?: number
  }
}

export interface VERAChatRequest {
  query: string
  enterpriseId: string
  context?: {
    toolId?: string
    submissionId?: string
    decisionId?: string
    brand?: string
    region?: string
    channel?: string
  }
}

export interface VERAChatResponse {
  answer: string
  queryType: 'policy_explanation' | 'decision_reasoning' | 'compliance_guidance' | 'general'
  policyReferences?: string[]
  relatedTools?: Array<{
    id: string
    name: string
    status: 'approved' | 'rejected' | 'pending'
  }>
  confidence?: number
  suggestedActions?: string[]
}

/**
 * Submit a query to VERA Chat via AGO Orchestrator
 * This function sends a message to the VERA Chat backend and returns the response
 */
export async function submitVERAQuery(
  request: VERAChatRequest
): Promise<VERAChatResponse> {
  try {
    // Call the cursor-agent-adapter Edge Function
    // The cursor-agent-adapter requires: agentName, action, input, enterprise_id
    // We structure input to include action and query for the AGO orchestrator
    const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
      body: {
        agentName: 'ago-orchestrator',
        action: 'vera-chat',
        input: {
          action: 'vera-chat',
          query: request.query,
          context: request.context || {}
        },
        enterprise_id: request.enterpriseId
      }
    })

    if (error) {
      console.error('[VERAChatService] Edge Function error:', error)
      throw new Error(`VERA Chat error: ${error.message}`)
    }

    if (!data) {
      throw new Error('No response received from VERA Chat')
    }

    // Debug logging to diagnose response structure
    console.log('[VERAChatService] Raw response data:', JSON.stringify(data, null, 2))

    // Parse response from AGO Orchestrator
    // The cursor-agent-adapter wraps the result in data.result
    const result = data.result || data
    
    console.log('[VERAChatService] Extracted result:', JSON.stringify(result, null, 2))

    // Check if the response indicates an error
    if (data.success === false) {
      console.error('[VERAChatService] Backend returned error:', data.error)
      throw new Error(data.error || 'Backend processing failed')
    }

    // Return formatted response to UI
    const response = {
      answer: result.answer || result.response || 'I apologize, but I couldn\'t process that query.',
      queryType: result.queryType || 'general',
      policyReferences: result.policyReferences || [],
      relatedTools: result.relatedTools || [],
      confidence: result.confidence,
      suggestedActions: result.suggestedActions || []
    }
    
    console.log('[VERAChatService] Formatted response:', response)
    return response
  } catch (error) {
    console.error('[VERAChatService] Error submitting query:', error)
    // Re-throw to allow UI to handle the error
    throw error
  }
}

/**
 * Get policy explanation for a specific tool or decision
 */
export async function getPolicyExplanation(
  enterpriseId: string,
  options: {
    toolId?: string
    submissionId?: string
    decisionId?: string
  }
): Promise<VERAChatResponse> {
  let query = 'Explain the policy decision'
  
  if (options.toolId) {
    query = `Why was tool ${options.toolId} approved or rejected?`
  } else if (options.submissionId) {
    query = `Explain the policy decision for submission ${options.submissionId}`
  } else if (options.decisionId) {
    query = `Explain the reasoning behind decision ${options.decisionId}`
  }

  return submitVERAQuery({
    query,
    enterpriseId,
    context: options
  })
}

/**
 * Get compliance guidance for a specific scenario
 */
export async function getComplianceGuidance(
  enterpriseId: string,
  question: string,
  context?: {
    brand?: string
    region?: string
    channel?: string
    toolName?: string
  }
): Promise<VERAChatResponse> {
  return submitVERAQuery({
    query: question,
    enterpriseId,
    context
  })
}

