import React, { createContext, useContext, useEffect, useState } from 'react';

interface PerformanceContextType {
  metrics: PerformanceMetrics | null;
  routeHistory: RoutePerformanceEntry[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearHistory: () => void;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  routeChangeTime: number;
}

interface RoutePerformanceEntry {
  route: string;
  loadTime: number;
  timestamp: number;
  strategy?: string;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [routeHistory, setRouteHistory] = useState<RoutePerformanceEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load existing route history
    const savedHistory = JSON.parse(sessionStorage.getItem('routePerformance') || '[]');
    setRouteHistory(savedHistory);

    // Initial metrics collection
    collectMetrics();

    // Listen for route changes
    const handleRouteChange = () => {
      setTimeout(collectMetrics, 100);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

  const collectMetrics = () => {
    if (!('performance' in window)) return;

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      const newMetrics: PerformanceMetrics = {
        pageLoadTime,
        firstContentfulPaint: fcp,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        routeChangeTime: 0
      };

      // Collect Web Vitals
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              setMetrics(prev => prev ? { ...prev, largestContentfulPaint: entry.startTime } : null);
            }
            if (entry.entryType === 'layout-shift') {
              const layoutShiftEntry = entry as any;
              if (!layoutShiftEntry.hadRecentInput) {
                setMetrics(prev => prev ? { ...prev, cumulativeLayoutShift: prev.cumulativeLayoutShift + layoutShiftEntry.value } : null);
              }
            }
          }
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
        } catch (error) {
          console.warn('Performance observer not supported:', error);
        }
      }

      setMetrics(newMetrics);
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  };

  const startMonitoring = () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    const interval = setInterval(() => {
      collectMetrics();
      
      // Update route history from session storage
      const updatedHistory = JSON.parse(sessionStorage.getItem('routePerformance') || '[]');
      setRouteHistory(updatedHistory);
    }, 2000);
    
    setMonitoringInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
  };

  const clearHistory = () => {
    setRouteHistory([]);
    sessionStorage.removeItem('routePerformance');
  };

  const value: PerformanceContextType = {
    metrics,
    routeHistory,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearHistory
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};