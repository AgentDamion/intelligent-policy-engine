import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  interactionToNextPaint: number;
  memoryUsage?: number;
  bundleSize?: number;
}

interface PerformanceOptimizerProps {
  showMetrics?: boolean;
  autoOptimize?: boolean;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  showMetrics = false,
  autoOptimize = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<string[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (autoOptimize) {
      initializeOptimizations();
    }
    collectPerformanceMetrics();
  }, [autoOptimize]);

  const initializeOptimizations = useCallback(() => {
    const optimizationList: string[] = [];

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observerRef.current?.unobserve(img);
            }
          }
        });
      }, { rootMargin: '50px' });

      // Apply to existing images
      document.querySelectorAll('img[data-src]').forEach((img) => {
        observerRef.current?.observe(img);
      });

      optimizationList.push('Lazy loading enabled');
    }

    // Preload critical resources
    const criticalResources = [
      '/fonts/inter.woff2',
      '/api/health'
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      if (resource.includes('font')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });

    optimizationList.push('Critical resources preloaded');

    // Service worker registration for caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          optimizationList.push('Service worker registered');
          setOptimizations([...optimizationList]);
        })
        .catch((error) => {
          console.warn('Service worker registration failed:', error);
        });
    }

    // Memory optimization
    const optimizeMemory = () => {
      // Remove unused event listeners
      const unusedElements = document.querySelectorAll('[data-cleanup]');
      unusedElements.forEach((element) => {
        element.remove();
      });

      // Clear large data caches if they exist
      if (window.caches) {
        window.caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            if (cacheName.includes('old-') || cacheName.includes('unused-')) {
              window.caches.delete(cacheName);
            }
          });
        });
      }

      optimizationList.push('Memory optimization complete');
    };

    // Run memory optimization after a delay
    setTimeout(optimizeMemory, 2000);

    setOptimizations(optimizationList);
  }, []);

  const collectPerformanceMetrics = useCallback(() => {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    let performanceMetrics: PerformanceMetrics = {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      interactionToNextPaint: 0
    };

    // First Contentful Paint
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      performanceMetrics.firstContentfulPaint = fcp.startTime;
    }

    // Web Vitals if available
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceMetrics.largestContentfulPaint = lastEntry.startTime;
        setMetrics({ ...performanceMetrics });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        performanceMetrics.cumulativeLayoutShift = clsValue;
        setMetrics({ ...performanceMetrics });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }

    // Memory usage if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      performanceMetrics.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
    }

    setMetrics(performanceMetrics);
  }, []);

  const getPerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100;

    // Penalize slow loading times
    if (metrics.firstContentfulPaint > 2000) score -= 20;
    if (metrics.largestContentfulPaint > 2500) score -= 20;
    if (metrics.cumulativeLayoutShift > 0.1) score -= 15;
    if (metrics.pageLoadTime > 3000) score -= 15;

    return Math.max(0, score);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  if (!showMetrics) {
    // Run optimizations in background without UI
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-primary" />
          <span>Performance Dashboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Performance Score</span>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${getScoreColor(getPerformanceScore(metrics))}`}>
                  {getPerformanceScore(metrics)}
                </span>
                {getScoreBadge(getPerformanceScore(metrics))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>First Contentful Paint</span>
                  <span>{Math.round(metrics.firstContentfulPaint)}ms</span>
                </div>
                <Progress 
                  value={Math.min(100, (2000 - metrics.firstContentfulPaint) / 20)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Largest Contentful Paint</span>
                  <span>{Math.round(metrics.largestContentfulPaint)}ms</span>
                </div>
                <Progress 
                  value={Math.min(100, (2500 - metrics.largestContentfulPaint) / 25)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Cumulative Layout Shift</span>
                  <span>{metrics.cumulativeLayoutShift.toFixed(3)}</span>
                </div>
                <Progress 
                  value={Math.min(100, (0.1 - metrics.cumulativeLayoutShift) * 1000)} 
                  className="h-2"
                />
              </div>

              {metrics.memoryUsage && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{metrics.memoryUsage.toFixed(1)}MB</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (50 - metrics.memoryUsage) * 2)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {optimizations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span>Active Optimizations</span>
            </h4>
            <div className="space-y-2">
              {optimizations.map((optimization, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{optimization}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};