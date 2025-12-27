import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2, BookOpen, Shield, HelpCircle, X, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { submitVERAQuery, getPolicyExplanation, getComplianceGuidance, type VERAChatMessage } from '../../services/vera/veraChatService'
import { useEnterprise } from '../../contexts/EnterpriseContext'
import { Button } from '../ui/button'
import { useVERARealtime, type VERADecisionEvent, type VERAAlertEvent, type VERAProofEvent } from '../../hooks/useVERARealtime'

interface VERAChatWidgetProps {
  enterpriseId?: string
  initialQuery?: string
  context?: {
    toolId?: string
    submissionId?: string
    decisionId?: string
  }
  onClose?: () => void
  className?: string
}

export function VERAChatWidget({
  enterpriseId: propEnterpriseId,
  initialQuery,
  context,
  onClose,
  className = ''
}: VERAChatWidgetProps) {
  const { currentEnterprise } = useEnterprise()
  const enterpriseId = propEnterpriseId || currentEnterprise?.id

  const [messages, setMessages] = useState<VERAChatMessage[]>([])
  const [input, setInput] = useState(initialQuery || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Real-time event handlers
  const handleDecisionEvent = useCallback((event: VERADecisionEvent) => {
    const decisionTypeLabel = {
      approved: '✅ Approved',
      rejected: '❌ Rejected',
      escalated: '⚠️ Escalated',
      auto_cleared: '⚡ Auto-Cleared',
      needs_review: '👀 Needs Review'
    }[event.decision_type] || event.decision_type

    setMessages(prev => [...prev, {
      id: `decision-${event.decision_id}`,
      type: 'system',
      content: `📢 New Decision: ${decisionTypeLabel}${event.tool_name ? ` for ${event.tool_name}` : ''}${event.reasoning ? `\n${event.reasoning}` : ''}`,
      timestamp: new Date(event.timestamp),
      metadata: {
        queryType: 'decision_reasoning',
        policyReferences: event.policy_references,
        confidence: event.confidence
      }
    }])
  }, [])

  const handleAlertEvent = useCallback((event: VERAAlertEvent) => {
    const severityIcon = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: 'ℹ️'
    }[event.severity] || '⚠️'

    setMessages(prev => [...prev, {
      id: `alert-${event.alert_id}`,
      type: 'system',
      content: `${severityIcon} Alert: ${event.title}\n${event.description}${event.recommended_actions.length > 0 ? `\n\nRecommended: ${event.recommended_actions.join(', ')}` : ''}`,
      timestamp: new Date(event.timestamp)
    }])
  }, [])

  const handleProofEvent = useCallback((event: VERAProofEvent) => {
    const proofTypeLabel = {
      generated: '📜 Proof Bundle Generated',
      verified: '✅ Proof Bundle Verified',
      invalidated: '❌ Proof Bundle Invalidated'
    }[event.proof_type] || event.proof_type

    setMessages(prev => [...prev, {
      id: `proof-${event.proof_bundle_id}`,
      type: 'system',
      content: `${proofTypeLabel}${event.decision_summary ? `\nDecisions: ${event.decision_summary.totalDecisions} total, ${event.decision_summary.autoCleared} auto-cleared` : ''}`,
      timestamp: new Date(event.timestamp)
    }])
  }, [])

  // Subscribe to VERA real-time events
  useVERARealtime(
    enterpriseId,
    {
      onDecision: handleDecisionEvent,
      onAlert: handleAlertEvent,
      onProof: handleProofEvent,
      onConnectionChange: (status) => {
        setRealtimeConnected(status === 'connected')
        if (status === 'connected') {
          console.log('[VERAChatWidget] Real-time connected')
        }
      }
    },
    { enabled: !!enterpriseId }
  )

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'vera',
        content: 'Hello! I\'m VERA, your AI Governance Officer. I can help you understand policies, explain decisions, and provide compliance guidance. What would you like to know?',
        timestamp: new Date()
      }])
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle initial query
  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      handleSubmit(new Event('submit') as any)
    }
  }, [initialQuery])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing || !enterpriseId) return

    const userMessage: VERAChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)
    setError(null)

    // Add thinking indicator
    const thinkingId = `thinking-${Date.now()}`
    setMessages(prev => [...prev, {
      id: thinkingId,
      type: 'vera',
      content: 'Thinking...',
      timestamp: new Date()
    }])

    try {
      const response = await submitVERAQuery({
        query: userMessage.content,
        enterpriseId,
        context: context || {}
      })

      // Remove thinking indicator and add response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingId)
        return [...filtered, {
          id: Date.now().toString(),
          type: 'vera',
          content: response.answer,
          timestamp: new Date(),
          metadata: {
            queryType: response.queryType,
            policyReferences: response.policyReferences,
            confidence: response.confidence
          }
        }]
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response from VERA'
      setError(errorMessage)
      
      // Remove thinking indicator and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingId)
        return [...filtered, {
          id: `error-${Date.now()}`,
          type: 'system',
          content: `Error: ${errorMessage}`,
          timestamp: new Date()
        }]
      })
    } finally {
      setIsProcessing(false)
    }
  }, [input, isProcessing, enterpriseId, context])

  const handleQuickAction = useCallback(async (action: 'explain-policy' | 'compliance-help' | 'decision-reasoning') => {
    if (!enterpriseId || !context) return

    setIsProcessing(true)
    setError(null)

    try {
      let response
      switch (action) {
        case 'explain-policy':
          response = await getPolicyExplanation(enterpriseId, {
            toolId: context.toolId,
            submissionId: context.submissionId,
            decisionId: context.decisionId
          })
          break
        case 'compliance-help':
          response = await getComplianceGuidance(enterpriseId, 'What tools are approved for my use case?')
          break
        case 'decision-reasoning':
          response = await getPolicyExplanation(enterpriseId, {
            decisionId: context.decisionId
          })
          break
      }

      if (response) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'vera',
          content: response.answer,
          timestamp: new Date(),
          metadata: {
            queryType: response.queryType,
            policyReferences: response.policyReferences
          }
        }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setIsProcessing(false)
    }
  }, [enterpriseId, context])

  const suggestedQuestions = [
    'What tools are approved for healthcare content?',
    'Can I use ChatGPT for this brand?',
    'Explain the policy decision for this submission',
    'What are the compliance requirements?'
  ]

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">VERA</h3>
              <p className="text-xs text-gray-600">AI Governance Officer</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {isProcessing && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              VERA is thinking...
            </div>
          )}
          {/* Real-time connection indicator */}
          <div className={`text-xs flex items-center gap-1 ${realtimeConnected ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {realtimeConnected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? message.id.startsWith('error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : message.id.startsWith('alert')
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : message.id.startsWith('decision')
                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                    : message.id.startsWith('proof')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              }`}
            >
              {message.type === 'vera' && (
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">VERA</span>
                </div>
              )}
              {message.type === 'system' && !message.id.startsWith('error') && (
                <div className="flex items-center gap-2 mb-1">
                  {message.id.startsWith('decision') && <Zap className="w-4 h-4 text-purple-500" />}
                  {message.id.startsWith('alert') && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {message.id.startsWith('proof') && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  <span className="text-xs font-medium">
                    {message.id.startsWith('decision') && 'Decision Update'}
                    {message.id.startsWith('alert') && 'Alert'}
                    {message.id.startsWith('proof') && 'Proof Update'}
                  </span>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {/* Metadata */}
              {message.metadata?.policyReferences && message.metadata.policyReferences.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Policy References:</div>
                  <div className="flex flex-wrap gap-1">
                    {message.metadata.policyReferences.map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.metadata?.confidence && (
                <div className="mt-1 text-xs text-gray-500">
                  Confidence: {Math.round(message.metadata.confidence * 100)}%
                </div>
              )}

              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (if context provided) */}
      {context && (context.toolId || context.submissionId || context.decisionId) && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-medium text-gray-700 mb-2">Quick Actions:</div>
          <div className="flex flex-wrap gap-2">
            {context.decisionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('decision-reasoning')}
                disabled={isProcessing}
                className="text-xs"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                Explain Decision
              </Button>
            )}
            {(context.toolId || context.submissionId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('explain-policy')}
                disabled={isProcessing}
                className="text-xs"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Policy Details
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('compliance-help')}
              disabled={isProcessing}
              className="text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Compliance Help
            </Button>
          </div>
        </div>
      )}

      {/* Suggested Questions (when no messages or empty state) */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-medium text-gray-700 mb-2">Try asking:</div>
          <div className="space-y-1">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(question)
                  inputRef.current?.focus()
                }}
                className="text-xs text-left text-blue-600 hover:text-blue-700 hover:underline w-full py-1"
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask VERA about policies, decisions, or compliance..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isProcessing || !enterpriseId}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isProcessing || !enterpriseId}
            className="px-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        {!enterpriseId && (
          <p className="text-xs text-gray-500 mt-2">
            Please select an enterprise to chat with VERA
          </p>
        )}
      </div>
    </div>
  )
}

