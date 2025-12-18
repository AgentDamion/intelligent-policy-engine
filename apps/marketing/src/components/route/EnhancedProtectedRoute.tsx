import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleSelector from '@/components/RoleSelector';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { monitoring } from '@/utils/monitoring';
import { demoMode } from '@/utils/demoMode';
import { getAllManagedRoutes } from '@/config/routes.config';

interface RoutePermission {
  roles: ('enterprise' | 'partner' | 'admin')[];
  features?: string[];
  minimumTier?: 'basic' | 'premium' | 'enterprise';
}

interface EnhancedProtectedRouteProps {
  children: React.ReactNode;
  requireContext?: boolean;
  permissions?: RoutePermission;
  fallbackPath?: string;
  showUpgradePrompt?: boolean;
}

// Route-based permissions configuration
const routePermissions: Record<string, RoutePermission> = {
  // Enterprise-only routes
  '/dashboard': { roles: ['enterprise', 'admin'] },
  '/analytics': { roles: ['enterprise', 'admin'], minimumTier: 'premium' },
  '/tool-intelligence': { roles: ['enterprise', 'admin'], minimumTier: 'enterprise' },
  '/workflows': { roles: ['enterprise', 'admin'] },
  '/audit-trail': { roles: ['enterprise', 'admin'] },
  '/decisions': { roles: ['enterprise', 'admin'] },
  
  // Agency-only routes
  '/agency/dashboard': { roles: ['partner'] },
  '/agency/performance': { roles: ['partner'] },
  '/agency/compliance-status': { roles: ['partner'] },
  '/agency/ai-readiness': { roles: ['partner'] },
  '/agency/my-tools': { roles: ['partner'] },
  '/agency/integrations': { roles: ['partner'] },
  '/agency/project-setup': { roles: ['partner'] },
  '/agency/ai-tool-tracking': { roles: ['partner'] },
  '/agency/submissions': { roles: ['partner'] },
  '/agency/reviews': { roles: ['partner'] },
  '/agency/conflicts': { roles: ['partner'] },
  
  // Shared routes (both roles)
  '/notifications': { roles: ['enterprise', 'partner', 'admin'] },
  '/search': { roles: ['enterprise', 'partner', 'admin'] },
  '/settings': { roles: ['enterprise', 'partner', 'admin'] },
  '/submissions': { roles: ['enterprise', 'partner', 'admin'] },
  '/partners': { roles: ['enterprise', 'partner', 'admin'] },
  
  // Premium features
  '/marketplace-dashboard': { roles: ['enterprise', 'partner', 'admin'], minimumTier: 'premium' },
  '/policies': { roles: ['enterprise', 'admin'], minimumTier: 'premium' }
};

const InsufficientPermissions: React.FC<{
  requiredRole?: string;
  currentRole?: string;
  onUpgrade?: () => void;
  showUpgradePrompt?: boolean;
}> = ({ requiredRole, currentRole, onUpgrade, showUpgradePrompt }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this page.
          {requiredRole && currentRole && (
            <span className="block mt-2 text-sm">
              Required: {requiredRole} access | Your role: {currentRole}
            </span>
          )}
        </AlertDescription>
      </Alert>
      
      {showUpgradePrompt && onUpgrade && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Upgrade your plan to access premium features
          </p>
          <Button onClick={onUpgrade} className="w-full">
            Upgrade Now
          </Button>
        </div>
      )}
      
      <div className="text-center">
        <Button asChild variant="outline" className="w-full">
          <Navigate to="/dashboard" replace />
        </Button>
      </div>
    </div>
  </div>
);

export const EnhancedProtectedRoute: React.FC<EnhancedProtectedRouteProps> = ({ 
  children,
  requireContext = false,
  permissions,
  fallbackPath = '/auth',
  showUpgradePrompt = true
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Demo mode: enhanced with permission simulation
  if (demoMode.isEnabled()) {
    const role = demoMode.getDemoRole();
    if (!role) {
      return <RoleSelector />;
    }
    
    // Check demo permissions
    const routePermission = permissions || routePermissions[location.pathname];
    if (routePermission && !routePermission.roles.includes(role as any)) {
      return (
        <InsufficientPermissions 
          requiredRole={routePermission.roles.join(' or ')}
          currentRole={role}
          showUpgradePrompt={false}
        />
      );
    }
    
    return <>{children}</>;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Show role selector if user hasn't chosen a role yet
  if (!profile?.account_type) {
    return <RoleSelector />;
  }

  // Get route permissions (explicit props take precedence over route config)
  const routePermission = permissions || routePermissions[location.pathname];
  
  // Check role-based access
  if (routePermission) {
    const userRole = profile.account_type;
    const hasRoleAccess = routePermission.roles.includes(userRole as any);
    
    if (!hasRoleAccess) {
      // Log access attempt for monitoring
      monitoring.info('Unauthorized access attempt', {
        userId: user.id,
        userRole,
        attemptedRoute: location.pathname,
        requiredRoles: routePermission.roles
      });
      
      return (
        <InsufficientPermissions 
          requiredRole={routePermission.roles.join(' or ')}
          currentRole={userRole}
          showUpgradePrompt={showUpgradePrompt}
          onUpgrade={() => {
            // Navigate to upgrade flow
            window.open('/pricing', '_blank');
          }}
        />
      );
    }
    
    // Check tier-based access (placeholder for future subscription logic)
    if (routePermission.minimumTier) {
      const userTier = (profile as any).subscription_tier || 'basic';
      const tierHierarchy = { basic: 0, premium: 1, enterprise: 2 };
      const requiredTierLevel = tierHierarchy[routePermission.minimumTier];
      const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
      
      if (userTierLevel < requiredTierLevel) {
        return (
          <InsufficientPermissions 
            requiredRole={`${routePermission.minimumTier} subscription`}
            currentRole={`${userTier} subscription`}
            showUpgradePrompt={showUpgradePrompt}
            onUpgrade={() => {
              window.open('/pricing', '_blank');
            }}
          />
        );
      }
    }
  }

  // Redirect based on role if user is on wrong dashboard
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    
    if (profile.account_type === 'enterprise' && currentPath.startsWith('/agency/')) {
      return <Navigate to="/enterprise/dashboard" replace />;
    }
    
    if (profile.account_type === 'partner' && !currentPath.startsWith('/agency/') && currentPath !== '/' && !currentPath.startsWith('/shared/')) {
      return <Navigate to="/agency/dashboard" replace />;
    }
  }

  // Performance monitoring for route access
  React.useEffect(() => {
    const allRoutes = getAllManagedRoutes();
    const currentRoute = allRoutes.find(route => route.path === location.pathname);
    
    monitoring.info('Route access', {
      userId: user.id,
      userRole: profile.account_type,
      route: location.pathname,
      routeTitle: currentRoute?.title,
      routeCategory: currentRoute?.category,
      timestamp: Date.now()
    });
  }, [location.pathname, user.id, profile.account_type]);

  return <>{children}</>;
};

export default EnhancedProtectedRoute;