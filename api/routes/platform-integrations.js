// Platform Integration API Routes
// Express.js routes for platform management

import express from 'express';
import { supabaseAdmin, requireEnterpriseId, getUserId } from '../lib/platform-db.js';
import { syncQueue } from '../lib/platform-sync/queue.js';
import { syncWorker } from '../lib/platform-sync/worker.js';
import { createPlatformClient } from '../lib/platform-clients/veeva-client.js';

const router = express.Router();

// ===== PLATFORM CONFIGURATIONS =====

// GET /api/platform-integrations/configs
router.get('/configs', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    
    const { data, error } = await supabaseAdmin
      .from('platform_configurations')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ items: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/platform-integrations/configs
router.post('/configs', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const userId = getUserId(req);
    const { name, platform_type, auth_config, sync_settings } = req.body;

    // Validate required fields
    if (!name || !platform_type || !auth_config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .from('platform_configurations')
      .insert({
        enterprise_id: enterpriseId,
        name,
        platform_type,
        auth_config,
        sync_settings: sync_settings || {},
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ item: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/platform-integrations/configs/:id
router.put('/configs/:id', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.enterprise_id;
    delete updates.created_at;
    delete updates.created_by;

    const { data, error } = await supabaseAdmin
      .from('platform_configurations')
      .update(updates)
      .eq('id', id)
      .eq('enterprise_id', enterpriseId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ item: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/platform-integrations/configs/:id
router.delete('/configs/:id', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('platform_configurations')
      .delete()
      .eq('id', id)
      .eq('enterprise_id', enterpriseId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== CONNECTION TESTING =====

// POST /api/platform-integrations/configs/:id/test
router.post('/configs/:id/test', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const { id } = req.params;

    // Get platform configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('platform_configurations')
      .select('*')
      .eq('id', id)
      .eq('enterprise_id', enterpriseId)
      .single();

    if (configError || !config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Create platform client and test connection
    const client = createPlatformClient(config.platform_type, config.auth_config);
    const result = await client.testConnection();

    // Log the test result
    await supabaseAdmin
      .from('platform_integration_logs')
      .insert({
        enterprise_id: enterpriseId,
        platform_config_id: id,
        sync_type: 'test',
        status: result.ok ? 'success' : 'failed',
        error_message: result.ok ? null : (result.message || 'Connection failed')
      });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== INTEGRATION LOGS =====

// GET /api/platform-integrations/logs
router.get('/logs', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const { from, to, platform, status, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('platform_integration_logs')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (platform) query = query.eq('platform_config_id', platform);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ items: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== SYNC OPERATIONS =====

// POST /api/platform-integrations/sync
router.post('/sync', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const { submissionId, platformIds, syncType = 'metadata_update', metadata } = req.body;

    if (!submissionId || !platformIds || !Array.isArray(platformIds)) {
      return res.status(400).json({ error: 'Missing submissionId or platformIds' });
    }

    // Queue sync jobs for each platform
    const queuedJobs = [];
    for (const platformId of platformIds) {
      const job = {
        enterpriseId,
        platformConfigId: platformId,
        submissionId,
        syncType,
        metadata
      };
      syncQueue.enqueue(job);
      queuedJobs.push(job);
    }

    // Process one job immediately (simple approach)
    await syncWorker.runOnce();

    res.json({ 
      success: true, 
      queued: queuedJobs.length,
      queueSize: syncQueue.size()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/platform-integrations/logs/:id/retry
router.post('/logs/:id/retry', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);
    const { id } = req.params;

    // Get the log entry
    const { data: log, error: logError } = await supabaseAdmin
      .from('platform_integration_logs')
      .select('*')
      .eq('id', id)
      .eq('enterprise_id', enterpriseId)
      .single();

    if (logError || !log) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    // Queue retry job
    const job = {
      enterpriseId,
      platformConfigId: log.platform_config_id,
      submissionId: log.submission_id,
      syncType: log.sync_type
    };
    syncQueue.enqueue(job);

    // Process immediately
    await syncWorker.runOnce();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== HEALTH MONITORING =====

// GET /api/platform-integrations/health
router.get('/health', async (req, res) => {
  try {
    const enterpriseId = requireEnterpriseId(req);

    // Get platform configurations with status
    const { data: configs } = await supabaseAdmin
      .from('platform_configurations')
      .select('id, name, platform_type, last_sync_at, status')
      .eq('enterprise_id', enterpriseId);

    // Get recent logs for statistics
    const { data: logs } = await supabaseAdmin
      .from('platform_integration_logs')
      .select('platform_config_id, status, created_at')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    // Calculate statistics per platform
    const platformStats = new Map();
    
    (configs || []).forEach(config => {
      platformStats.set(config.id, {
        ...config,
        filesThisMonth: 0,
        successRate: 0,
        lastError: null
      });
    });

    // Count successful syncs this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    (logs || []).forEach(log => {
      const platform = platformStats.get(log.platform_config_id);
      if (platform) {
        if (new Date(log.created_at) >= startOfMonth && log.status === 'success') {
          platform.filesThisMonth++;
        }
        if (log.status === 'failed' && !platform.lastError) {
          platform.lastError = log.created_at;
        }
      }
    });

    // Calculate success rates
    platformStats.forEach(platform => {
      const platformLogs = logs?.filter(log => log.platform_config_id === platform.id) || [];
      const successCount = platformLogs.filter(log => log.status === 'success').length;
      const totalCount = platformLogs.length;
      platform.successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    });

    res.json({ 
      items: Array.from(platformStats.values()),
      queueStatus: syncQueue.getStatus()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;