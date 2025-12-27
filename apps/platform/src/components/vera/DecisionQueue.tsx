/**
 * DecisionQueue Component
 * 
 * Displays pending decisions/Seals that need attention:
 * - Shows tool name, vendor, risk score
 * - Days open indicator
 * - Quick action buttons
 * - Real-time updates via subscription
 */

import { useState } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  User,
  Calendar,
  RefreshCw,
  Inbox
} from 'lucide-react'
import type { DecisionQueueItem } from '../../services/vera/veraDashboardService'

interface DecisionQueueProps {
  items: DecisionQueueItem[]
  isLoading?: boolean
  onRefresh?: () => void
  onItemClick?: (item: DecisionQueueItem) => void
  onApprove?: (item: DecisionQueueItem) => void
  onReject?: (item: DecisionQueueItem) => void
  maxItems?: number
  className?: string
}

const riskColors = {
  high: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  }
}

function getRiskLevel(score?: number): 'low' | 'medium' | 'high' {
  if (!score) return 'medium'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function DecisionQueueItem({
  item,
  onItemClick,
  onApprove,
  onReject
}: {
  item: DecisionQueueItem
  onItemClick?: (item: DecisionQueueItem) => void
  onApprove?: (item: DecisionQueueItem) => void
  onReject?: (item: DecisionQueueItem) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const riskLevel = getRiskLevel(item.riskScore)
  const colors = riskColors[riskLevel]
  
  const isUrgent = item.daysOpen >= 7
  const isOverdue = item.daysOpen >= 14

  return (
    <div
      className={`
        group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer
        ${isHovered ? 'bg-slate-50 border-slate-300 shadow-md' : 'bg-white border-slate-200'}
        ${isOverdue ? 'ring-2 ring-rose-200' : isUrgent ? 'ring-2 ring-amber-200' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onItemClick?.(item)}
    >
      {/* Status indicator */}
      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${colors.dot} ${
        item.decisionType === 'escalated' ? 'animate-pulse' : ''
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`
              px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
              ${colors.bg} ${colors.text} ${colors.border} border
            `}>
              {riskLevel} risk
            </span>
            {item.decisionType === 'escalated' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                Escalated
              </span>
            )}
            {item.decisionType === 'needs_review' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                Needs Review
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-slate-900 truncate">
            {item.toolName}
          </h4>
          {item.toolVendor && (
            <p className="text-xs text-slate-500 truncate">
              by {item.toolVendor}
            </p>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {item.requestedAt.toLocaleDateString()}
        </span>
        {item.requestedBy && (
          <span className="flex items-center gap-1 truncate max-w-[120px]">
            <User className="w-3 h-3" />
            {item.requestedBy}
          </span>
        )}
      </div>

      {/* Days open indicator */}
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-xs
        ${isOverdue ? 'bg-rose-50 text-rose-700' : 
          isUrgent ? 'bg-amber-50 text-amber-700' : 
          'bg-slate-50 text-slate-600'}
      `}>
        <Clock className="w-3 h-3" />
        <span className="font-medium">
          {item.daysOpen === 0 ? 'Today' : 
           item.daysOpen === 1 ? '1 day open' : 
           `${item.daysOpen} days open`}
        </span>
        {isOverdue && (
          <AlertTriangle className="w-3 h-3 ml-auto" />
        )}
      </div>

      {/* Quick actions (shown on hover) */}
      {(onApprove || onReject) && (
        <div className={`
          absolute bottom-4 right-4 flex gap-2 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          {onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReject(item)
              }}
              className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {onApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApprove(item)
              }}
              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Arrow indicator */}
      <ChevronRight className={`
        absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300
        transition-all duration-200
        ${isHovered ? 'translate-x-1 text-slate-400' : ''}
      `} />
    </div>
  )
}

export function DecisionQueue({
  items,
  isLoading = false,
  onRefresh,
  onItemClick,
  onApprove,
  onReject,
  maxItems = 5,
  className = ''
}: DecisionQueueProps) {
  const displayItems = items.slice(0, maxItems)
  const remainingCount = Math.max(0, items.length - maxItems)
  
  // Calculate stats
  const urgentCount = items.filter(i => i.daysOpen >= 7).length
  const escalatedCount = items.filter(i => i.decisionType === 'escalated').length

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 ring-4 ring-purple-500/10">
              <Inbox className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Decision Queue</h3>
              <p className="text-xs text-slate-500">
                {items.length} pending {items.length === 1 ? 'decision' : 'decisions'}
                {urgentCount > 0 && (
                  <span className="text-amber-600 ml-2">• {urgentCount} urgent</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {escalatedCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                {escalatedCount} escalated
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh queue"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No pending decisions to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <DecisionQueueItem
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )}

        {/* View all link */}
        {remainingCount > 0 && (
          <button className="w-full mt-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors">
            View {remainingCount} more →
          </button>
        )}
      </div>
    </div>
  )
}

export default DecisionQueue

