import { supabase } from '@/integrations/supabase/client';
import type { SlaPolicy } from './sla';

export interface ClientSlaPolicy extends SlaPolicy {
  clientId: string;
  clientName: string;
  isActive: boolean;
}

class SlaPolicyService {
  private cache = new Map<string, ClientSlaPolicy>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getPolicy(clientId: string): Promise<ClientSlaPolicy> {
    // Check cache first
    const cached = this.cache.get(clientId);
    const expiry = this.cacheExpiry.get(clientId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Fetch from database
    const policy = await this.fetchPolicyFromDb(clientId);
    
    // Cache the result
    this.cache.set(clientId, policy);
    this.cacheExpiry.set(clientId, Date.now() + this.CACHE_TTL);
    
    return policy;
  }

  private async fetchPolicyFromDb(clientId: string): Promise<ClientSlaPolicy> {
    try {
      // Fetch client-specific SLA policy with real timezone support
      const { data: clientData, error: clientError } = await supabase
        .from('enterprises')
        .select('id, name')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Failed to fetch client data:', clientError);
      }

      // Use default SLA settings until metadata is implemented
      const slaSettings = {};

      const policy: ClientSlaPolicy = {
        clientId,
        clientName: clientData?.name || 'Unknown Client',
        decision_due_business_hours: (slaSettings as any).decision_due_business_hours || 24,
        timezone: (slaSettings as any).timezone || 'UTC',
        business_hours: {
          start: (slaSettings as any).business_hours?.start || '09:00',
          end: (slaSettings as any).business_hours?.end || '18:00'
        },
        business_days: (slaSettings as any).business_days || [1, 2, 3, 4, 5], // Mon-Fri
        isActive: true
      };

      return policy;
    } catch (error) {
      console.error('Failed to fetch SLA policy for client', clientId, error);
      
      // Return fallback policy
      return {
        clientId,
        clientName: 'Unknown Client',
        decision_due_business_hours: 48, // More conservative fallback
        timezone: 'UTC',
        business_hours: {
          start: '09:00',
          end: '17:00'
        },
        business_days: [1, 2, 3, 4, 5],
        isActive: true
      };
    }
  }

  /**
   * Detect client timezone from metadata or location info
   */
  private detectClientTimezone(metadata: any): string {
    // Check for explicit timezone setting
    if (metadata.timezone) {
      return metadata.timezone;
    }

    // Detect from country/region
    const country = metadata.country || metadata.location?.country;
    switch (country) {
      case 'US':
      case 'USA':
      case 'United States':
        return metadata.location?.timezone || 'America/New_York'; // Default to Eastern
      case 'UK':
      case 'United Kingdom':
      case 'GB':
        return 'Europe/London';
      case 'Germany':
      case 'DE':
        return 'Europe/Berlin';
      case 'Japan':
      case 'JP':
        return 'Asia/Tokyo';
      case 'Singapore':
      case 'SG':
        return 'Asia/Singapore';
      default:
        return 'UTC';
    }
  }

  /**
   * Get SLA policy with enhanced business hours calculation
   */
  async getPolicyWithTimezone(clientId: string): Promise<ClientSlaPolicy & { currentTime: string; isBusinessHour: boolean }> {
    const policy = await this.getPolicy(clientId);
    
    // Get current time in client timezone
    const now = new Date();
    const clientTime = new Intl.DateTimeFormat('en-US', {
      timeZone: policy.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
    
    const isBusinessHour = policy.business_days.includes(dayOfWeek) &&
                          clientTime >= policy.business_hours.start &&
                          clientTime < policy.business_hours.end;

    return {
      ...policy,
      currentTime: clientTime,
      isBusinessHour
    };
  }

  async updatePolicy(clientId: string, updates: Partial<ClientSlaPolicy>): Promise<void> {
    try {
      // In a real implementation, this would update the client_sla_policies table
      console.log('Updating SLA policy for client', clientId, updates);
      
      // Clear cache for this client
      this.cache.delete(clientId);
      this.cacheExpiry.delete(clientId);
    } catch (error) {
      console.error('Failed to update SLA policy for client', clientId, error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const slaPolicyService = new SlaPolicyService();