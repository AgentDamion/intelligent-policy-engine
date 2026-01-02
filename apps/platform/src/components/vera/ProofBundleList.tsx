/**
 * ProofBundleList Component
 * 
 * Displays a list of VERA Proof Bundles with filtering and pagination:
 * - Status and decision filters
 * - Search functionality
 * - Pagination
 * - Click to view details
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  getProofBundles,
  type ProofBundleListItem,
  type ProofBundleStatus,
  type DecisionType,
  type ProofBundleFilters
} from '../../services/vera/proofBundleService'

interface ProofBundleListProps {
  enterpriseId: string
  onSelectBundle?: (bundleId: string) => void
  className?: string
}

const statusIcons: Record<ProofBundleStatus, React.ReactNode> = {
  draft: <Eye className="w-4 h-4" />,
  verified: <ShieldCheck className="w-4 h-4" />,
  blocked: <ShieldAlert className="w-4 h-4" />,
  pending_verification: <Clock className="w-4 h-4" />
}

const statusColors: Record<ProofBundleStatus, string> = {
  draft: 'amber',
  verified: 'emerald',
  blocked: 'rose',
  pending_verification: 'blue'
}

const decisionIcons: Record<DecisionType, React.ReactNode> = {
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  escalated: <AlertTriangle className="w-4 h-4" />,
  auto_cleared: <ShieldCheck className="w-4 h-4" />,
  needs_review: <Eye className="w-4 h-4" />
}

const decisionColors: Record<DecisionType, string> = {
  approved: 'emerald',
  rejected: 'rose',
  escalated: 'amber',
  auto_cleared: 'emerald',
  needs_review: 'blue'
}

const PAGE_SIZE = 10

export function ProofBundleList({
  enterpriseId,
  onSelectBundle,
  className = ''
}: ProofBundleListProps) {
  const [bundles, setBundles] = useState<ProofBundleListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ProofBundleFilters>({})

  // Fetch bundles
  const fetchBundles = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, total: count } = await getProofBundles(enterpriseId, {
        filters: {
          ...filters,
          searchTerm: searchTerm || undefined
        },
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      })
      setBundles(data)
      setTotal(count)
    } catch (error) {
      console.error('[ProofBundleList] Error fetching bundles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [enterpriseId, page, filters, searchTerm])

  useEffect(() => {
    fetchBundles()
  }, [fetchBundles])

  // Toggle filter
  const toggleStatusFilter = (status: ProofBundleStatus) => {
    setFilters(prev => {
      const current = prev.status || []
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status]
      return { ...prev, status: updated.length > 0 ? updated : undefined }
    })
    setPage(0)
  }

  const toggleDecisionFilter = (decision: DecisionType) => {
    setFilters(prev => {
      const current = prev.decision || []
      const updated = current.includes(decision)
        ? current.filter(d => d !== decision)
        : [...current, decision]
      return { ...prev, decision: updated.length > 0 ? updated : undefined }
    })
    setPage(0)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = (filters.status && filters.status.length > 0) ||
                           (filters.decision && filters.decision.length > 0) ||
                           searchTerm.length > 0

  return (
    <div className={`bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900">Proof Bundles</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
              {total} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-purple-50 border-purple-200' : ''}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 rounded-full bg-purple-500" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchBundles}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
            placeholder="Search by tool name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="space-y-3">
              {/* Status filters */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['draft', 'verified', 'blocked', 'pending_verification'] as ProofBundleStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all
                        ${filters.status?.includes(status)
                          ? `bg-${statusColors[status]}-100 text-${statusColors[status]}-700 border border-${statusColors[status]}-200`
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      {statusIcons[status]}
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision filters */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Decision</p>
                <div className="flex flex-wrap gap-2">
                  {(['approved', 'rejected', 'escalated', 'auto_cleared', 'needs_review'] as DecisionType[]).map(decision => (
                    <button
                      key={decision}
                      onClick={() => toggleDecisionFilter(decision)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all
                        ${filters.decision?.includes(decision)
                          ? `bg-${decisionColors[decision]}-100 text-${decisionColors[decision]}-700 border border-${decisionColors[decision]}-200`
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      {decisionIcons[decision]}
                      {decision.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {isLoading ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Loading proof bundles...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center">
            <ShieldOff className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium mb-1">No proof bundles found</p>
            <p className="text-sm text-slate-400">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Proof bundles will appear here after governance decisions'}
            </p>
          </div>
        ) : (
          bundles.map(bundle => {
            const statusColor = statusColors[bundle.status]
            const decisionColor = bundle.decision ? decisionColors[bundle.decision] : 'slate'
            
            return (
              <button
                key={bundle.id}
                onClick={() => onSelectBundle?.(bundle.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-none bg-${statusColor}-100 text-${statusColor}-600`}>
                    {statusIcons[bundle.status]}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{bundle.toolName}</span>
                      {bundle.toolVendor && (
                        <span className="text-xs text-slate-400">by {bundle.toolVendor}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 font-mono">
                        {bundle.id.substring(0, 8)}...
                      </span>
                      <span className="text-xs text-slate-400">
                        {bundle.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Risk Score */}
                  {bundle.riskScore !== undefined && (
                    <div className={`
                      px-2 py-1 rounded text-xs font-bold
                      ${bundle.riskScore >= 70 ? 'bg-rose-100 text-rose-700' :
                        bundle.riskScore >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'}
                    `}>
                      {bundle.riskScore}%
                    </div>
                  )}

                  {/* Decision Badge */}
                  {bundle.decision && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-none bg-${decisionColor}-100 text-${decisionColor}-700`}>
                      {decisionIcons[bundle.decision]}
                      <span className="text-xs font-medium capitalize">
                        {bundle.decision.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Mode Badge */}
                  <div className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${bundle.veraMode === 'enforcement' ? 'bg-emerald-100 text-emerald-700' :
                      bundle.veraMode === 'shadow' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'}
                  `}>
                    {bundle.veraMode}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProofBundleList

