/**
 * AuditTrailViewer Component
 * 
 * Displays the full audit trail for a governance thread.
 * Shows before/after state diffs, actor attribution, surface context,
 * and denied action tracking.
 * 
 * Action Catalog compliant - tracks all envelope fields.
 */

import { useState, useEffect, useCallback, memo } from 'react'
import { format } from 'date-fns'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  History,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  User,
  X,
  XCircle,
} from 'lucide-react'

import {
  getThreadAuditEvents,
  type ActorType,
  type Role,
  type Surface,
} from '@/services/vera/governanceThreadService'

// ============================================
// Types
// ============================================

interface AuditEvent {
  id: string
  occurredAt: Date
  actionType: string
  actorType: ActorType
  actorId: string | null
  actorRole: Role | null
  surface: Surface | null
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  denied: boolean
  denialReason: string | null
}

interface AuditTrailViewerProps {
  threadId: string
  onClose?: () => void
}

interface FilterState {
  actorType: ActorType | 'all'
  surface: Surface | 'all'
  showDenied: boolean
}

// ============================================
// Helper Components
// ============================================

const ActorBadge = memo(({ actorType, actorRole }: { actorType: ActorType; actorRole: Role | null }) => {
  const styles: Record<ActorType, string> = {
    human: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    agent: 'bg-purple-100 text-purple-700 border-purple-200',
    system: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const icons: Record<ActorType, React.ReactNode> = {
    human: <User className="w-3 h-3" />,
    agent: <Shield className="w-3 h-3" />,
    system: <ShieldAlert className="w-3 h-3" />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${styles[actorType]}`}>
      {icons[actorType]}
      <span>{actorType}</span>
      {actorRole && <span className="opacity-70">({actorRole})</span>}
    </span>
  )
})
ActorBadge.displayName = 'ActorBadge'

const SurfaceBadge = memo(({ surface }: { surface: Surface | null }) => {
  if (!surface) return null

  const styles: Record<Surface, string> = {
    Inbox: 'bg-blue-100 text-blue-700',
    Decisions: 'bg-emerald-100 text-emerald-700',
    Weave: 'bg-amber-100 text-amber-700',
    Configuration: 'bg-slate-100 text-slate-600',
    Workbench: 'bg-purple-100 text-purple-700',
    Middleware: 'bg-orange-100 text-orange-700',
    Test: 'bg-rose-100 text-rose-700',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles[surface]}`}>
      {surface}
    </span>
  )
})
SurfaceBadge.displayName = 'SurfaceBadge'

const ActionIcon = memo(({ actionType, denied }: { actionType: string; denied: boolean }) => {
  if (denied) {
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const icons: Record<string, React.ReactNode> = {
    HumanApproveDecision: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    HumanBlockDecision: <ShieldX className="w-4 h-4 text-red-500" />,
    HumanApproveWithConditions: <Shield className="w-4 h-4 text-teal-500" />,
    HumanRequestChanges: <AlertCircle className="w-4 h-4 text-amber-500" />,
    HumanEscalate: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    AgentEvaluate: <ShieldAlert className="w-4 h-4 text-purple-500" />,
    AgentAutoApprove: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    AgentAutoBlock: <XCircle className="w-4 h-4 text-red-500" />,
    CreateThread: <History className="w-4 h-4 text-blue-500" />,
    approve: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    reject: <XCircle className="w-4 h-4 text-red-500" />,
    submit: <ArrowRight className="w-4 h-4 text-blue-500" />,
  }

  return icons[actionType] || <Check className="w-4 h-4 text-slate-400" />
})
ActionIcon.displayName = 'ActionIcon'

// State Diff Component
const StateDiff = memo(({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) => {
  const [expanded, setExpanded] = useState(false)

  if (!before && !after) return null

  // Find changed keys
  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ])

  const changes: { key: string; before: unknown; after: unknown; type: 'added' | 'removed' | 'changed' | 'unchanged' }[] = []

  allKeys.forEach((key) => {
    const beforeVal = before?.[key]
    const afterVal = after?.[key]

    if (beforeVal === undefined && afterVal !== undefined) {
      changes.push({ key, before: beforeVal, after: afterVal, type: 'added' })
    } else if (beforeVal !== undefined && afterVal === undefined) {
      changes.push({ key, before: beforeVal, after: afterVal, type: 'removed' })
    } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes.push({ key, before: beforeVal, after: afterVal, type: 'changed' })
    } else {
      changes.push({ key, before: beforeVal, after: afterVal, type: 'unchanged' })
    }
  })

  const hasChanges = changes.some((c) => c.type !== 'unchanged')

  if (!hasChanges) {
    return (
      <div className="text-xs text-slate-400 italic">No state changes</div>
    )
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span>State Changes ({changes.filter((c) => c.type !== 'unchanged').length})</span>
      </button>
      {expanded && (
        <div className="mt-2 p-2 bg-slate-50 rounded-none text-xs font-mono space-y-1">
          {changes
            .filter((c) => c.type !== 'unchanged')
            .map((change) => (
              <div key={change.key} className="flex items-start gap-2">
                <span className={`font-medium ${
                  change.type === 'added' ? 'text-emerald-600' :
                  change.type === 'removed' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
                </span>
                <span className="text-slate-600">{change.key}:</span>
                {change.type === 'changed' && (
                  <>
                    <span className="text-red-500 line-through">{JSON.stringify(change.before)}</span>
                    <span className="text-slate-400">→</span>
                  </>
                )}
                <span className={change.type === 'removed' ? 'text-red-500 line-through' : 'text-emerald-600'}>
                  {JSON.stringify(change.type === 'removed' ? change.before : change.after)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
})
StateDiff.displayName = 'StateDiff'

// Single Audit Event Row
const AuditEventRow = memo(({ event }: { event: AuditEvent }) => {
  return (
    <div className={`p-4 border-b border-slate-100 last:border-0 ${event.denied ? 'bg-red-50' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          event.denied ? 'bg-red-100' :
          event.actorType === 'human' ? 'bg-indigo-100' :
          event.actorType === 'agent' ? 'bg-purple-100' : 'bg-slate-100'
        }`}>
          <ActionIcon actionType={event.actionType} denied={event.denied} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900">
              {event.actionType.replace(/([A-Z])/g, ' $1').replace('_', ' ').trim()}
            </span>
            <ActorBadge actorType={event.actorType} actorRole={event.actorRole} />
            <SurfaceBadge surface={event.surface} />
            {event.denied && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                DENIED
              </span>
            )}
          </div>

          {event.denied && event.denialReason && (
            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-none text-sm text-red-700">
              <strong>Reason:</strong> {event.denialReason}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{format(event.occurredAt, 'MMM d, yyyy h:mm:ss a')}</span>
            {event.actorId && (
              <>
                <span className="text-slate-300">•</span>
                <span>Actor ID: {event.actorId.slice(0, 8)}...</span>
              </>
            )}
          </div>

          <StateDiff before={event.beforeState} after={event.afterState} />
        </div>
      </div>
    </div>
  )
})
AuditEventRow.displayName = 'AuditEventRow'

// ============================================
// Main AuditTrailViewer Component
// ============================================

export const AuditTrailViewer = memo(({ threadId, onClose }: AuditTrailViewerProps) => {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    actorType: 'all',
    surface: 'all',
    showDenied: true,
  })

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getThreadAuditEvents(threadId)
      setEvents(data)
    } catch (err) {
      console.error('[AuditTrailViewer] Failed to fetch events:', err)
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents])

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filters.actorType !== 'all' && event.actorType !== filters.actorType) return false
    if (filters.surface !== 'all' && event.surface !== filters.surface) return false
    if (!filters.showDenied && event.denied) return false
    return true
  })

  const deniedCount = events.filter((e) => e.denied).length

  return (
    <div className="bg-white rounded-none shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Trail
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Thread: {threadId.slice(0, 12)}...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchEvents()}
            className="p-2 text-slate-400 hover:text-white rounded-none hover:bg-white/10 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-none transition-colors ${
              showFilters ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-none hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Actor:</label>
            <select
              value={filters.actorType}
              onChange={(e) => setFilters({ ...filters, actorType: e.target.value as FilterState['actorType'] })}
              className="text-xs border border-slate-300 rounded-none px-2 py-1 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="human">Human</option>
              <option value="agent">Agent</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Surface:</label>
            <select
              value={filters.surface}
              onChange={(e) => setFilters({ ...filters, surface: e.target.value as FilterState['surface'] })}
              className="text-xs border border-slate-300 rounded-none px-2 py-1 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="Inbox">Inbox</option>
              <option value="Decisions">Decisions</option>
              <option value="Weave">Weave</option>
              <option value="Middleware">Middleware</option>
              <option value="Test">Test</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={filters.showDenied}
              onChange={(e) => setFilters({ ...filters, showDenied: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show denied actions</span>
          </label>
        </div>
      )}

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-slate-600">
            <strong>{filteredEvents.length}</strong> events
            {filteredEvents.length !== events.length && (
              <span className="text-slate-400"> (of {events.length})</span>
            )}
          </span>
          {deniedCount > 0 && (
            <span className="text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {deniedCount} denied
            </span>
          )}
        </div>
        {events.length > 0 && (
          <span className="text-slate-400">
            {format(events[0].occurredAt, 'MMM d, yyyy')} — {format(events[events.length - 1].occurredAt, 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Events List */}
      <div className="max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <History className="w-10 h-10 opacity-20 mb-4" />
            <p className="text-sm font-medium">No audit events found</p>
            {events.length > 0 && (
              <p className="text-xs mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <AuditEventRow key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  )
})
AuditTrailViewer.displayName = 'AuditTrailViewer'

export default AuditTrailViewer

