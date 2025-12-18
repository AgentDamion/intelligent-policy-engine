import { useEffect, useRef, useState, useCallback } from 'react';
import { dashboardCache } from '@/utils/dashboardCache';
import { monitoring } from '@/utils/monitoring';

interface CachedDataHookOptions {
  key: string;
  fetcher: () => Promise<any>;
  ttl?: number;
  enabled?: boolean;
  dependencies?: any[];
}

export const useCachedData = <T,>({
  key,
  fetcher,
  ttl = 5 * 60 * 1000, // 5 minutes default
  enabled = true,
  dependencies = []
}: CachedDataHookOptions) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cachedData = dashboardCache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const result = await fetcher();
      const duration = performance.now() - startTime;

      // Cache the result
      dashboardCache.set(key, result, ttl);
      setData(result);

      monitoring.info(`Data fetched and cached: ${key}`, {
        duration: Math.round(duration),
        cacheKey: key,
        ttl
      }, 'cache');

      return result;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        monitoring.error(`Failed to fetch data: ${key}`, err, 'cache');
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, enabled, ...dependencies]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const invalidate = useCallback(() => {
    dashboardCache.invalidate(key);
    fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate,
    isStale: !dashboardCache.has(key)
  };
};

export default useCachedData;