import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { PartnerGlobalNav } from '@/components/partner/PartnerGlobalNav';
import { PartnerSecondaryNav } from '@/components/partner/PartnerSecondaryNav';
import { PartnerHeaderModule } from '@/components/partner/PartnerHeaderModule';
import { RouteAnalytics } from '@/components/navigation/RouteAnalytics';

interface PartnerLayoutProps {
  children?: React.ReactNode;
  showHeaderModule?: boolean;
}

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({ 
  children, 
  showHeaderModule 
}) => {
  const location = useLocation();
  
  // Only show header module on main dashboard page
  const shouldShowHeader = showHeaderModule ?? (location.pathname === '/agency/dashboard');
  
  return (
    <SidebarProvider>
      <RouteAnalytics />
      
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Partner Global Navigation */}
          <PartnerGlobalNav />
          
          {/* Partner Secondary Navigation */}
          <PartnerSecondaryNav />
          
          {/* Main content area */}
          <main className="flex-1 bg-muted/30">
            <div className="container mx-auto p-6 space-y-6">
              {/* Partner Header Module - show only on dashboard */}
              {shouldShowHeader && <PartnerHeaderModule />}
              
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};