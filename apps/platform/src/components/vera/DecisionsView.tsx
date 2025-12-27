/**
 * DecisionsView Component
 * 
 * Action Catalog aligned Decisions view for final governance decisions.
 * This is the ONLY surface where HumanApproveDecision, HumanBlockDecision,
 * and HumanApproveWithConditions actions are allowed.
 * 
 * Surface: Decisions
 */

import { useState, useEffect, useCallback, memo } from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  User,
  X,
  XCircle,
  PenTool,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import toast from 'react-hot-toast'

import {
  getDecisionThreads,
  getResolvedThreads,
  getActionHistory,
  approveThread,
  blockThread,
  approveWithConditions,
  requestChanges,
  escalateThread,
  addComment,
  signDecision,
  type GovernanceThread,
  type GovernanceAction,
  type ActionType,
  type ThreadStatus,
} from '@/services/vera/governanceThreadService'
import { SurfaceProvider, useSurface } from '@/contexts/SurfaceContext'
import { useSurfaceGuard } from '@/surfaces/useSurfaceGuard'
import { useAuth } from '@/contexts/AuthContext'
import { DecisionBadge } from './DecisionBadge'
import type { RationaleStructured } from '@/types/rationale'
import SplitView from '@/components/layout/SplitView'
import EmptyState from '@/components/ui/EmptyState'

// ============================================
// Types
// ============================================

interface DecisionsViewProps {
  enterpriseId: string
}

type DecisionAction = 
  | 'HumanApproveDecision' 
  | 'HumanBlockDecision' 
  | 'HumanApproveWithConditions'
  | 'HumanRequestChanges'
  | 'HumanEscalate'

type TabType = 'pending' | 'resolved'

// ============================================
// Helper Components
// ============================================

const StatusBadge = memo(({ status }: { status: ThreadStatus }) => {
  const styles: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700 border-blue-200',
    pending_human: 'bg-amber-100 text-amber-700 border-amber-200',
    in_review: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    needs_info: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    proposed_resolution: 'bg-purple-100 text-purple-700 border-purple-200',
    escalated: 'bg-orange-100 text-orange-700 border-orange-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    approved_with_conditions: 'bg-teal-100 text-teal-700 border-teal-200',
    blocked: 'bg-red-100 text-red-700 border-red-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    archived: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  
  const labels: Record<string, string> = {
    open: 'OPEN',
    pending_human: 'NEEDS REVIEW',
    in_review: 'IN REVIEW',
    needs_info: 'NEEDS INFO',
    proposed_resolution: 'PROPOSED',
    escalated: 'ESCALATED',
    approved: 'APPROVED',
    approved_with_conditions: 'CONDITIONALLY APPROVED',
    blocked: 'BLOCKED',
    resolved: 'RESOLVED',
    cancelled: 'CANCELLED',
    archived: 'ARCHIVED',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${styles[status] || styles.open}`}>
      {labels[status] || status.toUpperCase()}
    </span>
  )
})
StatusBadge.displayName = 'StatusBadge'

const SeverityBadge = memo(({ severity }: { severity: string | null }) => {
  if (!severity) return null
  
  const styles: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${styles[severity] || styles.low}`}>
      {severity}
    </span>
  )
})
SeverityBadge.displayName = 'SeverityBadge'

// Action Timeline Component
const ActionTimeline = memo(({ actions }: { actions: GovernanceAction[] }) => {
  if (actions.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic p-4">
        No actions recorded yet.
      </div>
    )
  }

  const actionIcons: Partial<Record<ActionType, React.ReactNode>> = {
    submit: <FileText className="w-4 h-4" />,
    CreateThread: <FileText className="w-4 h-4" />,
    evaluate: <ShieldAlert className="w-4 h-4" />,
    AgentEvaluate: <ShieldAlert className="w-4 h-4" />,
    AgentRecommend: <Shield className="w-4 h-4" />,
    AgentAutoApprove: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    AgentAutoBlock: <ShieldX className="w-4 h-4 text-red-500" />,
    approve: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    HumanApproveDecision: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    HumanApproveWithConditions: <CheckCircle className="w-4 h-4 text-teal-500" />,
    reject: <XCircle className="w-4 h-4 text-red-500" />,
    HumanBlockDecision: <XCircle className="w-4 h-4 text-red-500" />,
    HumanRequestChanges: <MessageSquare className="w-4 h-4 text-amber-500" />,
    escalate: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    HumanEscalate: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    request_info: <MessageSquare className="w-4 h-4 text-blue-500" />,
    RequestMoreInfo: <MessageSquare className="w-4 h-4 text-blue-500" />,
    provide_info: <Send className="w-4 h-4 text-blue-500" />,
    ProvideInfo: <Send className="w-4 h-4 text-blue-500" />,
    comment: <MessageSquare className="w-4 h-4 text-slate-400" />,
    reassign: <User className="w-4 h-4 text-purple-500" />,
    cancel: <X className="w-4 h-4 text-slate-500" />,
    auto_clear: <Check className="w-4 h-4 text-emerald-500" />,
  }

  const actorLabels: Record<string, string> = {
    human: 'User',
    agent: 'VERA Agent',
    system: 'System',
  }

  return (
    <div className="space-y-3">
      {actions.map((action, idx) => (
        <div key={action.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              action.actorType === 'human' ? 'bg-indigo-100' : 
              action.actorType === 'agent' ? 'bg-purple-100' : 'bg-slate-100'
            }`}>
              {actionIcons[action.actionType] || <History className="w-4 h-4" />}
            </div>
            {idx < actions.length - 1 && (
              <div className="w-0.5 h-full bg-slate-200 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-800">
                {action.actionType.replace(/([A-Z])/g, ' $1').replace('_', ' ').trim()}
              </span>
              <span className="text-xs text-slate-400">
                by {action.agentName || actorLabels[action.actorType]}
              </span>
              {action.surface && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  {action.surface}
                </span>
              )}
            </div>
            {action.rationale && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2 mt-1">
                "{action.rationale}"
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">
                {format(action.createdAt, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
ActionTimeline.displayName = 'ActionTimeline'

// Decision Dialog Component
interface DecisionDialogProps {
  isOpen: boolean
  onClose: () => void
  actionType: DecisionAction | null
  thread: GovernanceThread | null
  onConfirm: (rationale: string, conditions?: string[]) => Promise<void>
}

const DecisionDialog = memo(({ isOpen, onClose, actionType, thread, onConfirm }: DecisionDialogProps) => {
  const [rationale, setRationale] = useState('')
  const [conditions, setConditions] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [signatureToken, setSignatureToken] = useState('')
  const { canMakeFinalDecision } = useSurface()
  const { canPerformAction, currentSurfaceId } = useSurfaceGuard()
  const { user } = useAuth()

  const { allowed: isActionAllowed, reason: violationReason, requiresStepUp } = 
    actionType ? canPerformAction(actionType) : { allowed: true, requiresStepUp: false }

  const actionConfigs: Record<DecisionAction, { 
    title: string
    description: string
    buttonText: string
    buttonClass: string
    icon: React.ReactNode
  }> = {
    HumanApproveDecision: {
      title: 'Approve Request',
      description: 'This is a final decision. The requested action will be allowed to proceed.',
      buttonText: 'Approve',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
    },
    HumanBlockDecision: {
      title: 'Block Request',
      description: 'This is a final decision. The requested action will be permanently blocked.',
      buttonText: 'Block',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      icon: <ShieldX className="w-6 h-6 text-red-500" />,
    },
    HumanApproveWithConditions: {
      title: 'Approve with Conditions',
      description: 'Approve the request with specific conditions that must be met.',
      buttonText: 'Approve with Conditions',
      buttonClass: 'bg-teal-600 hover:bg-teal-700',
      icon: <Shield className="w-6 h-6 text-teal-500" />,
    },
    HumanRequestChanges: {
      title: 'Request Changes',
      description: 'Request changes before the request can be approved.',
      buttonText: 'Request Changes',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
      icon: <MessageSquare className="w-6 h-6 text-amber-500" />,
    },
    HumanEscalate: {
      title: 'Escalate for Review',
      description: 'Escalate to a senior reviewer or governance committee.',
      buttonText: 'Escalate',
      buttonClass: 'bg-orange-600 hover:bg-orange-700',
      icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
    },
  }

  const config = actionType ? actionConfigs[actionType] : null
  const showConditions = actionType === 'HumanApproveWithConditions'

  const handleAddCondition = () => {
    setConditions([...conditions, ''])
  }

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const handleConditionChange = (index: number, value: string) => {
    const newConditions = [...conditions]
    newConditions[index] = value
    setConditions(newConditions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isActionAllowed) {
      toast.error(violationReason || 'Action not permitted on this surface')
      return
    }

    if (!rationale.trim()) {
      toast.error('Rationale is required')
      return
    }

    if (showConditions && conditions.filter(c => c.trim()).length === 0) {
      toast.error('At least one condition is required')
      return
    }

    // Step-up Auth / Signature Flow
    if (requiresStepUp && !showSignature) {
      setShowSignature(true)
      return
    }

    if (requiresStepUp && !signatureToken.trim()) {
      toast.error('Identity verification / signature token is required')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. If regulated action, capture the signature FIRST
      if (requiresStepUp && thread && user) {
        const sigResult = await signDecision({
          threadId: thread.id,
          decision: actionType || 'unknown',
          rationale,
          signatureToken,
          actor: { user_id: user.id, role: 'admin' }, // TODO: Map actual role
          surfaceContext: 'Decisions' // Hardcoded context for compliance
        })

        if (!sigResult.success) {
          toast.error(`Signature Failed: ${sigResult.error}`)
          setIsSubmitting(false)
          return
        }
        
        toast.success('GxP Signature Captured')
      }

      // 2. Proceed with the decision state change
      await onConfirm(rationale, showConditions ? conditions.filter(c => c.trim()) : undefined)
      
      setRationale('')
      setConditions([''])
      setShowSignature(false)
      setSignatureToken('')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRationale('')
      setConditions([''])
      setShowSignature(false)
      setSignatureToken('')
    }
  }, [isOpen])

  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg bg-white rounded-xl shadow-xl">
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {!showSignature ? (
                    <>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          {config?.icon || <Gavel className="w-6 h-6 text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <DialogTitle className="text-lg font-bold text-slate-900">
                            {config?.title || 'Confirm Decision'}
                          </DialogTitle>
                          <p className="mt-1 text-sm text-slate-600">
                            {config?.description}
                          </p>
                        </div>
                      </div>

                      {/* Compliance Guardrail Indicator */}
                      <div className="mt-4 flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          isActionAllowed 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          Surface: {currentSurfaceId?.toUpperCase()}
                        </span>
                        {isActionAllowed ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Surface authorized for this action
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> {violationReason}
                          </span>
                        )}
                      </div>

                      {thread && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-sm font-medium text-slate-800">{thread.title || 'Untitled Thread'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={thread.status} />
                            <span className="text-xs text-slate-500">ID: {thread.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Rationale <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={rationale}
                          onChange={(e) => setRationale(e.target.value)}
                          placeholder="Explain your decision (required for accountability)..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          rows={3}
                          required
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          This rationale will be permanently recorded in the audit trail.
                        </p>
                      </div>

                      {/* Conditions (for approve with conditions) */}
                      {showConditions && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Conditions <span className="text-red-500">*</span>
                          </label>
                          <div className="space-y-2">
                            {conditions.map((condition, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={condition}
                                  onChange={(e) => handleConditionChange(idx, e.target.value)}
                                  placeholder={`Condition ${idx + 1}`}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                                {conditions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCondition(idx)}
                                    className="p-2 text-slate-400 hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCondition}
                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            + Add condition
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-indigo-600">
                        <PenTool className="w-8 h-8" />
                        <h2 className="text-xl font-bold">Regulatory Signature Required</h2>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>GxP Compliance:</strong> You are about to sign a final decision for thread <strong>#{thread?.id.slice(0, 8)}</strong>. 
                          This action will be recorded in an immutable ledger with your identity and timestamp.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Confirm Identity / Signature Token
                        </label>
                        <input
                          type="password"
                          value={signatureToken}
                          onChange={(e) => setSignatureToken(e.target.value)}
                          placeholder="Enter your verification code or password"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                        />
                        <p className="text-xs text-slate-400 italic">
                          "I acknowledge that my electronic signature is the legally binding equivalent of my handwritten signature."
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={showSignature ? () => setShowSignature(false) : onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    {showSignature ? 'Back' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rationale.trim() || !isActionAllowed}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${config?.buttonClass || 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      showSignature ? 'Sign and Finalize' : (requiresStepUp ? 'Continue to Sign' : (config?.buttonText || 'Confirm'))
                    )}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
})
DecisionDialog.displayName = 'DecisionDialog'

// ============================================
// Main DecisionsView Component
// ============================================

const DecisionsViewInner = memo(({ enterpriseId }: DecisionsViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [threads, setThreads] = useState<GovernanceThread[]>([])
  const [totalThreads, setTotalThreads] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<GovernanceThread | null>(null)
  const [actions, setActions] = useState<GovernanceAction[]>([])
  const [actionsLoading, setActionsLoading] = useState(false)

  // Decision dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<DecisionAction | null>(null)

  const { canMakeFinalDecision } = useSurface()

  // Fetch threads based on active tab
  const fetchThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = activeTab === 'pending'
        ? await getDecisionThreads(enterpriseId, { limit: 50 })
        : await getResolvedThreads(enterpriseId, { limit: 50 })
      
      setThreads(result.data)
      setTotalThreads(result.total)
    } catch (err) {
      console.error('[DecisionsView] Failed to fetch threads:', err)
      toast.error('Failed to load threads')
    } finally {
      setIsLoading(false)
    }
  }, [enterpriseId, activeTab])

  // Fetch actions when thread is selected
  const fetchActions = useCallback(async (threadId: string) => {
    setActionsLoading(true)
    try {
      const result = await getActionHistory(threadId)
      setActions(result)
    } catch (err) {
      console.error('[DecisionsView] Failed to fetch actions:', err)
      toast.error('Failed to load action history')
    } finally {
      setActionsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    void fetchThreads()
  }, [fetchThreads])

  // Fetch actions when thread is selected
  useEffect(() => {
    if (selectedThread) {
      void fetchActions(selectedThread.id)
    } else {
      setActions([])
    }
  }, [selectedThread, fetchActions])

  // Handle decision button clicks
  const handleDecisionClick = (action: DecisionAction) => {
    if (!canMakeFinalDecision && ['HumanApproveDecision', 'HumanBlockDecision', 'HumanApproveWithConditions'].includes(action)) {
      toast.error('Final decisions can only be made from the Decisions surface')
      return
    }
    setDialogAction(action)
    setDialogOpen(true)
  }

  // Execute decision
  const executeDecision = async (rationale: string, conditions?: string[]) => {
    if (!selectedThread || !dialogAction) return

    let result: { success: boolean; error?: string; code?: string }

    switch (dialogAction) {
      case 'HumanApproveDecision':
        result = await approveThread(selectedThread.id, rationale)
        break
      case 'HumanBlockDecision':
        result = await blockThread(selectedThread.id, rationale)
        break
      case 'HumanApproveWithConditions':
        result = await approveWithConditions(selectedThread.id, rationale, conditions || [])
        break
      case 'HumanRequestChanges':
        result = await requestChanges(selectedThread.id, rationale)
        break
      case 'HumanEscalate':
        result = await escalateThread(selectedThread.id, rationale, 'Decisions')
        break
      default:
        toast.error('Unknown action')
        return
    }
    
    if (result.success) {
      toast.success(`Decision recorded: ${dialogAction.replace('Human', '').replace(/([A-Z])/g, ' $1').trim()}`)
      // Refresh threads and actions
      await fetchThreads()
      if (selectedThread) {
        await fetchActions(selectedThread.id)
        // Update selected thread or clear if resolved
        const updatedThreads = activeTab === 'pending'
          ? await getDecisionThreads(enterpriseId, { limit: 50 })
          : await getResolvedThreads(enterpriseId, { limit: 50 })
        const updated = updatedThreads.data.find(t => t.id === selectedThread.id)
        setSelectedThread(updated || null)
      }
    } else {
      // Check for surface violation
      if (result.code === 'SURFACE_VIOLATION') {
        toast.error('This action is not allowed from the current surface')
      } else {
        toast.error(result.error || 'Decision failed')
      }
    }
  }

  // Handle comment submission
  const handleAddComment = async (comment: string) => {
    if (!selectedThread) return
    const result = await addComment(selectedThread.id, comment, 'Decisions')
    if (result.success) {
      toast.success('Comment added')
      await fetchActions(selectedThread.id)
    } else {
      toast.error(result.error || 'Failed to add comment')
    }
  }

  const pendingCount = threads.filter(t => 
    ['in_review', 'pending_human', 'proposed_resolution', 'escalated'].includes(t.status)
  ).length

  const listPane = (
      <div className="flex flex-col border-r border-slate-200 bg-white h-full">
        <div className="p-5 border-b border-slate-100 bg-white z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Gavel className="w-5 h-5 text-indigo-600" />
              Decisions
            </h2>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && activeTab === 'pending' && (
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  {pendingCount} Pending
                </span>
              )}
              <button
                onClick={() => void fetchThreads()}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-3 h-3 mr-1.5" /> Pending Decision
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'resolved'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-3 h-3 mr-1.5" /> Decided
            </button>
          </div>
        </div>

        {/* Thread List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : threads.length === 0 ? (
            <EmptyState
              icon={<Gavel className="w-6 h-6 text-slate-400" />}
              title={activeTab === 'pending' ? 'No pending decisions' : 'No completed decisions yet'}
              description={
                activeTab === 'pending'
                  ? 'Threads routed from Triage will appear here when they require accountable sign-off.'
                  : 'Signed decisions will appear here with links to their proof bundles.'
              }
              actions={[{ label: 'Open Triage', href: '/inbox', variant: 'outline' }]}
              className="py-12"
            />
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedThread?.id === thread.id
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                    : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={thread.status} />
                    <SeverityBadge severity={thread.severity} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {format(thread.createdAt, 'MMM d, h:mm a')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1 leading-snug text-slate-800">
                  {thread.title || `${thread.threadType.replace('_', ' ')} #${thread.id.slice(0, 8)}`}
                </h3>
                {thread.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{thread.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 capitalize">
                      {thread.threadType.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total count */}
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 text-center">
          {totalThreads} total threads
        </div>
      </div>
  )

  const detailPane = (
      <div className="flex-1 bg-slate-50/50 h-full overflow-hidden flex flex-col">
        {!selectedThread ? (
          <EmptyState
            icon={<Gavel className="w-6 h-6 text-slate-400" />}
            title="Select a thread"
            description="Decisions are finalized here. Review evidence, provide rationale, and sign with step-up authentication."
            actions={[{ label: 'Open Proof Vault', href: '/proof', variant: 'outline' }]}
            className="h-full"
          />
        ) : (
          <div className="flex flex-col h-full bg-white md:bg-transparent">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-20">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900 line-clamp-1">
                    {selectedThread.title || `Thread #${selectedThread.id.slice(0, 8)}`}
                  </h2>
                  <StatusBadge status={selectedThread.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Created {format(selectedThread.createdAt, 'MMM d, yyyy h:mm a')}
                </p>
              </div>

              {/* Decision Buttons - Only show for non-resolved threads */}
              {!['resolved', 'cancelled', 'approved', 'blocked', 'approved_with_conditions', 'archived'].includes(selectedThread.status) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDecisionClick('HumanRequestChanges')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Request Changes
                  </button>
                  <button
                    onClick={() => handleDecisionClick('HumanEscalate')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Escalate
                  </button>
                  <button
                    onClick={() => handleDecisionClick('HumanBlockDecision')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Block
                  </button>
                  <button
                    onClick={() => handleDecisionClick('HumanApproveWithConditions')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-1.5" /> Conditional
                  </button>
                  <button
                    onClick={() => handleDecisionClick('HumanApproveDecision')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Approve
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
              {/* Thread Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-3 border-b border-indigo-100">
                  <span className="text-xs font-bold text-indigo-900 tracking-wider uppercase">
                    Thread Details
                  </span>
                </div>
                <div className="p-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Type</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">
                      {selectedThread.threadType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Priority</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      selectedThread.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      selectedThread.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      selectedThread.priority === 'normal' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedThread.priority}
                    </span>
                  </div>
                  {selectedThread.severity && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase mb-1">Severity</p>
                      <SeverityBadge severity={selectedThread.severity} />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Subject ID</p>
                    <p className="text-xs font-mono text-slate-600">{selectedThread.subjectId}</p>
                  </div>
                  {selectedThread.description && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-slate-400 uppercase mb-1">Description</p>
                      <p className="text-sm text-slate-700">{selectedThread.description}</p>
                    </div>
                  )}
                  {selectedThread.slaDueAt && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase mb-1">SLA Due</p>
                      <p className="text-sm text-slate-600">
                        {format(selectedThread.slaDueAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Rationale Section - Show for resolved threads */}
              {['resolved', 'approved', 'blocked', 'approved_with_conditions'].includes(selectedThread.status) && (
                <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden text-white">
                  <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                      Decision Justification
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* DecisionBadge with rationale */}
                    <DecisionBadge
                      decision={selectedThread.status}
                      rationaleHuman={
                        (selectedThread as any).rationaleHuman || 
                        (selectedThread as any).rationale_human ||
                        `${selectedThread.status.charAt(0).toUpperCase() + selectedThread.status.slice(1).replace('_', ' ')} per governance policy`
                      }
                      rationaleStructured={
                        (selectedThread as any).rationaleStructured || 
                        (selectedThread as any).rationale_structured as RationaleStructured | null
                      }
                      size="lg"
                      className="text-white"
                    />
                    
                    {/* Summary for auditors */}
                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <p>
                        This decision was recorded on the Decisions surface and is part of the 
                        immutable governance audit trail. All signatures and rationales are 
                        cryptographically anchored for GxP compliance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action History */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Decision History</span>
                  <span className="text-xs text-slate-400">{actions.length} actions</span>
                </div>
                <div className="p-6">
                  {actionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <ActionTimeline actions={actions} />
                  )}
                </div>
              </div>

              {/* Add Comment Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-900">Add Comment</span>
                </div>
                <div className="p-4">
                  <CommentForm onSubmit={handleAddComment} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  )

  return (
    <div className="h-full">
      <SplitView
        className="bg-slate-50 overflow-hidden"
        left={listPane}
        main={detailPane}
        leftClassName="md:w-[420px]"
      />

      {/* Decision Dialog */}
      <DecisionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        actionType={dialogAction}
        thread={selectedThread}
        onConfirm={executeDecision}
      />
    </div>
  )
})
DecisionsViewInner.displayName = 'DecisionsViewInner'

// Wrap with SurfaceProvider
export const DecisionsView = memo(({ enterpriseId }: DecisionsViewProps) => {
  return (
    <SurfaceProvider defaultSurface="Decisions">
      <DecisionsViewInner enterpriseId={enterpriseId} />
    </SurfaceProvider>
  )
})
DecisionsView.displayName = 'DecisionsView'

// Comment Form Component
const CommentForm = memo(({ onSubmit }: { onSubmit: (comment: string) => Promise<void> }) => {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit(comment)
      setComment('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      />
      <button
        type="submit"
        disabled={isSubmitting || !comment.trim()}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  )
})
CommentForm.displayName = 'CommentForm'

export default DecisionsView

