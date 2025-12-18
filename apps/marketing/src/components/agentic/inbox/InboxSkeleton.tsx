import { Skeleton } from '@/components/ui/skeleton';

export const InboxSkeleton = () => {
  return (
    <div className="space-y-s1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-s3 px-s4 py-s3">
          <Skeleton className="w-2 h-2 rounded-full" />
          <div className="flex-1 space-y-s2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
};
