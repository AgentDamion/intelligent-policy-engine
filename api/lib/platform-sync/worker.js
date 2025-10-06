// Platform Sync Worker
// Processes queued sync jobs

import { supabaseAdmin } from '../platform-db.js';
import { createPlatformClient } from '../platform-clients/veeva-client.js';

export class SyncWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  async processJob(job) {
    console.log(`Processing sync job: ${job.id}`);
    
    try {
      // Get platform configuration
      const { data: config, error: configError } = await supabaseAdmin
        .from('platform_configurations')
        .select('*')
        .eq('id', job.platformConfigId)
        .eq('enterprise_id', job.enterpriseId)
        .single();

      if (configError || !config) {
        console.error('Platform config not found:', configError);
        return;
      }

      // Create platform client
      const client = createPlatformClient(config.platform_type, config.auth_config);

      // Create log entry
      const { data: logEntry, error: logError } = await supabaseAdmin
        .from('platform_integration_logs')
        .insert({
          enterprise_id: job.enterpriseId,
          platform_config_id: job.platformConfigId,
          submission_id: job.submissionId,
          sync_type: job.syncType,
          status: 'pending'
        })
        .select()
        .single();

      if (logError) {
        console.error('Failed to create log entry:', logError);
        return;
      }

      // Process the sync
      let result;
      if (job.syncType === 'test') {
        result = await client.testConnection();
      } else {
        result = await client.uploadMetadata({
          submissionId: job.submissionId,
          fileName: job.fileName,
          metadata: job.metadata || {}
        });
      }

      // Update log entry with success
      await supabaseAdmin
        .from('platform_integration_logs')
        .update({
          status: 'success',
          external_id: result.externalId || null
        })
        .eq('id', logEntry.id);

      // Update platform config last sync time
      await supabaseAdmin
        .from('platform_configurations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', config.id);

      console.log(`Sync job completed successfully: ${job.id}`);

    } catch (error) {
      console.error(`Sync job failed: ${job.id}`, error);
      
      // Update log entry with failure
      await supabaseAdmin
        .from('platform_integration_logs')
        .update({
          status: 'failed',
          error_message: error.message || 'Sync failed'
        })
        .eq('platform_config_id', job.platformConfigId)
        .eq('submission_id', job.submissionId)
        .eq('sync_type', job.syncType)
        .order('created_at', { ascending: false })
        .limit(1);
    }
  }

  async processNextJob() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    try {
      const { syncQueue } = await import('./queue.js');
      const job = syncQueue.dequeue();
      
      if (job) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Worker error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(intervalMs = 5000) {
    if (this.intervalId) {
      console.log('Worker already running');
      return;
    }

    console.log('Starting sync worker...');
    this.intervalId = setInterval(() => {
      this.processNextJob();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Sync worker stopped');
    }
  }

  // Process one job immediately (for testing or manual triggers)
  async runOnce() {
    await this.processNextJob();
  }
}

// Global worker instance
export const syncWorker = new SyncWorker();