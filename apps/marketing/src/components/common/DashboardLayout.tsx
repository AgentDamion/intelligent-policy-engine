import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import DashboardErrorBoundary from '@/components/common/DashboardErrorBoundary';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import HealthIndicator from '@/components/common/HealthIndicator';

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: 'enterprise' | 'agency';
  title?: string;
  showHealth?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  type,
  title,
  showHealth = true
}) => {
  return (
    <div className="min-h-screen bg-background">
      {showHealth && <HealthIndicator position="top-right" />}
      
      <DashboardErrorBoundary dashboardType={type}>
        <div className="flex flex-col h-screen">
          {title && (
            <header className="border-b bg-card">
              <div className="container mx-auto px-6 py-4">
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              </div>
            </header>
          )}
          
          <main className="flex-1 overflow-auto">
            <Suspense fallback={<DashboardSkeleton type={type} />}>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </Suspense>
          </main>
        </div>
      </DashboardErrorBoundary>
    </div>
  );
};

export default DashboardLayout;