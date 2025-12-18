import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';
import { dashboardCache } from '@/utils/dashboardCache';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCalls: number;
  cacheHits: number;
  errors: number;
}

export const useDashboardPerformance = (dashboardType: 'enterprise' | 'agency') => {
  const startTime = useCallback(() => performance.now(), []);
  
  const trackLoadTime = useCallback(async (loadStart: number, metadata?: any) => {
    const loadTime = Math.round(performance.now() - loadStart);
    
    try {
      // Log to Supabase for analytics
      await supabase.rpc('log_dashboard_performance', {
        dashboard_type: dashboardType,
        load_time_ms: loadTime,
        metadata: metadata || {}
      });
      
      // Log to monitoring
      monitoring.info(`Dashboard loaded`, {
        type: dashboardType,
        loadTimeMs: loadTime,
        ...metadata
      }, 'performance');
      
    } catch (error) {
      monitoring.error('Failed to log performance metrics', error, 'performance');
    }
  }, [dashboardType]);

  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    monitoring.trackApiCall(endpoint, 'GET', success ? 200 : 500, duration);
  }, []);

  const trackCacheUsage = useCallback(() => {
    const stats = dashboardCache.getStats();
    monitoring.info('Cache statistics', stats, 'cache');
    return stats;
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const cacheStats = dashboardCache.getStats();
    
    return {
      loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
      renderTime: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : 0,
      apiCalls: performance.getEntriesByType('resource').filter(r => r.name.includes('supabase')).length,
      cacheHits: cacheStats.activeEntries,
      errors: 0 // Would need error tracking integration
    };
  }, []);

  // Track Core Web Vitals
  const trackWebVitals = useCallback(() => {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      monitoring.info('LCP recorded', { 
        value: lastEntry.startTime,
        dashboardType 
      }, 'web-vitals');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0] as any;
      monitoring.info('FID recorded', { 
        value: firstInput.processingStart - firstInput.startTime,
        dashboardType 
      }, 'web-vitals');
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      monitoring.info('CLS recorded', { 
        value: clsValue,
        dashboardType 
      }, 'web-vitals');
    }).observe({ entryTypes: ['layout-shift'] });
  }, [dashboardType]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackWebVitals();
    }
  }, [trackWebVitals]);

  return {
    startTime,
    trackLoadTime,
    trackApiCall,
    trackCacheUsage,
    getMetrics,
    trackWebVitals
  };
};

export default useDashboardPerformance;