import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { routes, getRoutesByMode } from '@/lib/routes';
import { getAllManagedRoutes, routeCategories } from '@/config/routes.config';
import { useMode } from '@/contexts/ModeContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
  category?: string;
}

export const SmartBreadcrumb: React.FC = () => {
  const location = useLocation();
  const { mode } = useMode();
  const currentPath = location.pathname;

  // Get route information from our configuration
  const allRoutes = getAllManagedRoutes();
  const currentRoute = allRoutes.find(route => route.path === currentPath);

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home for authenticated routes
    if (currentPath !== '/' && !currentPath.startsWith('/invite') && !currentPath.startsWith('/auth')) {
      breadcrumbs.push({
        label: 'Home',
        href: mode === 'enterprise' ? routes.enterprise.dashboard : routes.agency.dashboard
      });
    }

    // Add category level if available
    if (currentRoute?.category) {
      const categoryInfo = routeCategories[currentRoute.category as keyof typeof routeCategories];
      if (categoryInfo && categoryInfo.title !== 'Overview') {
        breadcrumbs.push({
          label: categoryInfo.title,
          category: currentRoute.category
        });
      }
    }

    // Add current page
    if (currentRoute) {
      breadcrumbs.push({
        label: currentRoute.title,
        href: currentPath
      });
    } else {
      // Fallback for dynamic routes or unregistered routes
      const segments = currentPath.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      const label = lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label: label || 'Current Page'
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for single-level navigation
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Home className="h-3 w-3" />
      {breadcrumbs.map((crumb, index) => (
        <div key={`breadcrumb-${index}`} className="flex items-center">
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.href && index < breadcrumbs.length - 1 ? (
            <Link
              to={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};