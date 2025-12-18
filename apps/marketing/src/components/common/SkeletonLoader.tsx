import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  variant: 'card' | 'list' | 'table' | 'document' | 'chart' | 'metric';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  count = 3,
  className
}) => {
  const renderCardSkeleton = () => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-4 p-3 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderDocumentSkeleton = () => (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex space-x-2 pt-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );

  const renderChartSkeleton = () => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="h-40 flex items-end space-x-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-12" />
        ))}
      </div>
    </div>
  );

  const renderMetricSkeleton = () => (
    <div className="space-y-2 p-4 border rounded-lg">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'document':
        return renderDocumentSkeleton();
      case 'chart':
        return renderChartSkeleton();
      case 'metric':
        return renderMetricSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <div className={cn('animate-pulse', className)}>
      {renderSkeleton()}
    </div>
  );
};