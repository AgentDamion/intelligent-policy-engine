import React from 'react';
import { useEnterpriseDashboard } from './useEnterpriseDashboard';
import { 
  StatCard, 
  RiskHeatMap, 
  MetaLoopPanel, 
  ApprovalsQueue, 
  TimelineFeed, 
  PartnerHealthMini, 
  Drawer 
} from '../../components/enterprise';
import { Select, Skeleton } from '../../components/ui';

export default function EnterpriseDashboard() {
  const M = useEnterpriseDashboard();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedTimelineItem, setSelectedTimelineItem] = React.useState<string | null>(null);

  const handleTimelineOpen = (id: string) => {
    setSelectedTimelineItem(id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedTimelineItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enterprise Governance Command Center</h1>
            <p className="text-slate-600">Real-time intelligence and human-in-the-loop oversight</p>
          </div>
          
          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select 
              label="Units" 
              options={[
                { value: 'all', label: 'All Units' },
                { value: 'north-america', label: 'North America' },
                { value: 'europe', label: 'Europe' },
                { value: 'apac', label: 'APAC' }
              ]} 
              value={M.filters.unit} 
              onChange={(v) => M.setFilters(f => ({ ...f, unit: v as any }))}
            />
            <Select 
              label="Window" 
              options={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' }
              ]} 
              value={M.filters.window} 
              onChange={(v) => M.setFilters(f => ({ ...f, window: v as any }))}
            />
            <Select 
              label="Risk" 
              options={[
                { value: 'all', label: 'All Risks' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]} 
              value={M.filters.risk} 
              onChange={(v) => M.setFilters(f => ({ ...f, risk: v as any }))}
            />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {M.overview ? (
            <>
              <StatCard 
                title="Overall Compliance" 
                value={`${Math.round(M.overview.compliancePct * 100)}%`} 
                delta={{ dir: 'up', value: '+2.1%' }} 
                tone="positive"
              />
              <StatCard 
                title="Active Partners" 
                value={`${M.overview.partners}`} 
              />
              <StatCard 
                title="AI Tools in Use" 
                value={`${M.overview.tools}`} 
              />
              <StatCard 
                title="Open Risks" 
                value={`${M.overview.openRisks}`} 
                tone={M.overview.openRisks > 0 ? 'warning' : 'default'} 
              />
            </>
          ) : (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          )}
        </div>

        {/* Heat map + MetaLoop */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <RiskHeatMap data={M.heat} onSelect={M.onHeatSelect} />
          </div>
          <MetaLoopPanel
            phase={M.intel?.phase ?? 'observe'}
            rec={M.intel?.recommendation}
            onRouteToReview={(id) => M.routeRecToReview(id)}
          />
        </div>

        {/* Approvals */}
        <ApprovalsQueue rows={M.approvals} onBulk={M.bulkApprove} />

        {/* Timeline + Partner Health */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <TimelineFeed items={M.timeline} onOpen={handleTimelineOpen} />
          </div>
          <PartnerHealthMini items={M.partners} />
        </div>

        {/* Error toast/light banner */}
        {M.err && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Error:</span> {M.err}
            </div>
            <button 
              onClick={M.reload}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Timeline Details Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title="Timeline Event Details"
      >
        {selectedTimelineItem && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">Event ID</h3>
              <p className="text-sm text-slate-600">{selectedTimelineItem}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Details</h3>
              <p className="text-sm text-slate-600">
                This is a mock timeline event detail view. In a real implementation, 
                this would show detailed information about the selected timeline item,
                including logs, metadata, related events, and actionable insights.
              </p>
            </div>
            <div className="pt-4 border-t">
              <button 
                className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                onClick={handleDrawerClose}
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
