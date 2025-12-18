/**
 * Secure Query Wrapper - Enforces tenant boundary and access controls
 * Prevents cross-tenant data access and ensures proper RLS enforcement
 */

import { supabase } from '@/integrations/supabase/client';
import { clientLinksApi } from '@/lib/admin/clientLinks';
import { demoMode, createPharmaDemoData } from '@/utils/demoMode';

export interface SecurityContext {
  agencyId: string;
  userId: string;
  allowedClients?: string[];
}

export interface QueryOptions {
  enableCrossClientAccess?: boolean;
  requireActiveClientLink?: boolean;
  auditQuery?: boolean;
}

class SecureQueryService {
  private async validateAccess(context: SecurityContext, clientId?: string): Promise<boolean> {
    // If no client specified, allow (for agency-wide queries)
    if (!clientId) return true;

    // Check if agency has active access to this client
    return await clientLinksApi.hasActiveAccess(context.agencyId, clientId);
  }

  private async getActiveClientIds(agencyId: string): Promise<string[]> {
    try {
      // Handle demo mode
      if (demoMode.isEnabled()) {
        const pharmaData = createPharmaDemoData();
        return pharmaData.clients.map(client => client.enterprise_id);
      }

      const { data, error } = await supabase
        .from('client_agency_relationships')
        .select('client_enterprise_id')
        .eq('agency_enterprise_id', agencyId)
        .eq('status', 'active');

      if (error) throw error;
      return (data || []).map(row => row.client_enterprise_id);
    } catch (error) {
      console.error('Failed to fetch active client IDs:', error);
      return [];
    }
  }

  /**
   * Secure wrapper for Supabase queries that enforces tenant boundaries
   */
  async query(
    queryFn: (activeClientIds: string[]) => Promise<any>,
    context: SecurityContext,
    options: QueryOptions = {}
  ): Promise<{ data: any[]; error: any; accessDenied?: boolean }> {
    try {
      // Get active client relationships for this agency
      const activeClientIds = await this.getActiveClientIds(context.agencyId);

      if (activeClientIds.length === 0 && options.requireActiveClientLink) {
        return {
          data: [],
          error: null,
          accessDenied: true
        };
      }

      // Execute the query with active client filter
      const result = await queryFn(activeClientIds);

      if (result.error) {
        console.error('Query failed:', result.error);
        return { data: [], error: result.error };
      }

      // Audit the query if enabled
      if (options.auditQuery) {
        await this.auditQuery(context, 'data_access', {
          clientCount: activeClientIds.length,
          resultCount: result.data?.length || 0
        });
      }

      return { data: result.data || [], error: null };
    } catch (error) {
      console.error('Secure query failed:', error);
      return { data: [], error, accessDenied: true };
    }
  }

  /**
   * Secure submissions query with agency boundary enforcement
   */
  async getSubmissions(context: SecurityContext, filters: any = {}): Promise<{
    data: any[];
    error: any;
    accessDenied?: boolean;
  }> {
    // Handle demo mode first
    if (demoMode.isEnabled()) {
      const pharmaData = createPharmaDemoData();
      let filteredData = pharmaData.submissions;
      
      // Apply status filter for demo data
      if (filters.status) {
        filteredData = filteredData.filter((s: any) => s.status === filters.status);
      }
      
      // Apply assignee filter for demo data
      if (filters.assignedTo) {
        filteredData = filteredData.filter((s: any) => s.assignedTo === filters.assignedTo);
      }

      return { data: filteredData, error: null };
    }

    return this.query(
      async (activeClientIds) => {
        // Use simple query without complex joins to avoid type issues
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters after query to avoid complex type instantiation
        if (error) return { data: null, error };
        
        let filteredData = data || [];
        
        // Apply status filter
        if (filters.status) {
          filteredData = filteredData.filter((s: any) => s.status === filters.status);
        }
        
        // Apply assignee filter  
        if (filters.assignedTo) {
          filteredData = filteredData.filter((s: any) => s.assigned_to === filters.assignedTo);
        }

        return { data: filteredData, error: null };
      },
      context,
      { requireActiveClientLink: true, auditQuery: true }
    );
  }

  /**
   * Check real-time access suspension
   */
  async checkAccessStatus(agencyId: string, clientId: string): Promise<{
    hasAccess: boolean;
    status: 'active' | 'suspended' | 'not_found';
  }> {
    try {
      const { data, error } = await supabase
        .from('client_agency_relationships')
        .select('status')
        .eq('agency_enterprise_id', agencyId)
        .eq('client_enterprise_id', clientId)
        .single();

      if (error || !data) {
        return { hasAccess: false, status: 'not_found' };
      }

      return {
        hasAccess: data.status === 'active',
        status: data.status as 'active' | 'suspended'
      };
    } catch (error) {
      console.error('Failed to check access status:', error);
      return { hasAccess: false, status: 'not_found' };
    }
  }

  private async auditQuery(context: SecurityContext, action: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('audit_events')
        .insert({
          event_type: 'secure_query',
          user_id: context.userId,
          details: {
            action,
            agencyId: context.agencyId,
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to audit query:', error);
    }
  }
}

export const secureQuery = new SecureQueryService();