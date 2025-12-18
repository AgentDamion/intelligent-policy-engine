import React from 'react';
import { useAgencyPerformance } from '@/hooks/useAgencyPerformance';
import { PerformanceOverview } from '@/components/agency/PerformanceOverview';
import { ClientPerformanceTable } from '@/components/agency/ClientPerformanceTable';
import { PerformanceTrends } from '@/components/agency/PerformanceTrends';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SpecBadge from '@/components/ui/SpecBadge';

const Performance = () => {
  const { metrics, loading, refreshData } = useAgencyPerformance();

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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">Performance</h1>
            <SpecBadge id="C4" />
          </div>
          <p className="text-muted-foreground">On-time rate, approval percentage, and cycle time by client</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      <PerformanceOverview metrics={metrics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceTrends trends={metrics.historicalTrends} />
        <ClientPerformanceTable clients={metrics.clientPerformance} />
      </div>
    </div>
  );
};

export default Performance;