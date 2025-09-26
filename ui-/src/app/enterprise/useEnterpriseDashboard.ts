// Enterprise Dashboard Data Orchestration Hook

import { useEffect, useState } from 'react';
import { get, post } from '../../services/api';
import type { 
  Overview, 
  HeatMap, 
  MetaLoopLatest, 
  Approval, 
  TimelineItem, 
  PartnerHealth 
} from './types';

export type Filters = {
  unit: string | 'all';
  window: '7d' | '30d' | '90d';
  risk: 'all' | 'high' | 'medium' | 'low';
  partner?: string;
  category?: string;
};

export function useEnterpriseDashboard() {
  const [filters, setFilters] = useState<Filters>({
    unit: 'all',
    window: '7d',
    risk: 'all',
  });

  // Data state
  const [overview, setOverview] = useState<Overview | null>(null);
  const [heat, setHeat] = useState<HeatMap | null>(null);
  const [intel, setIntel] = useState<MetaLoopLatest | null>(null);
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[] | null>(null);
  const [partners, setPartners] = useState<PartnerHealth[] | null>(null);

  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const [ov, hm, ml, ap, tl, ph] = await Promise.all([
        get<Overview>('/api/enterprise/overview'),
        get<HeatMap>(`/api/risk/heatmap${buildQuery({ window: filters.window })}`),
        get<MetaLoopLatest>('/api/intel/metaloop/latest'),
        get<Approval[]>(`/api/approvals${buildQuery({ 
          partner: filters.partner, 
          category: filters.category 
        })}`),
        get<TimelineItem[]>(`/api/audit/timeline${buildQuery({ window: filters.window })}`),
        get<PartnerHealth[]>(`/api/partners/health${buildQuery({ window: filters.window })}`),
      ]);

      setOverview(ov);
      setHeat(hm);
      setIntel(ml);
      setApprovals(ap);
      setTimeline(tl);
      setPartners(ph);
    } catch (error: any) {
      console.error('[ENTERPRISE] Failed to load dashboard data:', error);
      setErr(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Reload when filters change
  useEffect(() => {
    void load();
  }, [filters.window, filters.partner, filters.category]);

  // Actions
  function onHeatSelect(partner: string, category: string) {
    setFilters(f => ({ ...f, partner, category }));
  }

  async function routeRecToReview(id: string) {
    try {
      await post('/api/intel/metaloop/route-to-review', { recommendationId: id });
      // Reload intel data
      const ml = await get<MetaLoopLatest>('/api/intel/metaloop/latest');
      setIntel(ml);
    } catch (error: any) {
      console.error('[ENTERPRISE] Failed to route recommendation:', error);
      setErr(error.message || 'Failed to route recommendation');
    }
  }

  async function bulkApprove(ids: string[], action: 'approve' | 'request_changes' | 'assign') {
    try {
      await post('/api/approvals/bulk', { action, ids });
      // Reload approvals data
      const ap = await get<Approval[]>(`/api/approvals${buildQuery({ 
        partner: filters.partner, 
        category: filters.category 
      })}`);
      setApprovals(ap);
    } catch (error: any) {
      console.error('[ENTERPRISE] Failed to bulk update approvals:', error);
      setErr(error.message || 'Failed to update approvals');
    }
  }

  return {
    // State
    filters,
    setFilters,
    overview,
    heat,
    intel,
    approvals,
    timeline,
    partners,
    loading,
    err,
    
    // Actions
    onHeatSelect,
    routeRecToReview,
    bulkApprove,
    
    // Utilities
    reload: load,
  };
}

function buildQuery(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
  
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}
