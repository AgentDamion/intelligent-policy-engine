import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { RouteAnalytics } from '@/components/navigation/RouteAnalytics';
import RouteSEO from '@/components/seo/RouteSEO';
import RoutePreloader from '@/components/performance/RoutePreloader';
import RouteErrorBoundary from '@/components/route/RouteErrorBoundary';
import RouteIntelligence from '@/components/route/RouteIntelligence';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <RouteSEO />
      <RouteAnalytics />
      <RoutePreloader 
        preloadStrategy="likely" 
        userRole={profile?.account_type} 
      />
      <RouteIntelligence />
      
      <RouteErrorBoundary routePath={window.location.pathname}>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div className="hidden md:block">
                  <SmartBreadcrumb />
                </div>
              </div>
              <AppHeader />
            </header>
            <main className="flex-1 overflow-auto bg-brand-warm-white">
              <div className="container mx-auto p-6">
                {/* Mobile breadcrumb */}
                <div className="md:hidden mb-4">
                  <SmartBreadcrumb />
                </div>
                
                {children}
              </div>
            </main>
          </div>
        </div>
      </RouteErrorBoundary>
    </SidebarProvider>
  );
};