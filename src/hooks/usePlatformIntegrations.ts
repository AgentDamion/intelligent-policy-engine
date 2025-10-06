// Platform Integration React Hook
// Unified hook for platform management

import { useCallback, useEffect, useMemo, useState } from 'react';
import { platformApi, PlatformConfig, IntegrationLog, PlatformHealth, SyncJob, LogFilters } from '../services/platform-integrations';

export function usePlatformIntegrations(enterpriseId: string) {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [health, setHealth] = useState<PlatformHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refresh functions
  const refreshConfigs = useCallback(async () => {
    try {
      const { items } = await platformApi.listConfigs(enterpriseId);
      setConfigs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    }
  }, [enterpriseId]);

  const refreshLogs = useCallback(async (filters?: LogFilters) => {
    try {
      const { items } = await platformApi.listLogs(enterpriseId, filters);
      setLogs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    }
  }, [enterpriseId]);

  const refreshHealth = useCallback(async () => {
    try {
      const { items } = await platformApi.getHealth(enterpriseId);
      setHealth(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    }
  }, [enterpriseId]);

  // Configuration management
  const createConfig = useCallback(async (config: Partial<PlatformConfig> & { auth_config: any }) => {
    setLoading(true);
    setError(null);
    try {
      await platformApi.createConfig(enterpriseId, config);
      await refreshConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, refreshConfigs]);

  const updateConfig = useCallback(async (id: string, updates: Partial<PlatformConfig>) => {
    setLoading(true);
    setError(null);
    try {
      await platformApi.updateConfig(enterpriseId, id, updates);
      await refreshConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, refreshConfigs]);

  const deleteConfig = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await platformApi.deleteConfig(enterpriseId, id);
      await refreshConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, refreshConfigs]);

  const testConfig = useCallback(async (id: string) => {
    setTesting(id);
    setError(null);
    try {
      const result = await platformApi.testConfig(enterpriseId, id);
      await refreshLogs(); // Refresh logs to show test result
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
      throw err;
    } finally {
      setTesting(null);
    }
  }, [enterpriseId, refreshLogs]);

  // Sync operations
  const triggerSync = useCallback(async (job: SyncJob) => {
    setLoading(true);
    setError(null);
    try {
      const result = await platformApi.triggerSync(enterpriseId, job);
      await refreshLogs();
      await refreshHealth();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, refreshLogs, refreshHealth]);

  const retryLog = useCallback(async (logId: string) => {
    setLoading(true);
    setError(null);
    try {
      await platformApi.retryLog(enterpriseId, logId);
      await refreshLogs();
      await refreshHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, refreshLogs, refreshHealth]);

  // Computed values
  const activeConfigs = useMemo(() => 
    configs.filter(config => config.status === 'active'), 
    [configs]
  );

  const configsByType = useMemo(() => {
    const grouped: Record<string, PlatformConfig[]> = {};
    configs.forEach(config => {
      if (!grouped[config.platform_type]) {
        grouped[config.platform_type] = [];
      }
      grouped[config.platform_type].push(config);
    });
    return grouped;
  }, [configs]);

  const recentLogs = useMemo(() => 
    logs.slice(0, 10), 
    [logs]
  );

  const failedLogs = useMemo(() => 
    logs.filter(log => log.status === 'failed'), 
    [logs]
  );

  // Auto-refresh on mount
  useEffect(() => {
    if (enterpriseId) {
      refreshConfigs();
      refreshLogs();
      refreshHealth();
    }
  }, [enterpriseId, refreshConfigs, refreshLogs, refreshHealth]);

  return {
    // Data
    configs,
    logs,
    health,
    activeConfigs,
    configsByType,
    recentLogs,
    failedLogs,
    
    // State
    loading,
    testing,
    error,
    
    // Actions
    refreshConfigs,
    refreshLogs,
    refreshHealth,
    createConfig,
    updateConfig,
    deleteConfig,
    testConfig,
    triggerSync,
    retryLog,
    
    // Utilities
    clearError: () => setError(null),
  };
}