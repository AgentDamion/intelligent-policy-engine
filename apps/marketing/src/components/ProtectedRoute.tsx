import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleSelector from '@/components/RoleSelector';
import TermsAcceptance from '@/components/auth/TermsAcceptance';
import { Loader2 } from 'lucide-react';
import { monitoring } from '@/utils/monitoring';
import { demoMode } from '@/utils/demoMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireContext?: boolean;
  stepUpFor?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireContext = false,
  stepUpFor = []
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Demo mode: skip auth checks and provide simpler navigation
  if (demoMode.isEnabled()) {
    const role = demoMode.getDemoRole();
    if (!role) {
      return <RoleSelector />;
    }
    
    // Check if admin trying to access internal routes
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
    // Admin access is only available in demo mode
    if ((role as string) === 'admin' && currentPath.startsWith('/internal/')) {
      return <>{children}</>;
    }
    // Non-admin roles accessing internal routes should be redirected
    if ((role as string) !== 'admin' && currentPath.startsWith('/internal/')) {
      if (role === 'enterprise') {
        return <Navigate to="/enterprise/dashboard" replace />;
      } else if (role === 'partner') {
        return <Navigate to="/agency/dashboard" replace />;
      } else if (role === 'vendor') {
        return <Navigate to="/vendor/dashboard" replace />;
      }
    }
    }
    
    return <>{children}</>;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show role selector if user hasn't chosen a role yet
  if (!profile?.account_type) {
    return <RoleSelector />;
  }

  // Check if user has accepted current terms (skip for demo mode)
  if (!demoMode.isEnabled() && profile.account_type && !profile.terms_accepted_at) {
    const handleTermsAccept = async () => {
      // Terms acceptance is handled in TermsAcceptance component
      window.location.reload();
    };
    return <TermsAcceptance onAccept={handleTermsAccept} />;
  }

  // Redirect based on role if user is on wrong dashboard
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    
    // Enterprise users should not access agency or vendor routes
    if (profile.account_type === 'enterprise' && (currentPath.startsWith('/agency/') || currentPath.startsWith('/vendor/'))) {
      return <Navigate to="/enterprise/dashboard" replace />;
    }
    
    // Partners should not access enterprise or vendor routes
    const allowedNonAgencyPaths = ['/', '/auth', '/marketplace', '/marketplace-public', '/contact', '/about', '/pricing', '/trust-center'];
    const isAllowedPath = allowedNonAgencyPaths.some(path => currentPath === path || currentPath.startsWith('/marketplace'));
    
    if (profile.account_type === 'partner' && !currentPath.startsWith('/agency/') && !isAllowedPath) {
      return <Navigate to="/agency/dashboard" replace />;
    }

    // Vendors should only access vendor routes and public pages
    if (profile.account_type === 'vendor' && !currentPath.startsWith('/vendor/') && !isAllowedPath) {
      return <Navigate to="/vendor/dashboard" replace />;
    }
  }

  return <>{children}</>;
};