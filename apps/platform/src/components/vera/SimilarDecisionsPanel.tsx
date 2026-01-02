/**
 * SimilarDecisionsPanel Component
 * 
 * Week 5: Precedent Linking UI
 * Shows similar past decisions as precedents during governance workflow.
 * 
 * Features:
 * - Display similar decisions with similarity scores
 * - Allow users to link precedents to new decisions
 * - Show precedent influence visualization
 */

import { memo, useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  GitBranch,
  Link,
  Loader2,
  Plus,
  Scale,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { 
  findSimilarDecisions, 
  linkPrecedents,
  type PrecedentMatch 
} from '@/services/vera/precedentService'

interface SimilarDecisionsPanelProps {
  threadId: string
  currentActionId?: string
  onPrecedentLinked?: (precedentIds: string[]) => void
  compact?: boolean
}

const SimilarityBadge = memo(({ score }: { score: number }) => {
  const percentage = Math.round(score * 100)
  const color = 
    score >= 0.8 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    score >= 0.6 ? 'bg-amber-100 text-amber-700 border-amber-200' :
    'bg-slate-100 text-slate-600 border-slate-200'
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {percentage}% match
    </span>
  )
})
SimilarityBadge.displayName = 'SimilarityBadge'

const OutcomeBadge = memo(({ outcome }: { outcome: string }) => {
  const styles = {
    approved: 'bg-emerald-100 text-emerald-700',
    blocked: 'bg-red-100 text-red-700',
    escalated: 'bg-amber-100 text-amber-700',
    pending: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[outcome as keyof typeof styles] || styles.pending}`}>
      {outcome.toUpperCase()}
    </span>
  )
})
OutcomeBadge.displayName = 'OutcomeBadge'

const PrecedentCard = memo(({ 
  match, 
  isSelected,
  onSelect 
}: { 
  match: PrecedentMatch
  isSelected: boolean
  onSelect: () => void 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div 
      className={`
        border rounded-none overflow-hidden transition-all
        ${isSelected ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}
      `}
    >
      <div 
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className={`
            w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
            transition-colors
            ${isSelected 
              ? 'bg-indigo-600 border-indigo-600 text-white' 
              : 'border-slate-300 hover:border-indigo-400'
            }
          `}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <OutcomeBadge outcome={match.outcome} />
            <SimilarityBadge score={match.similarityScore} />
          </div>
          
          <p className="text-sm text-slate-700 line-clamp-2">
            {match.rationale}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(match.decisionDate, 'MMM d, yyyy')}
            </span>
            {match.metadata.brand && (
              <span className="text-slate-400">
                {match.metadata.brand}
              </span>
            )}
          </div>
        </div>

        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100">
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-xs font-medium text-slate-500">Full Rationale</span>
              <p className="text-sm text-slate-700 mt-1">{match.rationale}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {match.metadata.brand && (
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                  Brand: {match.metadata.brand}
                </span>
              )}
              {match.metadata.region && (
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                  Region: {match.metadata.region}
                </span>
              )}
              {match.metadata.channel && (
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                  Channel: {match.metadata.channel}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Action ID: {match.actionId.slice(0, 8)}...
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
PrecedentCard.displayName = 'PrecedentCard'

export const SimilarDecisionsPanel = memo(({ 
  threadId,
  currentActionId,
  onPrecedentLinked,
  compact = false
}: SimilarDecisionsPanelProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<PrecedentMatch[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExpanded, setIsExpanded] = useState(!compact)

  useEffect(() => {
    loadSimilarDecisions()
  }, [threadId])

  const loadSimilarDecisions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const results = await findSimilarDecisions(threadId, {
        limit: 5,
        minSimilarity: 0.3,
      })
      setMatches(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load similar decisions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSelect = useCallback((actionId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }, [])

  const handleLinkPrecedents = useCallback(async () => {
    if (!currentActionId || selectedIds.size === 0) return

    setIsLinking(true)
    try {
      const precedentIds = Array.from(selectedIds)
      await linkPrecedents(currentActionId, precedentIds, 'user')
      onPrecedentLinked?.(precedentIds)
      setSelectedIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link precedents')
    } finally {
      setIsLinking(false)
    }
  }, [currentActionId, selectedIds, onPrecedentLinked])

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-none text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <GitBranch className="w-4 h-4" />
        <span className="text-sm font-medium">View Precedents</span>
        {matches.length > 0 && (
          <span className="px-1.5 py-0.5 bg-indigo-200 rounded text-xs font-medium">
            {matches.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800">Similar Decisions</h3>
          {matches.length > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-medium text-slate-600">
              {matches.length} found
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSimilarDecisions}
            disabled={isLoading}
            className="p-1.5 hover:bg-slate-200 rounded transition-colors"
          >
            <Search className="w-4 h-4 text-slate-500" />
          </button>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-slate-200 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-sm text-slate-500">Finding similar decisions...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadSimilarDecisions}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-6">
            <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No similar decisions found</p>
            <p className="text-xs text-slate-400 mt-1">
              This appears to be a novel case
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {matches.map(match => (
                <PrecedentCard
                  key={match.actionId}
                  match={match}
                  isSelected={selectedIds.has(match.actionId)}
                  onSelect={() => handleToggleSelect(match.actionId)}
                />
              ))}
            </div>

            {/* Link Action */}
            {currentActionId && selectedIds.size > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <button
                  onClick={handleLinkPrecedents}
                  disabled={isLinking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-none hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Link {selectedIds.size} Precedent{selectedIds.size > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})
SimilarDecisionsPanel.displayName = 'SimilarDecisionsPanel'

export default SimilarDecisionsPanel

