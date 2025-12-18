import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  interactionToNextPaint: number;
  memoryUsage?: number;
  routeChangeTime: number;
}

interface RoutePerformance {
  route: string;
  loadTime: number;
  score: number;
  issues: string[];
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    collectPerformanceMetrics();
    loadRoutePerformanceHistory();
    
    // Monitor route changes
    const handleRouteChange = () => {
      setTimeout(collectPerformanceMetrics, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const collectPerformanceMetrics = () => {
    if (!('performance' in window)) return;

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      // Get route performance data
      const routeHistory = JSON.parse(sessionStorage.getItem('routePerformance') || '[]');
      
      // Collect Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => prev ? { ...prev, largestContentfulPaint: entry.startTime } : null);
          }
          if (entry.entryType === 'layout-shift') {
            const layoutShiftEntry = entry as any;
            if (!layoutShiftEntry.hadRecentInput) {
              setMetrics(prev => prev ? { ...prev, cumulativeLayoutShift: layoutShiftEntry.value } : null);
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
      
      const newMetrics: PerformanceMetrics = {
        pageLoadTime,
        firstContentfulPaint: fcp,
        largestContentfulPaint: 0, // Will be updated by observer
        cumulativeLayoutShift: 0, // Will be updated by observer
        interactionToNextPaint: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        routeChangeTime: routeHistory[routeHistory.length - 1]?.loadTime || 0
      };
      
      setMetrics(newMetrics);
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  };

  const loadRoutePerformanceHistory = () => {
    const history = JSON.parse(sessionStorage.getItem('routePerformance') || '[]');
    const routeStats = history.reduce((acc: Record<string, { total: number; count: number; times: number[] }>, entry: any) => {
      if (!acc[entry.route]) {
        acc[entry.route] = { total: 0, count: 0, times: [] };
      }
      acc[entry.route].total += entry.loadTime;
      acc[entry.route].count++;
      acc[entry.route].times.push(entry.loadTime);
      return acc;
    }, {});

    const performance: RoutePerformance[] = Object.entries(routeStats).map(([route, stats]) => {
      const { total, count, times } = stats as { total: number; count: number; times: number[] };
      const avgTime = total / count;
      const score = getPerformanceScore(avgTime);
      const issues = getPerformanceIssues(avgTime, times);
      
      return { route, loadTime: avgTime, score, issues };
    });

    setRoutePerformance(performance.sort((a, b) => b.loadTime - a.loadTime));
  };

  const getPerformanceScore = (loadTime: number): number => {
    if (loadTime < 100) return 95;
    if (loadTime < 200) return 85;
    if (loadTime < 500) return 70;
    if (loadTime < 1000) return 50;
    return 30;
  };

  const getPerformanceIssues = (avgTime: number, times: number[]): string[] => {
    const issues: string[] = [];
    
    if (avgTime > 1000) issues.push('Slow loading');
    if (Math.max(...times) - Math.min(...times) > 500) issues.push('Inconsistent performance');
    if (times.some(t => t > 2000)) issues.push('Occasional timeouts');
    
    return issues;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Good</Badge>;
    if (score >= 60) return <Badge variant="secondary">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    const interval = setInterval(() => {
      collectPerformanceMetrics();
      loadRoutePerformanceHistory();
    }, 5000);

    setTimeout(() => {
      clearInterval(interval);
      setIsMonitoring(false);
    }, 30000); // Monitor for 30 seconds
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading performance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Page Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Current Page Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Page Load</p>
              <p className="text-2xl font-bold">{Math.round(metrics.pageLoadTime)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">First Paint</p>
              <p className="text-2xl font-bold">{Math.round(metrics.firstContentfulPaint)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">LCP</p>
              <p className="text-2xl font-bold">{Math.round(metrics.largestContentfulPaint)}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memory</p>
              <p className="text-2xl font-bold">
                {metrics.memoryUsage ? `${Math.round(metrics.memoryUsage / 1024 / 1024)}MB` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Performance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Route Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routePerformance.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No route performance data available. Navigate between pages to see metrics.
            </p>
          ) : (
            <div className="space-y-3">
              {routePerformance.slice(0, 10).map((route) => (
                <div key={route.route} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{route.route}</code>
                      {getScoreBadge(route.score)}
                    </div>
                    {route.issues.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs text-muted-foreground">
                          {route.issues.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getScoreColor(route.score)}`}>
                      {Math.round(route.loadTime)}ms
                    </p>
                    <div className="w-20">
                      <Progress value={Math.min(route.score, 100)} className="h-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};