/**
 * InboxView Component
 * 
 * Action Catalog aligned Inbox view for governance thread TRIAGE.
 * Shows pending threads requiring action (open, pending_human, needs_info).
 * 
 * IMPORTANT: This view is for TRIAGE only - NOT final decisions.
 * Final decision actions (Approve, Block) must be made from the Decisions surface.
 * 
 * Surface: Inbox
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
  History,
  Inbox as InboxIcon,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  User,
  Tag,
  X,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import SplitView from '@/components/layout/SplitView'
import EmptyState from '@/components/ui/EmptyState'
import {
  getInboxThreads,
  getResolvedThreads,
  getActionHistory,
  escalateThread,
  requestInfo,
  addComment,
  setSeverity,
  archiveThread,
  cancelThread,
  type GovernanceThread,
  type GovernanceAction,
  type ActionType,
  type ThreadStatus,
  type ThreadSeverity,
} from '@/services/vera/governanceThreadService'
import { SurfaceProvider, useSurface } from '@/contexts/SurfaceContext'
import { useSurfaceGuard } from '@/surfaces/useSurfaceGuard'
import { buildSurfaceLink } from '@/surfaces/registry'

// ============================================
// Types
// ============================================

interface InboxViewProps {
  enterpriseId: string
}

type TabType = 'inbox' | 'history'

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
    approved_with_conditions: 'CONDITIONAL',
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

const PriorityBadge = memo(({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    normal: 'bg-blue-50 text-blue-600',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${styles[priority] || styles.normal}`}>
      {priority}
    </span>
  )
})
PriorityBadge.displayName = 'PriorityBadge'

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
    approve: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    HumanApproveDecision: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    reject: <XCircle className="w-4 h-4 text-red-500" />,
    HumanBlockDecision: <XCircle className="w-4 h-4 text-red-500" />,
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
    draft_decision: <ShieldAlert className="w-4 h-4 text-amber-500" />,
    SetSeverity: <Tag className="w-4 h-4 text-amber-500" />,
    ArchiveThread: <History className="w-4 h-4 text-slate-500" />,
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
              <span className="text-sm font-medium text-slate-800 capitalize">
                {action.actionType.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                by {action.agentName || actorLabels[action.actorType]}
              </span>
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

// Triage Action Types (NOT final decisions)
type TriageAction = 
  | 'escalate' 
  | 'request_info' 
  | 'set_severity' 
  | 'archive'
  | 'cancel'

// Triage Action Dialog Component
interface TriageDialogProps {
  isOpen: boolean
  onClose: () => void
  actionType: TriageAction | null
  thread: GovernanceThread | null
  onConfirm: (rationale: string, extra?: { severity?: ThreadSeverity }) => Promise<void>
}

const TriageDialog = memo(({ isOpen, onClose, actionType, thread, onConfirm }: TriageDialogProps) => {
  const [rationale, setRationale] = useState('')
  const [severity, setSeverityValue] = useState<ThreadSeverity>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { surface } = useSurface()

  const actionConfigs: Record<TriageAction, { 
    title: string
    description: string
    buttonText: string
    buttonClass: string
    icon: React.ReactNode
  }> = {
    escalate: {
      title: 'Escalate for Decision',
      description: 'Escalate this thread to the Decisions surface for a final decision.',
      buttonText: 'Escalate',
      buttonClass: 'bg-orange-600 hover:bg-orange-700',
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    },
    request_info: {
      title: 'Request More Information',
      description: 'The requestor will be notified to provide additional details.',
      buttonText: 'Send Request',
      buttonClass: 'bg-blue-600 hover:bg-blue-700',
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    },
    set_severity: {
      title: 'Set Severity',
      description: 'Set the severity level for this thread.',
      buttonText: 'Set Severity',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
      icon: <Tag className="w-5 h-5 text-amber-500" />,
    },
    archive: {
      title: 'Archive Thread',
      description: 'Archive this thread. It can be reopened later if needed.',
      buttonText: 'Archive',
      buttonClass: 'bg-slate-600 hover:bg-slate-700',
      icon: <History className="w-5 h-5 text-slate-500" />,
    },
    cancel: {
      title: 'Cancel Thread',
      description: 'Cancel this thread. This action requires a rationale.',
      buttonText: 'Cancel Thread',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      icon: <X className="w-5 h-5 text-red-500" />,
    },
  }

  const config = actionType ? actionConfigs[actionType] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (actionType !== 'set_severity' && !rationale.trim()) {
      toast.error('Rationale is required')
      return
    }
    setIsSubmitting(true)
    try {
      await onConfirm(rationale, { severity })
      setRationale('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRationale('')
      setSeverityValue('medium')
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
            <DialogPanel className="w-full max-w-md bg-white rounded-xl shadow-xl">
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      {config?.icon}
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-slate-900">
                        {config?.title || 'Confirm Action'}
                      </DialogTitle>
                      <p className="mt-1 text-sm text-slate-600">
                        {config?.description}
                      </p>
                    </div>
                  </div>

                  {/* Surface Indicator */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                      Surface: {surface}
                    </span>
                    <span className="text-slate-500">Triage actions only</span>
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

                  {/* Severity Selector (for set_severity action) */}
                  {actionType === 'set_severity' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Severity Level
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['low', 'medium', 'high', 'critical'] as ThreadSeverity[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSeverityValue(level)}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              severity === level
                                ? level === 'critical' ? 'bg-red-100 border-red-300 text-red-700' :
                                  level === 'high' ? 'bg-orange-100 border-orange-300 text-orange-700' :
                                  level === 'medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
                                  'bg-slate-100 border-slate-300 text-slate-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {actionType !== 'set_severity' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Rationale <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Explain your action..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        rows={3}
                        required
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        This rationale will be recorded in the audit trail.
                      </p>
                    </div>
                  )}

                  {/* Note about final decisions */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        Final decisions (Approve/Block) must be made from the <strong>Decisions</strong> surface.
                      </span>
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (actionType !== 'set_severity' && !rationale.trim())}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${config?.buttonClass || 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      config?.buttonText || 'Confirm'
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
TriageDialog.displayName = 'TriageDialog'

// ============================================
// Main InboxView Component (Inner - with Surface Context)
// ============================================

const InboxViewInner = memo(({ enterpriseId }: InboxViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('inbox')
  const [threads, setThreads] = useState<GovernanceThread[]>([])
  const [totalThreads, setTotalThreads] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<GovernanceThread | null>(null)
  const [actions, setActions] = useState<GovernanceAction[]>([])
  const [actionsLoading, setActionsLoading] = useState(false)

  // Triage dialog state (NOT decision dialog)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<TriageAction | null>(null)

  // Fetch threads based on active tab
  const fetchThreads = useCallback(async () => {
    if (!enterpriseId || enterpriseId === 'undefined') {
      console.warn('[InboxView] Skipping fetch: enterpriseId is missing or undefined');
      setIsLoading(false);
      return;
    }

    setIsLoading(true)
    try {
      const result = activeTab === 'inbox'
        ? await getInboxThreads(enterpriseId, { limit: 50 })
        : await getResolvedThreads(enterpriseId, { limit: 50 })
      
      setThreads(result.data)
      setTotalThreads(result.total)
    } catch (err) {
      console.error('[InboxView] Failed to fetch threads:', err)
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
      console.error('[InboxView] Failed to fetch actions:', err)
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

  // Handle triage action button clicks
  const handleTriageClick = (action: TriageAction) => {
    setDialogAction(action)
    setDialogOpen(true)
  }

  // Execute triage action
  const executeTriageAction = async (rationale: string, extra?: { severity?: ThreadSeverity }) => {
    if (!selectedThread || !dialogAction) return

    let result: { success: boolean; error?: string }

    switch (dialogAction) {
      case 'escalate':
        result = await escalateThread(selectedThread.id, rationale, 'Inbox')
        break
      case 'request_info':
        result = await requestInfo(selectedThread.id, [rationale], 'Inbox')
        break
      case 'set_severity':
        if (extra?.severity) {
          result = await setSeverity(selectedThread.id, extra.severity, rationale || undefined)
        } else {
          result = { success: false, error: 'Severity level required' }
        }
        break
      case 'archive':
        result = await archiveThread(selectedThread.id, rationale)
        break
      case 'cancel':
        result = await cancelThread(selectedThread.id, rationale)
        break
      default:
        toast.error('Unknown action')
        return
    }
    
    if (result.success) {
      toast.success(`Triage action completed: ${dialogAction.replace('_', ' ')}`)
      // Refresh threads and actions
      await fetchThreads()
      if (selectedThread) {
        await fetchActions(selectedThread.id)
        // Update selected thread status from result or refetch
        const updatedThreads = activeTab === 'inbox'
          ? await getInboxThreads(enterpriseId, { limit: 50 })
          : await getResolvedThreads(enterpriseId, { limit: 50 })
        const updated = updatedThreads.data.find(t => t.id === selectedThread.id)
        setSelectedThread(updated || null)
      }
    } else {
      toast.error(result.error || 'Action failed')
    }
  }

  // Handle comment submission
  const handleAddComment = async (comment: string) => {
    if (!selectedThread) return
    const result = await addComment(selectedThread.id, comment, 'Inbox')
    if (result.success) {
      toast.success('Comment added')
      await fetchActions(selectedThread.id)
    } else {
      toast.error(result.error || 'Failed to add comment')
    }
  }

  const pendingCount = threads.filter(t => 
    ['open', 'pending_human', 'in_review', 'needs_info'].includes(t.status)
  ).length

  const listPane = (
      <div className="flex flex-col border-r border-slate-200 bg-white h-full">
        <div className="p-5 border-b border-slate-100 bg-white z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
              {activeTab === 'inbox' ? 'Inbox' : 'Decisions'}
            </h2>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && activeTab === 'inbox' && (
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
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <InboxIcon className="w-3 h-3 mr-1.5" /> Needs Triage
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-3 h-3 mr-1.5" /> Resolved
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
              icon={<InboxIcon className="w-6 h-6 text-slate-400" />}
              title={activeTab === 'inbox' ? 'No pending items' : 'No resolved items yet'}
              description={
                activeTab === 'inbox'
                  ? 'Threads arrive here from integrations and partner requests. When new items appear, route them to Decisions for sign-off.'
                  : 'Resolved threads and outcomes will appear here after decisions are signed.'
              }
              actions={[{ label: 'Go to Mission Control', href: '/mission', variant: 'outline' }]}
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
                    <PriorityBadge priority={thread.priority} />
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
            icon={<FileText className="w-6 h-6 text-slate-400" />}
            title="Select a thread"
            description="Review the history, triage signals, and then hand off to Decisions for accountable sign-off."
            actions={[{ label: 'Open Decisions', href: '/decisions', variant: 'outline' }]}
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

              {/* Triage Actions - Only show for non-resolved threads */}
              {!['resolved', 'cancelled', 'approved', 'blocked', 'approved_with_conditions', 'archived'].includes(selectedThread.status) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTriageClick('set_severity')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Tag className="w-4 h-4 mr-1.5" /> Set Severity
                  </button>
                  <button
                    onClick={() => handleTriageClick('request_info')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Request Info
                  </button>
                  <button
                    onClick={() => handleTriageClick('escalate')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Escalate to Decision
                  </button>
                  {/* Link to Decisions view for final actions - SURFACE HANDOFF */}
                  <Link
                    to={buildSurfaceLink('decisions', selectedThread.id)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                  >
                    <ArrowRight className="w-4 h-4 mr-1.5" /> Make Decision
                  </Link>
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
                    <PriorityBadge priority={selectedThread.priority} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Subject ID</p>
                    <p className="text-xs font-mono text-slate-600">{selectedThread.subjectId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Subject Type</p>
                    <p className="text-sm text-slate-600 capitalize">{selectedThread.subjectType}</p>
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

              {/* Action History */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Action History</span>
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

      {/* Triage Dialog */}
      <TriageDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        actionType={dialogAction}
        thread={selectedThread}
        onConfirm={executeTriageAction}
      />
    </div>
  )
})
InboxViewInner.displayName = 'InboxViewInner'

// Wrap with SurfaceProvider
export const InboxView = memo(({ enterpriseId }: InboxViewProps) => {
  return (
    <SurfaceProvider defaultSurface="Inbox">
      <InboxViewInner enterpriseId={enterpriseId} />
    </SurfaceProvider>
  )
})
InboxView.displayName = 'InboxView'

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

export default InboxView

