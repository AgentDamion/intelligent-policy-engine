import { useState } from 'react';
import { MiddlewareFilters } from './MiddlewareFilters';
import { MiddlewareActivityList } from './MiddlewareActivityList';
import { MiddlewareRequestDetail } from './MiddlewareRequestDetail';
import { ApiKeyManagementModal } from './ApiKeyManagementModal';
import { AgenticInsightsPanel } from './AgenticInsightsPanel';
import { useMiddlewareRequests } from '@/hooks/useMiddlewareRequests';
import type { FilterTimeRange, QuickViewFilter, SortOption } from './types';

export const MiddlewareView = () => {
  const [timeRange, setTimeRange] = useState<FilterTimeRange>('7days');
  const [quickView, setQuickView] = useState<QuickViewFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const { requests, loading, error } = useMiddlewareRequests({
    timeRange,
    quickView,
    sortBy,
    searchQuery,
  });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null;
  
  // TODO: Get enterprise ID from auth context
  const enterpriseId = '550e8400-e29b-41d4-a716-446655440001';

  return (
    <div className="h-full flex gap-4">
      {/* Left Panel - Filters */}
      <div className="w-80 flex-shrink-0">
        <MiddlewareFilters
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          quickView={quickView}
          onQuickViewChange={setQuickView}
          onManageKeys={() => setShowApiKeyModal(true)}
        />
      </div>

      {/* Middle Panel - Activity List with Agentic Insights */}
      <div className="flex-1 min-w-0 space-y-4">
        <AgenticInsightsPanel enterpriseId={enterpriseId} />
        <MiddlewareActivityList
          requests={requests}
          selectedRequestId={selectedRequestId}
          onRequestSelect={setSelectedRequestId}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Right Panel - Request Detail */}
      <div className="w-[500px] flex-shrink-0">
        <MiddlewareRequestDetail request={selectedRequest} />
      </div>

      <ApiKeyManagementModal open={showApiKeyModal} onOpenChange={setShowApiKeyModal} />
    </div>
  );
};
