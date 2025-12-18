/**
 * Platform Document Sync Tracker
 * Manages tracking of individual document syncs to external platforms
 */

export interface SyncTracker {
  recordSyncStart(params: {
    platform_config_id: string;
    document_type: 'submission' | 'policy' | 'policy_version' | 'evidence';
    document_id: string;
  }): Promise<string>; // Returns sync record ID

  recordSyncSuccess(params: {
    sync_id: string;
    platform_document_id: string;
    platform_url?: string;
    metadata?: any;
  }): Promise<void>;

  recordSyncFailure(params: {
    sync_id: string;
    error: string;
    retry_count?: number;
  }): Promise<void>;

  getSyncStatus(params: {
    platform_config_id: string;
    document_id: string;
  }): Promise<any>;
}

export function createSyncTracker(supabase: any): SyncTracker {
  return {
    async recordSyncStart({ platform_config_id, document_type, document_id }) {
      const { data, error } = await supabase
        .from('platform_document_syncs')
        .insert({
          platform_config_id,
          document_type,
          document_id,
          sync_status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },

    async recordSyncSuccess({ sync_id, platform_document_id, platform_url, metadata }) {
      const { error } = await supabase
        .from('platform_document_syncs')
        .update({
          sync_status: 'completed',
          platform_document_id,
          platform_url,
          synced_at: new Date().toISOString(),
          metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', sync_id);

      if (error) throw error;
    },

    async recordSyncFailure({ sync_id, error, retry_count = 0 }) {
      const { error: updateError } = await supabase
        .from('platform_document_syncs')
        .update({
          sync_status: 'failed',
          sync_error: error,
          retry_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', sync_id);

      if (updateError) throw updateError;
    },

    async getSyncStatus({ platform_config_id, document_id }) {
      const { data, error } = await supabase
        .from('platform_document_syncs')
        .select('*')
        .eq('platform_config_id', platform_config_id)
        .eq('document_id', document_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  };
}
