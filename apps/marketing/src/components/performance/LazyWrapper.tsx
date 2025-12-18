import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface LazyWrapperProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  skeleton?: React.ReactNode;
  errorFallback?: React.ReactNode;
  preload?: boolean;
  retryOnError?: boolean;
}

// Enhanced lazy loading with better error handling and performance monitoring
export const LazyWrapper: React.FC<LazyWrapperProps & { [key: string]: any }> = ({
  component,
  fallback,
  skeleton,
  errorFallback,
  preload = false,
  retryOnError = true,
  ...props
}) => {
  // Create lazy component with retry mechanism
  const LazyComponent = lazy(() => 
    component().catch(error => {
      console.error('Failed to load component:', error);
      
      if (retryOnError) {
        // Retry once after a short delay
        return new Promise<{ default: ComponentType<any> }>((resolve, reject) => {
          setTimeout(() => {
            component().then(resolve).catch(reject);
          }, 1000);
        });
      }
      
      throw error;
    })
  );

  // Preload component if requested
  React.useEffect(() => {
    if (preload) {
      component().catch(() => {
        // Silent fail for preloading
      });
    }
  }, [preload]);

  const defaultSkeleton = (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  const defaultFallback = fallback || (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner text="Loading component..." />
    </div>
  );

  const defaultErrorFallback = errorFallback || (
    <div className="text-center p-8">
      <p className="text-muted-foreground">Failed to load component</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 text-sm text-primary hover:underline"
      >
        Retry
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallback={defaultErrorFallback}>
      <Suspense fallback={skeleton || defaultFallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// HOC for creating lazy components with built-in performance monitoring
export const withLazyLoading = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: Omit<LazyWrapperProps, 'component'> = {}
) => {
  return (props: P) => (
    <LazyWrapper component={importFn} {...options} {...props} />
  );
};

// Predefined lazy loaders for common components
// Example lazy components - these would import actual pages when they exist
// export const LazyDashboard = withLazyLoading(
//   () => import('@/pages/enterprise/DashboardPage'),
//   { preload: true }
// );