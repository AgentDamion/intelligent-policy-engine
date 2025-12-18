import { Database } from '@/integrations/supabase/types';

export type MiddlewareRequestRow = Database['public']['Tables']['middleware_requests']['Row'];
export type PartnerApiKeyRow = Database['public']['Tables']['partner_api_keys']['Row'];

export interface MiddlewareRequest extends MiddlewareRequestRow {
  partner_name?: string;
  enterprise_name?: string;
}

export interface PartnerApiKey extends PartnerApiKeyRow {
  request_count?: number;
}

export interface MiddlewareStats {
  totalRequests: number;
  blockRate: number;
  avgResponseTime: number;
  totalCost: number;
  topModels: { model: string; count: number }[];
  requestsByDecision: { decision: string; count: number }[];
}

export type FilterTimeRange = 'hour' | 'today' | '7days' | '30days' | 'custom';
export type QuickViewFilter = 'all' | 'blocked' | 'warned' | 'allowed' | 'slow';
export type SortOption = 'recent' | 'oldest' | 'cost' | 'slowest';
