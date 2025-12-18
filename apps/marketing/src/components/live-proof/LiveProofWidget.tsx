import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { sampleDataService } from '@/services/sampleDataService';
import { realDataService } from '@/services/realDataService';
import RecentDecisionsFeed from './RecentDecisionsFeed';
import { formatTimeAgo } from './utils';
import type { LiveMetrics, Decision, LiveProofWidgetProps } from '@/types/live-proof';

const LiveProofWidget: React.FC<LiveProofWidgetProps> = ({ 
  className = '', 
  refreshInterval = 30000 
}) => {
  const api = useApi();
  const [metrics, setMetrics] = useState<LiveMetrics>({});
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every refreshInterval milliseconds
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchData = async () => {
    try {
      // Try real API first
      const [metricsResponse, decisionsData] = await Promise.all([
        api.getLiveMetrics(),
        api.getRecentDecisions(5)
      ]);
      
      if (metricsResponse && typeof metricsResponse === 'object') {
        const apiMetrics = metricsResponse;
        setMetrics({
          decisions_today: apiMetrics.liveGovernanceProof || 0,
          compliance_rate: apiMetrics.complianceRate || 0,
          total_decisions: apiMetrics.auditEvents || 0,
          avg_decision_time: parseFloat(apiMetrics.avgDecisionTime) || 0,
          last_updated: new Date().toISOString()
        });
        setDecisions(apiMetrics.recentDecisions || decisionsData || []);
        setUsingFallback(false);
        setIsLive(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.warn('API failed, trying real database:', error);
    }

    try {
      // Try real database data
      const [realMetrics, realDecisions] = await Promise.all([
        realDataService.getLiveMetrics(),
        realDataService.getRecentDecisions(5)
      ]);
      
      if (realMetrics.success && realMetrics.metrics) {
        setMetrics(realMetrics.metrics);
        setDecisions(realDecisions);
        setUsingFallback(false);
        setIsLive(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Real data failed, using sample data:', error);
    }

    // Final fallback to sample data
    try {
      const [sampleMetrics, sampleDecisions] = await Promise.all([
        sampleDataService.getLiveMetrics(),
        sampleDataService.getRecentDecisions(5)
      ]);
      
      if (sampleMetrics.success && sampleMetrics.metrics) {
        setMetrics(sampleMetrics.metrics);
        setDecisions(sampleDecisions);
        setUsingFallback(true);
        setIsLive(true);
      }
    } catch (fallbackError) {
      console.error('All data sources failed:', fallbackError);
      setIsLive(false);
    }
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-muted h-64 rounded-lg ${className}`}>
        <div className="p-6">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="h-4 bg-muted-foreground/20 rounded w-1/3"></div>
                <div className="h-6 bg-muted-foreground/20 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-background rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="font-semibold text-gray-900">Live Governance Proof</span>
          {usingFallback && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Demo Mode</span>
          )}
        </div>
        <div className="text-xs text-gray-600">
          Updated {formatTimeAgo(metrics.last_updated)}
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Decisions Today</span>
          <span className="text-2xl font-bold text-blue-600">{metrics.decisions_today || 0}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Compliance Rate</span>
          <span className="text-2xl font-bold text-green-600">{metrics.compliance_rate || 0}%</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Total Decisions</span>
          <span className="text-2xl font-bold text-purple-600">{(metrics.total_decisions || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm font-medium text-gray-600">Avg Response</span>
          <span className="text-2xl font-bold text-indigo-600">{(metrics.avg_decision_time || 0).toFixed(2)}s</span>
        </div>
      </div>

      {/* Recent Decisions Feed */}
      <RecentDecisionsFeed decisions={decisions} />
    </div>
  );
};

export default LiveProofWidget;