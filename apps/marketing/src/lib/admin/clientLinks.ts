import { supabase } from '@/integrations/supabase/client';
import type { ClientLink } from '@/pages/agency/admin/ClientLinking';

export interface ClientLinkCreateRequest {
  agencyId: string;
  clientId: string;
}

export interface ClientLinkUpdateRequest {
  status?: 'active' | 'suspended';
}

class ClientLinksApi {
  async list(): Promise<ClientLink[]> {
    try {
      // This would query the actual client_agency_relationships table
      // For now, return mock data
      const mockLinks: ClientLink[] = [
        {
          id: '1',
          agencyId: 'agency-1',
          agencyName: 'Digital Health Agency',
          clientId: 'client-1',
          clientName: 'Acme Pharmaceuticals',
          status: 'active',
          submissionCount: 45,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          agencyId: 'agency-1',
          agencyName: 'Digital Health Agency',
          clientId: 'client-2',
          clientName: 'Global Health Corp',
          status: 'active',
          submissionCount: 23,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          agencyId: 'agency-1',
          agencyName: 'Digital Health Agency',
          clientId: 'client-3',
          clientName: 'BioTech Solutions',
          status: 'suspended',
          submissionCount: 8,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return mockLinks;
    } catch (error) {
      console.error('Failed to fetch client links:', error);
      throw error;
    }
  }

  async create(request: ClientLinkCreateRequest): Promise<ClientLink> {
    try {
      // This would insert into client_agency_relationships table
      const newLink: ClientLink = {
        id: Date.now().toString(),
        agencyId: request.agencyId,
        agencyName: 'Agency Name', // Would be fetched
        clientId: request.clientId,
        clientName: 'Client Name', // Would be fetched
        status: 'active',
        submissionCount: 0,
        createdAt: new Date().toISOString()
      };

      // Record audit event
      await this.recordAuditEvent('client_link_created', {
        agencyId: request.agencyId,
        clientId: request.clientId,
        linkId: newLink.id
      });

      return newLink;
    } catch (error) {
      console.error('Failed to create client link:', error);
      throw error;
    }
  }

  async update(linkId: string, updates: ClientLinkUpdateRequest): Promise<void> {
    try {
      // This would update the client_agency_relationships table
      console.log('Updating client link', linkId, 'with', updates);

      // Record audit event
      await this.recordAuditEvent('client_link_updated', {
        linkId,
        changes: updates
      });
    } catch (error) {
      console.error('Failed to update client link:', error);
      throw error;
    }
  }

  private async recordAuditEvent(eventType: string, details: any): Promise<void> {
    try {
      await supabase
        .from('audit_events')
        .insert({
          event_type: eventType,
          entity_type: 'client_link',
          entity_id: details.linkId || details.agencyId,
          details
        });
    } catch (error) {
      console.error('Failed to record audit event:', error);
    }
  }

  /**
   * Check if an agency has active access to a client
   * This is used by the security layer to enforce data boundaries
   */
  async hasActiveAccess(agencyId: string, clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('client_agency_relationships')
        .select('status')
        .eq('agency_enterprise_id', agencyId)
        .eq('client_enterprise_id', clientId)
        .eq('status', 'active')
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error('Failed to check access:', error);
      return false;
    }
  }
}

export const clientLinksApi = new ClientLinksApi();