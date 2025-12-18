import React from 'react';
import { cn } from "@/lib/utils";
import { Skeleton } from './skeleton';

interface EnhancedSkeletonProps {
  variant?: 'default' | 'card' | 'avatar' | 'text' | 'dashboard' | 'table';
  rows?: number;
  className?: string;
}

export const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  variant = 'default',
  rows = 1,
  className
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={cn("space-y-4 p-4 border rounded-lg", className)}>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        );
        
      case 'avatar':
        return (
          <div className={cn("flex items-center space-x-4", className)}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className={cn("space-y-2", className)}>
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={cn(
                  "h-4",
                  i === rows - 1 ? "w-2/3" : "w-full"
                )} 
              />
            ))}
          </div>
        );
        
      case 'dashboard':
        return (
          <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
            
            {/* Chart Area */}
            <Skeleton className="h-64 w-full rounded-lg" />
            
            {/* Table */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'table':
        return (
          <div className={cn("space-y-3", className)}>
            {/* Table Header */}
            <div className="flex items-center space-x-4 p-3 bg-muted rounded">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        );
        
      default:
        return <Skeleton className={className} />;
    }
  };

  return renderSkeleton();
};

// Specialized skeleton components
export const CardSkeleton = (props: Omit<EnhancedSkeletonProps, 'variant'>) => (
  <EnhancedSkeleton variant="card" {...props} />
);

export const AvatarSkeleton = (props: Omit<EnhancedSkeletonProps, 'variant'>) => (
  <EnhancedSkeleton variant="avatar" {...props} />
);

export const TextSkeleton = (props: Omit<EnhancedSkeletonProps, 'variant'>) => (
  <EnhancedSkeleton variant="text" {...props} />
);

export const DashboardSkeleton = (props: Omit<EnhancedSkeletonProps, 'variant'>) => (
  <EnhancedSkeleton variant="dashboard" {...props} />
);

export const TableSkeleton = (props: Omit<EnhancedSkeletonProps, 'variant'>) => (
  <EnhancedSkeleton variant="table" {...props} />
);