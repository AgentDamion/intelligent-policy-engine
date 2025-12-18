import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllManagedRoutes } from '@/config/routes.config';
import { monitoring } from '@/utils/monitoring';

interface RoutePreloaderProps {
  preloadStrategy?: 'critical' | 'likely' | 'all';
  userRole?: string;
}

// Critical routes that should always be preloaded
const criticalRoutes = [
  '/dashboard',
  '/agency/dashboard',
  '/notifications',
  '/settings'
];

// Routes likely to be visited based on user role
const getRoleBasedLikelyRoutes = (role: string): string[] => {
  if (role === 'enterprise') {
    return [
      '/analytics',
      '/policies',
      '/partners',
      '/submissions',
      '/decisions'
    ];
  }
  
  if (role === 'partner') {
    return [
      '/agency/performance',
      '/agency/my-tools',
      '/agency/submissions',
      '/agency/compliance-status'
    ];
  }
  
  return [];
};

// Preload a route by creating a hidden link and triggering mouseover
const preloadRoute = (path: string) => {
  try {
    // Use the browser's link prefetching
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
    
    // Remove after a short delay to clean up
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 5000);
    
    if (import.meta.env.DEV) {
      monitoring.debug(`Preloaded route: ${path}`);
    }
  } catch (error) {
    console.warn(`Failed to preload route ${path}:`, error);
  }
};

// Intelligent preloading based on user behavior patterns
const useIntelligentPreloading = (userRole?: string) => {
  const location = useLocation();

  useEffect(() => {
    // Get user's navigation history from session storage
    const userJourney = JSON.parse(sessionStorage.getItem('userJourney') || '[]');
    
    // Analyze common navigation patterns
    const routeFrequency = userJourney.reduce((acc: Record<string, number>, step: any) => {
      acc[step.to] = (acc[step.to] || 0) + 1;
      return acc;
    }, {});
    
    // Identify next likely routes based on current route
    const currentPath = location.pathname;
    const nextRoutes = userJourney
      .filter((step: any) => step.from === currentPath)
      .map((step: any) => step.to);
    
    const uniqueNextRoutes = [...new Set(nextRoutes)];
    
    // Preload the most likely next routes
    uniqueNextRoutes.slice(0, 3).forEach(route => {
      if (typeof route === 'string' && route !== currentPath) {
        setTimeout(() => preloadRoute(route), 1000); // Delay to avoid impacting current page load
      }
    });
    
    // If no history, use role-based predictions
    if (uniqueNextRoutes.length === 0 && userRole) {
      const likelyRoutes = getRoleBasedLikelyRoutes(userRole);
      likelyRoutes.slice(0, 2).forEach(route => {
        setTimeout(() => preloadRoute(route), 2000);
      });
    }
    
  }, [location.pathname, userRole]);
};

export const RoutePreloader: React.FC<RoutePreloaderProps> = ({ 
  preloadStrategy = 'critical',
  userRole 
}) => {
  const location = useLocation();

  // Intelligent preloading based on user patterns
  useIntelligentPreloading(userRole);

  useEffect(() => {
    const performPreloading = () => {
      let routesToPreload: string[] = [];
      
      switch (preloadStrategy) {
        case 'critical':
          routesToPreload = criticalRoutes;
          break;
          
        case 'likely':
          routesToPreload = [
            ...criticalRoutes,
            ...(userRole ? getRoleBasedLikelyRoutes(userRole) : [])
          ];
          break;
          
        case 'all':
          const allRoutes = getAllManagedRoutes();
          routesToPreload = allRoutes
            .filter(route => route.path !== location.pathname)
            .map(route => route.path)
            .slice(0, 10); // Limit to prevent overwhelming the browser
          break;
      }

      // Remove current route and duplicates
      const uniqueRoutes = [...new Set(routesToPreload)]
        .filter(route => route !== location.pathname);

      // Stagger preloading to avoid performance impact
      uniqueRoutes.forEach((route, index) => {
        setTimeout(() => {
          preloadRoute(route);
        }, index * 500); // 500ms delay between each preload
      });
    };

    // Wait for initial page load to complete
    if (document.readyState === 'complete') {
      setTimeout(performPreloading, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(performPreloading, 1000);
      });
    }

    // Preload on hover events for visible navigation links
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const path = new URL(link.href).pathname;
        if (path !== location.pathname) {
          preloadRoute(path);
        }
      }
    };

    // Add hover listeners to navigation elements
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    navElements.forEach(nav => {
      nav.addEventListener('mouseover', handleLinkHover);
    });

    return () => {
      navElements.forEach(nav => {
        nav.removeEventListener('mouseover', handleLinkHover);
      });
    };

  }, [location.pathname, preloadStrategy, userRole]);

// Enhanced performance monitoring with detailed metrics
  useEffect(() => {
    const startTime = performance.now();
    
    const handleRouteLoadComplete = () => {
      const loadTime = performance.now() - startTime;
      
      // Collect additional performance metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      if (import.meta.env.DEV) {
        monitoring.debug('Enhanced Route Performance', {
          route: location.pathname,
          loadTime: `${loadTime.toFixed(2)}ms`,
          preloadStrategy,
          firstContentfulPaint: `${fcp.toFixed(2)}ms`,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
        });
      }
      
      // Store enhanced performance data
      const performanceData = JSON.parse(sessionStorage.getItem('routePerformance') || '[]');
      performanceData.push({
        route: location.pathname,
        loadTime,
        strategy: preloadStrategy,
        timestamp: Date.now(),
        firstContentfulPaint: fcp,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      });
      
      // Keep only last 50 entries for better analysis
      const recentPerformance = performanceData.slice(-50);
      sessionStorage.setItem('routePerformance', JSON.stringify(recentPerformance));
      
      // Alert on poor performance
      if (loadTime > 1000) {
        console.warn(`⚠️ Slow route detected: ${location.pathname} took ${loadTime.toFixed(2)}ms`);
      }
    };

    // Use more accurate timing for route load completion
    const timer = setTimeout(handleRouteLoadComplete, 150);
    
    return () => clearTimeout(timer);
  }, [location.pathname, preloadStrategy]);

  return null; // This component only handles preloading, doesn't render
};

export default RoutePreloader;
