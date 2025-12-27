/**
 * PolicyList Component
 * 
 * Displays a filterable, sortable list of policies for the Policy Studio.
 * Features search, status filtering, and pagination.
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Plus, 
  ChevronRight, 
  FileText, 
  Clock,
  CheckCircle2,
  Archive,
  Edit3,
  MoreVertical
} from 'lucide-react'
import { 
  getPolicies, 
  getPolicyStats,
  archivePolicy,
  type PolicyListItem, 
  type PolicyStatus,
  type PolicyFilters,
  type PolicyStats
} from '@/services/vera/policyStudioService'
import toast from 'react-hot-toast'

// =============================================================================
// Types
// =============================================================================

interface PolicyListProps {
  enterpriseId: string
  onSelectPolicy: (policyId: string) => void
  onCreatePolicy: () => void
  selectedPolicyId?: string | null
}

// =============================================================================
// Status Badge Component
// =============================================================================

function StatusBadge({ status }: { status: PolicyStatus }) {
  const config: Record<PolicyStatus, { icon: React.ReactNode; label: string; className: string }> = {
    draft: {
      icon: <Edit3 className="w-3 h-3" />,
      label: 'Draft',
      className: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    review: {
      icon: <Clock className="w-3 h-3" />,
      label: 'In Review',
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    published: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Published',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    archived: {
      icon: <Archive className="w-3 h-3" />,
      label: 'Archived',
      className: 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  const { icon, label, className } = config[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {icon}
      {label}
    </span>
  )
}

// =============================================================================
// Stats Summary Component
// =============================================================================

function StatsSummary({ stats }: { stats: PolicyStats | null }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        <div className="text-xs text-slate-500">Total Policies</div>
      </div>
      <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-3">
        <div className="text-2xl font-bold text-emerald-700">{stats.byStatus.published}</div>
        <div className="text-xs text-emerald-600">Published</div>
      </div>
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-3">
        <div className="text-2xl font-bold text-amber-700">{stats.byStatus.draft + stats.byStatus.review}</div>
        <div className="text-xs text-amber-600">In Progress</div>
      </div>
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
        <div className="text-2xl font-bold text-blue-700">{stats.recentlyUpdated}</div>
        <div className="text-xs text-blue-600">Updated This Week</div>
      </div>
    </div>
  )
}

// =============================================================================
// Filter Tabs Component
// =============================================================================

function FilterTabs({ 
  activeFilter, 
  onFilterChange,
  counts 
}: { 
  activeFilter: PolicyStatus | 'all'
  onFilterChange: (filter: PolicyStatus | 'all') => void
  counts: Record<string, number>
}) {
  const tabs: Array<{ value: PolicyStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Drafts' },
    { value: 'review', label: 'In Review' },
    { value: 'archived', label: 'Archived' }
  ]

  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onFilterChange(tab.value)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${activeFilter === tab.value 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          {tab.label}
          {counts[tab.value] !== undefined && (
            <span className="ml-1.5 text-xs text-slate-400">
              {counts[tab.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// Policy Row Component
// =============================================================================

function PolicyRow({ 
  policy, 
  isSelected,
  onSelect,
  onArchive
}: { 
  policy: PolicyListItem
  isSelected: boolean
  onSelect: () => void
  onArchive: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className={`
        group relative p-4 border-b border-slate-100 cursor-pointer
        transition-all duration-150
        ${isSelected 
          ? 'bg-indigo-50 border-l-2 border-l-indigo-500' 
          : 'hover:bg-slate-50 border-l-2 border-l-transparent'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <h3 className="font-medium text-slate-900 truncate">{policy.title}</h3>
            <StatusBadge status={policy.status} />
          </div>
          
          {policy.description && (
            <p className="text-sm text-slate-500 line-clamp-1 ml-6 mb-2">
              {policy.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 ml-6 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(policy.updated_at)}
            </span>
            {policy.version_count > 0 && (
              <span>
                v{policy.latest_version} ({policy.version_count} version{policy.version_count !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }} 
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  {policy.status !== 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onArchive()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main PolicyList Component
// =============================================================================

export function PolicyList({ 
  enterpriseId, 
  onSelectPolicy, 
  onCreatePolicy,
  selectedPolicyId 
}: PolicyListProps) {
  const [policies, setPolicies] = useState<PolicyListItem[]>([])
  const [stats, setStats] = useState<PolicyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'all'>('all')

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    // Guard against missing enterpriseId
    if (!enterpriseId || enterpriseId === 'undefined') {
      console.warn('[PolicyList] Skipping fetch: enterpriseId is missing or undefined')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const filters: PolicyFilters = {
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100
      }
      
      const [policiesData, statsData] = await Promise.all([
        getPolicies(enterpriseId, filters),
        getPolicyStats(enterpriseId)
      ])
      
      setPolicies(policiesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching policies:', error)
      toast.error('Failed to load policies')
    } finally {
      setLoading(false)
    }
  }, [enterpriseId, searchQuery, statusFilter])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  // Handle archive
  const handleArchive = async (policyId: string, policyTitle: string) => {
    try {
      await archivePolicy(policyId)
      toast.success(`"${policyTitle}" archived`)
      fetchPolicies()
    } catch (error) {
      console.error('Error archiving policy:', error)
      toast.error('Failed to archive policy')
    }
  }

  // Calculate counts for filter tabs
  const filterCounts = {
    all: stats?.total || 0,
    published: stats?.byStatus.published || 0,
    draft: stats?.byStatus.draft || 0,
    review: stats?.byStatus.review || 0,
    archived: stats?.byStatus.archived || 0
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Policies</h2>
          <button
            onClick={onCreatePolicy}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>

        {/* Stats Summary */}
        <StatsSummary stats={stats} />

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <FilterTabs 
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          counts={filterCounts}
        />
      </div>

      {/* Policy List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium">No policies found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first policy to get started'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={onCreatePolicy}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Policy
              </button>
            )}
          </div>
        ) : (
          <div>
            {policies.map((policy) => (
              <PolicyRow
                key={policy.id}
                policy={policy}
                isSelected={policy.id === selectedPolicyId}
                onSelect={() => onSelectPolicy(policy.id)}
                onArchive={() => handleArchive(policy.id, policy.title)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PolicyList

