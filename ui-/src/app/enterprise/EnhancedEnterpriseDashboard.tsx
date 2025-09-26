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
import { Select, Skeleton, useToast } from '../../components/ui';
import { analytics } from '../../utils/analytics';

// Filter Chip component for demo
const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200">
    <span>{label}</span>
    <button 
      onClick={onRemove}
      className="hover:bg-teal-100 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
      aria-label={`Remove ${label} filter`}
    >
      ×
    </button>
  </div>
);

// Error State component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
    <div className="text-red-600 mb-2">⚠️ Something went wrong</div>
    <div className="text-sm text-red-700 mb-4">{error}</div>
    <button 
      onClick={onRetry}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      Try Again
    </button>
  </div>
);

// Empty State component
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
    <div className="text-4xl mb-4">🎉</div>
    <div className="text-lg font-medium text-slate-800 mb-2">{title}</div>
    <div className="text-sm text-slate-600">{description}</div>
  </div>
);

export default function EnhancedEnterpriseDashboard() {
  const M = useEnterpriseDashboard();
  const { addToast } = useToast();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedTimelineItem, setSelectedTimelineItem] = React.useState<string | null>(null);

  // Track page view on mount
  React.useEffect(() => {
    analytics.viewEnterprise();
  }, []);

  // Track filter changes
  React.useEffect(() => {
    analytics.filtersChanged(M.filters);
  }, [M.filters]);

  const handleTimelineOpen = (id: string) => {
    const item = M.timeline?.find(t => t.id === id);
    if (item) {
      analytics.timelineOpenDrawer(id, item.tags?.[0] || 'unknown');
      setSelectedTimelineItem(id);
      setDrawerOpen(true);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedTimelineItem(null);
  };

  const handleHeatMapSelect = (partner: string, category: string) => {
    // Track the interaction
    const cell = M.heat?.matrix.find(m => m.partner === partner && m.category === category);
    if (cell) {
      analytics.heatmapCellClick(partner, category, cell.risk);
    }
    
    // Update filters and show toast
    M.onHeatSelect(partner, category);
    addToast({
      title: 'Filter Applied',
      description: `Showing data for ${partner} × ${category}`,
      type: 'info'
    });
  };

  const handleMetaLoopRoute = async (id: string) => {
    try {
      const rec = M.intel?.recommendation;
      if (rec) {
        analytics.metaLoopSendToReview(id, rec.confidence);
        await M.routeRecToReview(id);
        addToast({
          title: 'Routed to Review',
          description: 'AI recommendation sent to human review queue',
          type: 'success'
        });
      }
    } catch (error) {
      addToast({
        title: 'Failed to Route',
        description: 'Could not send recommendation to review. Please try again.',
        type: 'error'
      });
    }
  };

  const handleBulkApprove = async (ids: string[], action: 'approve' | 'request_changes' | 'assign') => {
    try {
      analytics.approvalsBulkAction(action, ids.length, ids);
      await M.bulkApprove(ids, action);
      addToast({
        title: 'Bulk Action Complete',
        description: `Successfully ${action}d ${ids.length} items`,
        type: 'success'
      });
    } catch (error) {
      addToast({
        title: 'Bulk Action Failed',
        description: 'Could not complete bulk action. Please try again.',
        type: 'error'
      });
    }
  };

  const clearFilters = () => {
    M.setFilters(f => ({ ...f, partner: undefined, category: undefined }));
    addToast({
      title: 'Filters Cleared',
      description: 'Showing all data',
      type: 'info'
    });
  };

  const hasActiveFilters = M.filters.partner || M.filters.category;

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

        {/* Active Filters (Demo Feature) */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Active filters:</span>
            {M.filters.partner && M.filters.category && (
              <FilterChip 
                label={`${M.filters.partner} × ${M.filters.category}`}
                onRemove={clearFilters}
              />
            )}
            <button 
              onClick={clearFilters}
              className="text-sm text-teal-600 hover:text-teal-700 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {M.loading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : M.err ? (
            <div className="col-span-4">
              <ErrorState error={M.err} onRetry={M.reload} />
            </div>
          ) : M.overview ? (
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
            <div className="col-span-4">
              <EmptyState 
                title="No Data Available" 
                description="Unable to load overview data. Please check your connection and try again."
              />
            </div>
          )}
        </div>

        {/* Heat map + MetaLoop */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            {M.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : M.err ? (
              <ErrorState error="Failed to load risk data" onRetry={M.reload} />
            ) : (
              <RiskHeatMap data={M.heat} onSelect={handleHeatMapSelect} />
            )}
          </div>
          <MetaLoopPanel
            phase={M.intel?.phase ?? 'observe'}
            rec={M.intel?.recommendation}
            onRouteToReview={handleMetaLoopRoute}
          />
        </div>

        {/* Approvals */}
        {M.loading ? (
          <Skeleton className="h-40 w-full" />
        ) : M.approvals && M.approvals.length === 0 ? (
          <EmptyState 
            title="You're All Caught Up!"
            description="No pending approvals right now. Great job staying ahead of governance requirements."
          />
        ) : (
          <ApprovalsQueue rows={M.approvals} onBulk={handleBulkApprove} />
        )}

        {/* Timeline + Partner Health */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            {M.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : M.timeline && M.timeline.length === 0 ? (
              <EmptyState 
                title="No Recent Activity"
                description="Timeline will show governance events and decisions as they happen."
              />
            ) : (
              <TimelineFeed items={M.timeline} onOpen={handleTimelineOpen} />
            )}
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
        {selectedTimelineItem && M.timeline && (
          <div className="space-y-4">
            {(() => {
              const item = M.timeline.find(t => t.id === selectedTimelineItem);
              if (!item) return null;
              
              return (
                <>
                  <div>
                    <h3 className="font-medium text-slate-900">Event</h3>
                    <p className="text-sm text-slate-600">{item.label}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Actor</h3>
                    <p className="text-sm text-slate-600">{item.actor}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Timestamp</h3>
                    <p className="text-sm text-slate-600">{item.ts}</p>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-slate-900">Tags</h3>
                      <div className="flex gap-2 mt-1">
                        {item.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-slate-900 mb-2">Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                        Open Affected Graph
                      </button>
                      <button className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                        View Related Events
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Drawer>
    </div>
  );
}
