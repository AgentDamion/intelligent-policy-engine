import React from 'react'
import { useEnterpriseDashboard } from './useEnterpriseDashboard'
import { StatCard } from '../../components/enterprise/StatCard'
import { RiskHeatMap } from '../../components/enterprise/RiskHeatMap'
import { ApprovalsQueue } from '../../components/enterprise/ApprovalsQueue'
import { TimelineFeed } from '../../components/enterprise/TimelineFeed'
import { PartnerHealthMini } from '../../components/enterprise/PartnerHealthMini'
import { Drawer } from '../../components/enterprise/Drawer'

export default function EnterpriseDashboard() {
  const M = useEnterpriseDashboard()
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enterprise Governance Command Center</h1>
            <p className="text-slate-600">Real-time intelligence and human-in-the-loop oversight</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {M.overview ? (
            <>
              <StatCard title="Overall Compliance" value={`${Math.round(M.overview.compliancePct * 100)}%`} delta={{ dir: 'up', value: '+2.1%' }} tone="positive" />
              <StatCard title="Active Partners" value={`${M.overview.partners}`} />
              <StatCard title="AI Tools in Use" value={`${M.overview.tools}`} />
              <StatCard title="Open Risks" value={`${M.overview.openRisks}`} tone={M.overview.openRisks > 0 ? 'warning' : 'default'} />
            </>
          ) : (
            <>
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <RiskHeatMap data={M.heat} onSelect={M.onHeatSelect} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-slate-700">MetaLoop Signal</h3>
            <div className="text-sm text-slate-600">
              Phase: <b className="text-slate-800">{M.intel?.phase ?? 'observe'}</b>
            </div>
          </div>
        </div>

        <ApprovalsQueue rows={M.approvals} onBulk={M.bulkApprove} />

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
              <p className="text-sm text-slate-600">Mock details for the selected timeline item.</p>
            </div>
            <div className="pt-4 border-t">
              <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors" onClick={handleDrawerClose}>
                Close Details
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}


