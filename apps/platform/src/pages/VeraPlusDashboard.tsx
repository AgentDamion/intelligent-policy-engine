import { memo, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  FileText,
  Gavel,
  History,
  Inbox as InboxIcon,
  LayoutDashboard,
  Settings,
  Shield,
  ShieldCheck,
  Terminal,
  TrendingUp,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { supabase } from '@/lib/supabase'
import { useEnterprise } from '@/contexts/EnterpriseContext'
import { VelocityMetrics, DecisionQueue, ComplianceScoreCard, ProofBundleList, ProofBundleViewer, InboxView, DecisionsView, PolicyList, PolicyEditor, PolicyVersionHistory, PolicyBadge } from '@/components/vera'
import { useVERADashboard } from '@/hooks/useVERADashboard'
import { getDeniedActionsCount, getThreadStats } from '@/services/vera/governanceThreadService'

export type ViewState = 'inbox' | 'decisions' | 'policy' | 'mission' | 'proofs'

export interface AgentActivityLog {
  id: string
  timestamp: string
  agentName: string
  action: string
  status: 'success' | 'failure' | 'processing'
  details: string
}

const LiveLogViewer = memo(({ logs }: { logs: AgentActivityLog[] }) => {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden font-mono text-xs text-slate-300 h-[520px] flex flex-col shadow-2xl">
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-slate-100 flex items-center">
          <Terminal className="w-4 h-4 mr-2" /> Live Agent Activity Stream
        </span>
        <span className="text-emerald-500 flex items-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
          Connected
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Waiting for agent activity…</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors duration-150">
              <span className="text-slate-500 w-28 flex-shrink-0">{log.timestamp}</span>
              <span className="text-indigo-400 w-36 flex-shrink-0 font-bold">{log.agentName}</span>
              <span className={`w-36 flex-shrink-0 ${log.status === 'failure' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {log.action}
              </span>
              <span className="text-slate-300 break-all">{log.details}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
})
LiveLogViewer.displayName = 'LiveLogViewer'

// Audit Metrics Component
const AuditMetricsCard = memo(({ enterpriseId }: { enterpriseId?: string }) => {
  const [stats, setStats] = useState<{
    total: number
    open: number
    approved: number
    blocked: number
    deniedActions: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!enterpriseId) return
      setIsLoading(true)
      try {
        const [threadStats, deniedCount] = await Promise.all([
          getThreadStats(enterpriseId),
          getDeniedActionsCount(enterpriseId, { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
        ])
        setStats({
          total: threadStats.total,
          open: threadStats.open + threadStats.inReview + threadStats.pendingHuman,
          approved: threadStats.approved,
          blocked: threadStats.blocked,
          deniedActions: deniedCount
        })
      } catch (err) {
        console.error('[AuditMetrics] Failed to fetch stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchStats()
  }, [enterpriseId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const metrics = [
    { label: 'Total Threads', value: stats.total, icon: History, color: 'slate' },
    { label: 'Open/Pending', value: stats.open, icon: TrendingUp, color: 'blue' },
    { label: 'Approved', value: stats.approved, icon: ShieldCheck, color: 'emerald' },
    { label: 'Blocked', value: stats.blocked, icon: Shield, color: 'red' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Governance Audit Summary
        </h3>
        <span className="text-xs text-slate-400">Last 7 days</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const colorClasses = {
              slate: 'bg-slate-100 text-slate-600',
              blue: 'bg-blue-100 text-blue-600',
              emerald: 'bg-emerald-100 text-emerald-600',
              red: 'bg-red-100 text-red-600',
            }
            return (
              <div key={metric.label} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2 ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                <div className="text-xs text-slate-500">{metric.label}</div>
              </div>
            )
          })}
        </div>
        
        {/* Security Alert - Denied Actions */}
        {stats.deniedActions > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {stats.deniedActions} action{stats.deniedActions > 1 ? 's' : ''} denied this week
              </p>
              <p className="text-xs text-red-600">
                Actions were blocked due to surface/role/state violations
              </p>
            </div>
          </div>
        )}

        {/* Actor Distribution (placeholder) */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-3">Actions by Actor Type</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-slate-700">Human</span>
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-700">Agent</span>
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '55%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
AuditMetricsCard.displayName = 'AuditMetricsCard'

// Mission Control View with new dashboard components
const MissionControlView = memo(({ enterpriseId, logs }: { enterpriseId?: string; logs: AgentActivityLog[] }) => {
  const {
    velocityMetrics,
    decisionQueue,
    complianceScore,
    isLoading,
    isRealtimeConnected,
    lastUpdated,
    refreshMetrics,
    refreshQueue,
    refreshCompliance
  } = useVERADashboard(enterpriseId, {
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
    realtimeEnabled: true
  })

  return (
    <div className="p-6 md:p-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mission Control</h1>
          <p className="text-slate-500 mt-2">System health, governance velocity, and audit status.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Real-time connection indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isRealtimeConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isRealtimeConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Live</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </div>
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Velocity Metrics */}
      <VelocityMetrics
        metrics={velocityMetrics}
        isLoading={isLoading}
        onRefresh={refreshMetrics}
        className="mb-8"
      />

      {/* Two Column Layout: Decision Queue + Compliance Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DecisionQueue
          items={decisionQueue}
          isLoading={isLoading}
          onRefresh={refreshQueue}
          onItemClick={(item) => {
            toast(`Opening decision: ${item.toolName}`, { icon: '📋' })
          }}
          maxItems={5}
        />
        
        <ComplianceScoreCard
          score={complianceScore}
          isLoading={isLoading}
          onRefresh={refreshCompliance}
        />
      </div>

      {/* Audit Metrics */}
      <div className="mb-8">
        <AuditMetricsCard enterpriseId={enterpriseId} />
      </div>

      {/* Live Agent Activity Log */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Agent Activity</h2>
        <LiveLogViewer logs={logs} />
      </div>
    </div>
  )
})
MissionControlView.displayName = 'MissionControlView'

// Proofs View with proof bundle list and viewer
const ProofsView = memo(({ enterpriseId }: { enterpriseId: string }) => {
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null)

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Bundle List */}
      <div className="w-full lg:w-[500px] h-full overflow-y-auto border-r border-slate-200 bg-white">
        <ProofBundleList
          enterpriseId={enterpriseId}
          onSelectBundle={setSelectedBundleId}
        />
      </div>

      {/* Bundle Viewer */}
      <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50">
        {selectedBundleId ? (
          <ProofBundleViewer
            proofBundleId={selectedBundleId}
            onClose={() => setSelectedBundleId(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-sm font-medium">Select a proof bundle to view details</p>
            <p className="text-xs text-slate-400 mt-2">
              Proof bundles contain cryptographically verifiable audit trails
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
ProofsView.displayName = 'ProofsView'

// Policy Studio View with list, editor, and version history
const PolicyStudioView = memo(({ enterpriseId }: { enterpriseId: string }) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<'list' | 'edit' | 'create' | 'history'>('list')

  const handleSelectPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId)
    setEditorMode('edit')
  }

  const handleCreatePolicy = () => {
    setSelectedPolicyId(null)
    setEditorMode('create')
  }

  const handleCloseEditor = () => {
    setSelectedPolicyId(null)
    setEditorMode('list')
  }

  const handleSaved = () => {
    setEditorMode('list')
    setSelectedPolicyId(null)
  }

  const handleViewHistory = () => {
    if (selectedPolicyId) {
      setEditorMode('history')
    }
  }

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Policy List - Left Panel */}
      <div className={`${editorMode === 'list' ? 'w-full' : 'w-[400px]'} h-full overflow-hidden border-r border-slate-200 bg-white transition-all duration-300`}>
        <PolicyList
          enterpriseId={enterpriseId}
          onSelectPolicy={handleSelectPolicy}
          onCreatePolicy={handleCreatePolicy}
          selectedPolicyId={selectedPolicyId}
        />
      </div>

      {/* Editor/History Panel - Right Panel */}
      {editorMode !== 'list' && (
        <div className="flex-1 h-full overflow-hidden">
          {editorMode === 'history' && selectedPolicyId ? (
            <PolicyVersionHistory
              policyId={selectedPolicyId}
              onClose={() => setEditorMode('edit')}
            />
          ) : (
            <div className="h-full flex flex-col">
              {/* Editor Toolbar */}
              {(editorMode === 'edit' || editorMode === 'create') && selectedPolicyId && (
                <div className="flex items-center justify-end gap-2 px-6 py-2 bg-slate-100 border-b border-slate-200">
                  <button
                    onClick={handleViewHistory}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Version History
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <PolicyEditor
                  enterpriseId={enterpriseId}
                  policyId={editorMode === 'edit' ? selectedPolicyId : null}
                  onClose={handleCloseEditor}
                  onSaved={handleSaved}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
PolicyStudioView.displayName = 'PolicyStudioView'

export default function VeraPlusDashboard() {
  const { currentEnterprise } = useEnterprise()
  const enterpriseId = currentEnterprise?.id

  useEffect(() => {
    console.log('[VeraPlusDashboard] Component mounted! Enterprise ID:', enterpriseId)
    return () => {
    }
  }, [enterpriseId])

  const [view, setView] = useState<ViewState>('inbox')
  const [logs, setLogs] = useState<AgentActivityLog[]>([])

  // Subscribe to agent activities for live log viewer
  const subscribeAgentActivities = useCallback(async () => {
    if (!enterpriseId) return () => undefined

    // Initial fetch
    try {
      const { data } = await supabase
        .from('agent_activities')
        .select('*')
        .eq('tenant_id', enterpriseId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setLogs(
          (data as any[]).map((row) => ({
            id: String(row.id ?? crypto.randomUUID()),
            timestamp: new Date(row.created_at || Date.now()).toLocaleTimeString(),
            agentName: row.agent_name || 'unknown',
            action: row.action || 'unknown',
            status: row.status === 'completed' ? 'success' : row.status === 'failed' ? 'failure' : 'processing',
            details: row.error || JSON.stringify(row.output_data || row.input_data || {}),
          }))
        )
      }
    } catch {
      // ignore
    }

    const channel = supabase
      .channel(`vera-plus-agent-activities-${enterpriseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_activities', filter: `tenant_id=eq.${enterpriseId}` },
        (payload) => {
          const row: any = payload.new
          const next: AgentActivityLog = {
            id: String(row.id ?? crypto.randomUUID()),
            timestamp: new Date(row.created_at || Date.now()).toLocaleTimeString(),
            agentName: row.agent_name || 'unknown',
            action: row.action || 'unknown',
            status: row.status === 'completed' ? 'success' : row.status === 'failed' ? 'failure' : 'processing',
            details: row.error || JSON.stringify(row.output_data || row.input_data || {}),
          }
          setLogs((prev) => [next, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enterpriseId])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    if (!enterpriseId) return
    subscribeAgentActivities().then((fn) => {
      cleanup = fn
    })
    return () => cleanup?.()
  }, [enterpriseId, subscribeAgentActivities])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen w-full">
        {/* Left rail */}
        <aside className="w-20 lg:w-64 bg-slate-900 flex flex-col py-6 text-slate-300 flex-shrink-0">
          <div className="px-4 lg:px-6 mb-10 flex items-center justify-center lg:justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
              V
            </div>
            <span className="hidden lg:block ml-3 font-bold text-white tracking-wide">VERA+</span>
          </div>

          <nav className="flex-1 space-y-2 px-2 lg:px-4">
            {/* Triage Inbox */}
            <button
              onClick={() => setView('inbox')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                view === 'inbox' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center">
                <InboxIcon className="h-5 w-5 mr-0 lg:mr-3" />
                <span className="hidden lg:block text-sm font-medium">Inbox</span>
              </span>
              <span className="hidden lg:block text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                Triage
              </span>
            </button>

            {/* Decisions (Final Actions) */}
            <button
              onClick={() => setView('decisions')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                view === 'decisions' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center">
                <Gavel className="h-5 w-5 mr-0 lg:mr-3" />
                <span className="hidden lg:block text-sm font-medium">Decisions</span>
              </span>
              <span className="hidden lg:block text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                Final
              </span>
            </button>

            <button
              onClick={() => setView('policy')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                view === 'policy' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center">
                <FileText className="h-5 w-5 mr-0 lg:mr-3" />
                <span className="hidden lg:block text-sm font-medium">Policy Studio</span>
              </span>
            </button>

            <button
              onClick={() => setView('mission')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                view === 'mission' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center">
                <LayoutDashboard className="h-5 w-5 mr-0 lg:mr-3" />
                <span className="hidden lg:block text-sm font-medium">Mission Control</span>
              </span>
            </button>

            <button
              onClick={() => setView('proofs')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                view === 'proofs' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center">
                <Shield className="h-5 w-5 mr-0 lg:mr-3" />
                <span className="hidden lg:block text-sm font-medium">Proof Bundles</span>
              </span>
            </button>

            {/* Settings Link */}
            <Link
              to="/vera-settings"
              className="w-full flex items-center p-3 rounded-xl transition-all hover:bg-slate-800"
            >
              <Settings className="h-5 w-5 mr-0 lg:mr-3" />
              <span className="hidden lg:block text-sm font-medium">Settings</span>
            </Link>
          </nav>

          <div className="px-4 lg:px-6 space-y-3">
            {/* Active Policy Badge */}
            {enterpriseId && (
              <div className="hidden lg:block">
                <PolicyBadge 
                  enterpriseId={enterpriseId} 
                  variant="compact"
                  size="sm"
                />
              </div>
            )}
            <div className="text-xs text-slate-400 truncate">
              {enterpriseId ? `Enterprise: ${enterpriseId.slice(0, 8)}...` : 'No enterprise context'}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          {view === 'mission' && (
            <MissionControlView enterpriseId={enterpriseId} logs={logs} />
          )}

          {view === 'policy' && enterpriseId && (
            <PolicyStudioView enterpriseId={enterpriseId} />
          )}

          {view === 'proofs' && enterpriseId && (
            <ProofsView enterpriseId={enterpriseId} />
          )}

          {view === 'inbox' && enterpriseId && (
            <InboxView enterpriseId={enterpriseId} />
          )}

          {view === 'decisions' && enterpriseId && (
            <DecisionsView enterpriseId={enterpriseId} />
          )}
        </main>
      </div>
    </div>
  )
}

