/**
 * PolicyVersionHistory Component
 * 
 * Displays version history for a policy with comparison capabilities.
 * Shows version timeline, diff viewer, and allows restoring previous versions.
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  History, 
  ChevronRight, 
  GitBranch, 
  GitCommit,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw,
  User,
  Calendar
} from 'lucide-react'
import { 
  getPolicyVersions,
  getPolicyVersion,
  compareVersions,
  type PolicyVersion,
  type VersionDiff
} from '@/services/vera/policyStudioService'
import toast from 'react-hot-toast'

// =============================================================================
// Types
// =============================================================================

interface PolicyVersionHistoryProps {
  policyId: string
  onClose?: () => void
}

// =============================================================================
// Version Timeline Item
// =============================================================================

function VersionTimelineItem({
  version,
  isLatest,
  isSelected,
  onSelect,
  onCompare
}: {
  version: PolicyVersion
  isLatest: boolean
  isSelected: boolean
  onSelect: () => void
  onCompare: () => void
}) {
  const statusConfig = {
    draft: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Draft' },
    published: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Published' },
    archived: { icon: Archive, color: 'text-slate-400', bg: 'bg-slate-100', label: 'Archived' }
  }

  const config = statusConfig[version.status] || statusConfig.draft

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />
      
      <div 
        className={`
          relative flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all
          ${isSelected 
            ? 'bg-indigo-50 border-2 border-indigo-300' 
            : 'hover:bg-slate-50 border-2 border-transparent'
          }
        `}
        onClick={onSelect}
      >
        {/* Version marker */}
        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
          <config.icon className={`w-4 h-4 ${config.color}`} />
        </div>

        {/* Version details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-slate-900">
              Version {version.version_number}
            </span>
            {isLatest && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                Latest
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>

          <p className="text-sm text-slate-600 truncate mb-2">
            {version.title}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(version.created_at)}
            </span>
            {version.published_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Published {formatDate(version.published_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCompare()
            }}
            className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
          >
            Compare
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Diff Viewer Component
// =============================================================================

function DiffViewer({ diffs }: { diffs: VersionDiff[] }) {
  if (diffs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
        <p className="text-sm">No differences found</p>
      </div>
    )
  }

  const changeTypeConfig = {
    added: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Added' },
    removed: { icon: Minus, color: 'text-red-600', bg: 'bg-red-50', label: 'Removed' },
    changed: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Changed' }
  }

  return (
    <div className="space-y-3">
      {diffs.map((diff, index) => {
        const config = changeTypeConfig[diff.changeType]
        return (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${config.bg} border-opacity-50`}
          >
            <div className="flex items-center gap-2 mb-2">
              <config.icon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
              <span className="text-sm text-slate-500 font-mono">
                {diff.path.join('.')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {diff.changeType !== 'added' && (
                <div className="p-2 bg-red-100 rounded font-mono text-xs overflow-auto">
                  <span className="text-red-600">- </span>
                  {JSON.stringify(diff.oldValue, null, 2)}
                </div>
              )}
              {diff.changeType !== 'removed' && (
                <div className={`p-2 bg-emerald-100 rounded font-mono text-xs overflow-auto ${diff.changeType === 'added' ? 'col-span-2' : ''}`}>
                  <span className="text-emerald-600">+ </span>
                  {JSON.stringify(diff.newValue, null, 2)}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// Version Detail Panel
// =============================================================================

function VersionDetailPanel({ version }: { version: PolicyVersion }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Title</h4>
        <p className="text-slate-900">{version.title}</p>
      </div>

      {version.description && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
          <p className="text-sm text-slate-600">{version.description}</p>
        </div>
      )}

      {version.jurisdictions && version.jurisdictions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Jurisdictions</h4>
          <div className="flex flex-wrap gap-2">
            {version.jurisdictions.map(j => (
              <span key={j} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                {j}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Rules Configuration</h4>
        <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-auto max-h-64">
          {JSON.stringify(version.rules, null, 2)}
        </pre>
      </div>
    </div>
  )
}

// =============================================================================
// Comparison Mode Component
// =============================================================================

function ComparisonMode({
  versions,
  onClose
}: {
  versions: PolicyVersion[]
  onClose: () => void
}) {
  const [version1Id, setVersion1Id] = useState<string>('')
  const [version2Id, setVersion2Id] = useState<string>('')
  const [diffs, setDiffs] = useState<VersionDiff[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCompare = async () => {
    if (!version1Id || !version2Id) {
      toast.error('Please select two versions to compare')
      return
    }

    setLoading(true)
    try {
      const [v1, v2] = await Promise.all([
        getPolicyVersion(version1Id),
        getPolicyVersion(version2Id)
      ])

      if (v1 && v2) {
        const differences = compareVersions(v1, v2)
        setDiffs(differences)
      }
    } catch (error) {
      console.error('Error comparing versions:', error)
      toast.error('Failed to compare versions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-medium text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-500" />
          Compare Versions
        </h3>
        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>

      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <select
            value={version1Id}
            onChange={(e) => setVersion1Id(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select base version...</option>
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                v{v.version_number} - {v.title} ({v.status})
              </option>
            ))}
          </select>

          <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />

          <select
            value={version2Id}
            onChange={(e) => setVersion2Id(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select compare version...</option>
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                v{v.version_number} - {v.title} ({v.status})
              </option>
            ))}
          </select>

          <button
            onClick={handleCompare}
            disabled={!version1Id || !version2Id || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {diffs === null ? (
          <div className="text-center py-12 text-slate-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-sm">Select two versions and click Compare to see differences</p>
          </div>
        ) : (
          <DiffViewer diffs={diffs} />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Main PolicyVersionHistory Component
// =============================================================================

export function PolicyVersionHistory({ policyId, onClose }: PolicyVersionHistoryProps) {
  const [versions, setVersions] = useState<PolicyVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  // Load versions
  const loadVersions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPolicyVersions(policyId)
      setVersions(data)
      if (data.length > 0 && !selectedVersion) {
        setSelectedVersion(data[0])
      }
    } catch (error) {
      console.error('Error loading versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }, [policyId, selectedVersion])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (showComparison) {
    return (
      <ComparisonMode 
        versions={versions} 
        onClose={() => setShowComparison(false)} 
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Version History
        </h2>
        <button
          onClick={() => setShowComparison(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <GitBranch className="w-4 h-4" />
          Compare Versions
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Timeline */}
        <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-4">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <GitCommit className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm">No versions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <VersionTimelineItem
                  key={version.id}
                  version={version}
                  isLatest={index === 0}
                  isSelected={selectedVersion?.id === version.id}
                  onSelect={() => setSelectedVersion(version)}
                  onCompare={() => setShowComparison(true)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-1/2 overflow-y-auto p-6 bg-slate-50">
          {selectedVersion ? (
            <VersionDetailPanel version={selectedVersion} />
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">Select a version to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PolicyVersionHistory

