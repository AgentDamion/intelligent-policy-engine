// Platform Integration Approval Hook
// Call this when approvals happen to trigger platform syncs

import { syncQueue } from './queue.js';
import { syncWorker } from './worker.js';

/**
 * Trigger platform sync when a submission is approved
 * @param {Object} params - Approval parameters
 * @param {string} params.submissionId - ID of the approved submission
 * @param {string} params.enterpriseId - Enterprise ID
 * @param {string} params.approvedBy - User who approved
 * @param {Object} params.metadata - Additional metadata to sync
 */
export async function triggerApprovalSync({ submissionId, enterpriseId, approvedBy, metadata = {} }) {
  try {
    console.log(`Triggering platform sync for approved submission: ${submissionId}`);
    
    // Get active platform configurations for this enterprise
    const { supabaseAdmin } = await import('../platform-db.js');
    
    const { data: activeConfigs, error } = await supabaseAdmin
      .from('platform_configurations')
      .select('id, name, platform_type, sync_settings')
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'active')
      .eq('sync_settings->>sync_on_approval', 'true');

    if (error) {
      console.error('Failed to fetch active platform configs:', error);
      return;
    }

    if (!activeConfigs || activeConfigs.length === 0) {
      console.log('No platforms configured for approval sync');
      return;
    }

    // Queue sync jobs for each active platform
    const platformIds = activeConfigs.map(config => config.id);
    
    for (const platformId of platformIds) {
      const job = {
        enterpriseId,
        platformConfigId: platformId,
        submissionId,
        syncType: 'metadata_update',
        metadata: {
          ...metadata,
          approvedBy,
          approvedAt: new Date().toISOString(),
          trigger: 'approval'
        }
      };
      
      syncQueue.enqueue(job);
    }

    // Process one job immediately
    await syncWorker.runOnce();

    console.log(`Queued ${platformIds.length} platform sync jobs for submission ${submissionId}`);
    
    return {
      success: true,
      queuedJobs: platformIds.length,
      platforms: activeConfigs.map(config => ({
        id: config.id,
        name: config.name,
        platform_type: config.platform_type
      }))
    };

  } catch (error) {
    console.error('Failed to trigger approval sync:', error);
    throw error;
  }
}

/**
 * Trigger platform sync when a submission is submitted (if configured)
 * @param {Object} params - Submission parameters
 * @param {string} params.submissionId - ID of the submitted item
 * @param {string} params.enterpriseId - Enterprise ID
 * @param {string} params.submittedBy - User who submitted
 * @param {Object} params.metadata - Additional metadata to sync
 */
export async function triggerSubmissionSync({ submissionId, enterpriseId, submittedBy, metadata = {} }) {
  try {
    console.log(`Triggering platform sync for submitted item: ${submissionId}`);
    
    // Get active platform configurations for this enterprise
    const { supabaseAdmin } = await import('../platform-db.js');
    
    const { data: activeConfigs, error } = await supabaseAdmin
      .from('platform_configurations')
      .select('id, name, platform_type, sync_settings')
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'active')
      .eq('sync_settings->>sync_on_submission', 'true');

    if (error) {
      console.error('Failed to fetch active platform configs:', error);
      return;
    }

    if (!activeConfigs || activeConfigs.length === 0) {
      console.log('No platforms configured for submission sync');
      return;
    }

    // Queue sync jobs for each active platform
    const platformIds = activeConfigs.map(config => config.id);
    
    for (const platformId of platformIds) {
      const job = {
        enterpriseId,
        platformConfigId: platformId,
        submissionId,
        syncType: 'metadata_update',
        metadata: {
          ...metadata,
          submittedBy,
          submittedAt: new Date().toISOString(),
          trigger: 'submission'
        }
      };
      
      syncQueue.enqueue(job);
    }

    // Process one job immediately
    await syncWorker.runOnce();

    console.log(`Queued ${platformIds.length} platform sync jobs for submission ${submissionId}`);
    
    return {
      success: true,
      queuedJobs: platformIds.length,
      platforms: activeConfigs.map(config => ({
        id: config.id,
        name: config.name,
        platform_type: config.platform_type
      }))
    };

  } catch (error) {
    console.error('Failed to trigger submission sync:', error);
    throw error;
  }
}