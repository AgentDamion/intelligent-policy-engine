import React from 'react';
import { Outlet } from 'react-router-dom';
import { VendorGlobalNav } from '@/components/vendor/VendorGlobalNav';
import { VendorSecondaryNav } from '@/components/vendor/VendorSecondaryNav';
import { RouteAnalytics } from '@/components/navigation/RouteAnalytics';
import { RouteSEO } from '@/components/seo/RouteSEO';
import { RouteErrorBoundary } from '@/components/route/RouteErrorBoundary';

interface VendorLayoutProps {
  children?: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <RouteSEO />
      <RouteAnalytics />
      <RouteErrorBoundary>
        {/* Global Navigation */}
        <VendorGlobalNav />
        
        {/* Secondary Navigation */}
        <VendorSecondaryNav />
        
        {/* Main Content */}
        <main className="flex-1">
          {children || <Outlet />}
        </main>
      </RouteErrorBoundary>
    </div>
  );
};