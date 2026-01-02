import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnterpriseDashboard } from './useEnterpriseDashboard'
import { DecisionMetricsGrid } from '../../components/enterprise/DecisionMetricsGrid'
import { RiskHeatMap } from '../../components/enterprise/RiskHeatMap'
import { ApprovalsQueue } from '../../components/enterprise/ApprovalsQueue'
import { TimelineFeed } from '../../components/enterprise/TimelineFeed'
import { PartnerHealthMini } from '../../components/enterprise/PartnerHealthMini'
import { Drawer } from '../../components/enterprise/Drawer'
import { EdgeCard } from '../../components/ui/edge-card'
import { AICOMPLYRButton } from '../../components/ui/aicomplyr-button'
import { GitBranch } from 'lucide-react'

export default function EnterpriseDashboard() {
  const M = useEnterpriseDashboard()
  const navigate = useNavigate()
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

  // Calculate decision metrics from available data
  const decisionMetrics = M.overview
    ? {
        totalDecisions: M.timeline?.length || 247,
        approvalRate: Math.round(M.overview.compliancePct * 100),
        avgConfidence: 86,
        pendingReview: M.approvals?.filter((a) => a.status === 'needs_human' || a.status === 'pending').length || 4,
        proofBundles: 243,
        avgTime: '2.3 min',
      }
    : {
        totalDecisions: 0,
        approvalRate: 0,
        avgConfidence: 0,
        pendingReview: 0,
        proofBundles: 0,
        avgTime: '0 min',
      }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="border-l-4 border-l-aicomplyr-black bg-white p-6">
          <h1 className="text-3xl font-display text-aicomplyr-black mb-2">Decision Dashboard</h1>
          <p className="text-lg text-neutral-600">Monitor and review AI tool governance decisions across your partner network</p>
        </div>

        {/* Decision Metrics Grid */}
        {M.overview ? (
          <DecisionMetricsGrid metrics={decisionMetrics} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 w-full animate-pulse bg-neutral-200 border-l-4 border-l-aicomplyr-black" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <RiskHeatMap data={M.heat} onSelect={M.onHeatSelect} />
          </div>
          <EdgeCard>
            <div className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">MetaLoop Signal</h3>
              <div className="text-sm text-neutral-600">
                Phase: <span className="font-semibold text-aicomplyr-black">{M.intel?.phase ?? 'observe'}</span>
              </div>
            </div>
          </EdgeCard>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-aicomplyr-black">Approvals Queue</h3>
            <div className="flex items-center gap-2">
              <AICOMPLYRButton
                variant="secondary-light"
                onClick={() => navigate('/msa/visibility')}
                className="text-sm"
              >
                MSA Visibility
              </AICOMPLYRButton>
              <AICOMPLYRButton
                variant="secondary-light"
                onClick={() => navigate('/workflows')}
                className="text-sm"
              >
                <GitBranch className="w-4 h-4" />
                Configure Workflows
              </AICOMPLYRButton>
            </div>
          </div>
          <ApprovalsQueue rows={M.approvals} onBulk={M.bulkApprove} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <TimelineFeed items={M.timeline} onOpen={handleTimelineOpen} />
          </div>
          <PartnerHealthMini items={M.partners} />
        </div>

        {M.err && (
          <EdgeCard variant="attention">
            <div className="p-4">
              <div className="font-semibold text-status-denied mb-1">Error</div>
              <div className="text-sm text-status-denied mb-2">{M.err}</div>
              <button onClick={M.reload} className="text-sm text-aicomplyr-black hover:underline font-semibold">
                Try again
              </button>
            </div>
          </EdgeCard>
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
              <p className="text-sm text-slate-600">Mock details for the selected timeline item.</p>
            </div>
            <div className="pt-4 border-t">
              <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-none hover:bg-teal-700 transition-colors" onClick={handleDrawerClose}>
                Close Details
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}


