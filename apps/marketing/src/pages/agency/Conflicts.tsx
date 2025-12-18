import React from 'react';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ConflictOverview } from '@/components/agency/ConflictOverview';
import { ConflictList } from '@/components/agency/ConflictList';
import { ConflictAnalyticsChart } from '@/components/agency/ConflictAnalyticsChart';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Scan, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Conflicts = () => {
  const { conflicts, analytics, loading, updateConflictStatus, runConflictScan } = useConflictDetection();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load conflict data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Conflicts</h1>
          <p className="text-muted-foreground">Policy deltas, timeline issues, and usage conflicts</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runConflictScan}>
            <Scan className="h-4 w-4 mr-2" />
            Run Scan
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <ConflictOverview analytics={analytics} />
      
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Conflict List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          <ConflictList 
            conflicts={conflicts} 
            onUpdateStatus={updateConflictStatus}
          />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <ConflictAnalyticsChart analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Conflicts;