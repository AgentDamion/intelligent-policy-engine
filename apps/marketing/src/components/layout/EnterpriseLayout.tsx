import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { EnterpriseGlobalNav } from '@/components/enterprise/EnterpriseGlobalNav';
import { EnterpriseSecondaryNav } from '@/components/enterprise/EnterpriseSecondaryNav';
import { RouteAnalytics } from '@/components/navigation/RouteAnalytics';
import { RouteSEO } from '@/components/seo/RouteSEO';
import { RouteErrorBoundary } from '@/components/route/RouteErrorBoundary';

interface EnterpriseLayoutProps {
  children?: React.ReactNode;
}

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <RouteSEO />
      <RouteAnalytics />
      
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <RouteErrorBoundary>
            {/* Enterprise Global Navigation */}
            <EnterpriseGlobalNav />
            
            {/* Enterprise Secondary Navigation */}
            <EnterpriseSecondaryNav />
            
            {/* Main content area */}
            <main className="flex-1 bg-muted/30">
              <div className="container mx-auto p-6 space-y-6">
                {children || <Outlet />}
              </div>
            </main>
          </RouteErrorBoundary>
        </div>
      </div>
    </SidebarProvider>
  );
};