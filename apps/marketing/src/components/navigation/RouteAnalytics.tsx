import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllManagedRoutes } from '@/config/routes.config';
import { monitoring } from '@/utils/monitoring';

// Simple route analytics hook for tracking page views and user navigation patterns
export const useRouteAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    const allRoutes = getAllManagedRoutes();
    const currentRoute = allRoutes.find(route => route.path === location.pathname);
    
    // Track page view
    const pageView = {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: new Date().toISOString(),
      routeTitle: currentRoute?.title || 'Unknown',
      routeCategory: currentRoute?.category || 'uncategorized',
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Store in sessionStorage for demo purposes (replace with real analytics)
    const existingViews = JSON.parse(sessionStorage.getItem('routeAnalytics') || '[]');
    existingViews.push(pageView);
    
    // Keep only last 50 views to prevent storage bloat
    const recentViews = existingViews.slice(-50);
    sessionStorage.setItem('routeAnalytics', JSON.stringify(recentViews));

    // Track user journey patterns
    const userJourney = JSON.parse(sessionStorage.getItem('userJourney') || '[]');
    userJourney.push({
      from: userJourney[userJourney.length - 1]?.to || 'direct',
      to: location.pathname,
      timestamp: Date.now()
    });
    
    // Keep only last 20 journey steps
    const recentJourney = userJourney.slice(-20);
    sessionStorage.setItem('userJourney', JSON.stringify(recentJourney));

    // Track analytics through monitoring service (development only)
    if (import.meta.env.DEV) {
      monitoring.debug('Route Analytics', {
        page: currentRoute?.title || location.pathname,
        category: currentRoute?.category,
        journey: recentJourney.slice(-3) // Last 3 steps
      });
    }

  }, [location]);
};

export const RouteAnalytics: React.FC = () => {
  useRouteAnalytics();
  return null; // This component only tracks, doesn't render
};
