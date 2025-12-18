import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PlatformConfigRow = Database['public']['Tables']['platform_configurations']['Row'];
type PlatformConfigInsert = Database['public']['Tables']['platform_configurations']['Insert'];
type IntegrationLogRow = Database['public']['Tables']['platform_integration_logs']['Row'];
type IntegrationLogInsert = Database['public']['Tables']['platform_integration_logs']['Insert'];

export interface CreatePlatformConfigInput {
  platform_type: string;
  platform_name: string;
  auth_method: string;
  credentials?: Record<string, any>;
  endpoint_url?: string;
  metadata?: Record<string, any>;
  auto_sync_enabled?: boolean;
  sync_schedule?: Record<string, any>;
}

export interface UpdatePlatformConfigInput {
  platform_name?: string;
  auth_method?: string;
  credentials?: Record<string, any>;
  endpoint_url?: string;
  metadata?: Record<string, any>;
  status?: string;
  auto_sync_enabled?: boolean;
  sync_schedule?: Record<string, any>;
}

export const platformIntegrationsApi = {
  /**
   * List all platform configurations for the user's enterprise
   */
  async listConfigurations(): Promise<PlatformConfigRow[]> {
    const { data, error } = await supabase
      .from('platform_configurations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new platform configuration
   */
  async createConfiguration(input: CreatePlatformConfigInput): Promise<PlatformConfigRow> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's enterprise_id from enterprise_members
    const { data: membership } = await supabase
      .from('enterprise_members')
      .select('enterprise_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) throw new Error('User not associated with an enterprise');

    const insertData: PlatformConfigInsert = {
      enterprise_id: membership.enterprise_id,
      platform_type: input.platform_type,
      platform_name: input.platform_name,
      auth_method: input.auth_method,
      credentials: input.credentials || {},
      endpoint_url: input.endpoint_url,
      metadata: input.metadata,
      auto_sync_enabled: input.auto_sync_enabled,
      sync_schedule: input.sync_schedule,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('platform_configurations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing platform configuration
   */
  async updateConfiguration(
    id: string,
    input: UpdatePlatformConfigInput
  ): Promise<PlatformConfigRow> {
    const { data, error } = await supabase
      .from('platform_configurations')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a platform configuration
   */
  async deleteConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('platform_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Test connection to a platform
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('platform-manager', {
      body: { action: 'test', config_id: id }
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get all integration logs
   */
  async getIntegrationLogs(limit: number = 50): Promise<IntegrationLogRow[]> {
    const { data, error } = await supabase
      .from('platform_integration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get logs for a specific platform configuration
   */
  async getLogsByConfig(configId: string, limit: number = 50): Promise<IntegrationLogRow[]> {
    const { data, error } = await supabase
      .from('platform_integration_logs')
      .select('*')
      .eq('platform_config_id', configId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create an integration log entry
   */
  async createIntegrationLog(
    configId: string,
    operationType: string,
    status: string,
    platformType: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<IntegrationLogRow> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user's enterprise_id
    const { data: membership } = await supabase
      .from('enterprise_members')
      .select('enterprise_id')
      .eq('user_id', user?.id || '')
      .single();

    if (!membership) throw new Error('User not associated with an enterprise');

    const logData: IntegrationLogInsert = {
      platform_config_id: configId,
      operation_type: operationType,
      status,
      platform_type: platformType,
      error_message: errorMessage,
      metadata,
      enterprise_id: membership.enterprise_id,
      triggered_by: user?.id
    };

    const { data, error } = await supabase
      .from('platform_integration_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Trigger a sync operation
   */
  async triggerSync(id: string, platformType: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('platform-universal', {
      body: {
        config_id: id,
        sync_type: 'incremental'
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to trigger sync');
    }

    return data;
  }
};
