// Enhanced Enterprise Dashboard with Cursor AI Integration
import React from 'react'
import { useEnterpriseDashboard } from './useEnterpriseDashboard'
import { useAIDecisions } from '../../hooks/useAIDecisions'
import { StatCard } from '../../components/enterprise/StatCard'
import { RiskHeatMap } from '../../components/enterprise/RiskHeatMap'
import { ApprovalsQueue } from '../../components/enterprise/ApprovalsQueue'
import { TimelineFeed } from '../../components/enterprise/TimelineFeed'
import { PartnerHealthMini } from '../../components/enterprise/PartnerHealthMini'
import { Drawer } from '../../components/enterprise/Drawer'
import { AIDecisionsFeed } from '../../components/enterprise/AIDecisionsFeed'
import { AIInsightsPanel } from '../../components/enterprise/AIInsightsPanel'
import { MetaLoopPanel } from '../../components/enterprise/MetaLoopPanel'
import LiveGovernanceStream, { useLiveGovernanceStream } from '../../components/LiveGovernanceStream'
import { useAuth } from '../../contexts/AuthContext'
import { Activity } from 'lucide-react'

export default function EnterpriseDashboardEnhanced() {
  const M = useEnterpriseDashboard()
  const AI = useAIDecisions()
  const { user } = useAuth()
  const { isStreamOpen, openStream, setIsStreamOpen } = useLiveGovernanceStream()
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedTimelineItem, setSelectedTimelineItem] = React.useState<string | null>(null)

  const handleTimelineOpen = (id: string) => {
    setSelectedTimelineItem(id)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedTimelineItem(null)
  }

  // Calculate AI-enhanced metrics
  const aiMetrics = React.useMemo(() => {
    if (!AI.decisions.length) return null
    
    const recentDecisions = AI.decisions.slice(0, 10)
    const approvalRate = recentDecisions.filter(d => d.outcome === 'approved').length / recentDecisions.length
    const avgConfidence = recentDecisions.reduce((acc, d) => acc + (d.details?.confidence || 0), 0) / recentDecisions.length
    
    return {
      approvalRate,
      avgConfidence,
      totalDecisions: AI.decisions.length
    }
  }, [AI.decisions])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enterprise Governance Command Center</h1>
            <p className="text-slate-600">Real-time intelligence powered by Cursor AI</p>
          </div>
          <div className="flex items-center gap-4">
            {AI.connected && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                AI Agents Connected
              </div>
            )}
            <button
              onClick={() => openStream()}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Activity size={16} />
              Live Stream
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {M.overview ? (
            <>
              <StatCard title="Overall Compliance" value={`${Math.round(M.overview.compliancePct * 100)}%`} delta={{ dir: 'up', value: '+2.1%' }} tone="positive" />
              <StatCard title="Active Partners" value={`${M.overview.partners}`} />
              <StatCard title="AI Tools in Use" value={`${M.overview.tools}`} />
              <StatCard title="Open Risks" value={`${M.overview.openRisks}`} tone={M.overview.openRisks > 0 ? 'warning' : 'default'} />
              
              {/* NEW: AI Metrics Card */}
              {aiMetrics && (
                <StatCard 
                  title="AI Approval Rate" 
                  value={`${Math.round(aiMetrics.approvalRate * 100)}%`} 
                  delta={{ dir: 'up', value: `${aiMetrics.totalDecisions} decisions` }} 
                  tone="positive" 
                />
              )}
            </>
          ) : (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <RiskHeatMap data={M.heat} onSelect={M.onHeatSelect} />
          </div>
          
          {/* ENHANCED: MetaLoop Panel with AI Integration */}
          <MetaLoopPanel 
            phase={M.intel?.phase ?? 'observe'}
            rec={M.intel?.recommendation}
            onRouteToReview={M.routeRecToReview}
          />
        </div>

        <ApprovalsQueue rows={M.approvals} onBulk={M.bulkApprove} />

        {/* NEW: AI Decisions Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <AIDecisionsFeed 
              decisions={AI.decisions} 
              loading={AI.loading}
              onAnalyzeDocument={AI.analyzeDocument}
            />
          </div>
          
          {/* AI Insights Panel */}
          <AIInsightsPanel 
            phase={M.intel?.phase ?? 'observe'}
            recommendation={M.intel?.recommendation}
            aiDecisions={AI.decisions.slice(0, 3)}
            onRouteToReview={M.routeRecToReview}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <TimelineFeed items={M.timeline} onOpen={handleTimelineOpen} />
          </div>
          <PartnerHealthMini items={M.partners} />
        </div>

        {M.err && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4">
            <div className="font-medium">Error</div>
            <div className="text-sm">{M.err}</div>
            <button onClick={M.reload} className="mt-2 text-sm underline hover:no-underline">Try again</button>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={handleDrawerClose} title="Timeline Event Details">
        {selectedTimelineItem && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">Event ID</h3>
              <p className="text-sm text-slate-600">{selectedTimelineItem}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Details</h3>
              <p className="text-sm text-slate-600">Enhanced with AI analysis capabilities.</p>
            </div>
            <div className="pt-4 border-t">
              <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors" onClick={handleDrawerClose}>
                Close Details
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Live Governance Stream */}
      <LiveGovernanceStream
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        position="right"
        currentUser={{ type: 'enterprise', email: user?.email }}
      />
    </div>
  )
}
