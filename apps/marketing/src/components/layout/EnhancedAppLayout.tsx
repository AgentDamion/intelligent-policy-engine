import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { RouteAnalytics } from '@/components/navigation/RouteAnalytics';
import { AppHeader } from '@/components/AppHeader';

interface EnhancedAppLayoutProps {
  children?: React.ReactNode;
}

export const EnhancedAppLayout: React.FC<EnhancedAppLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <RouteAnalytics />
      
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with trigger */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="hidden md:block">
                <SmartBreadcrumb />
              </div>
            </div>
            <AppHeader />
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              {/* Mobile breadcrumb */}
              <div className="md:hidden mb-4">
                <SmartBreadcrumb />
              </div>
              
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};