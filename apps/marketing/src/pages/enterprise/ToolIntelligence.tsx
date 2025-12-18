import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, RefreshCw, Brain } from 'lucide-react';
import { useToolIntelligence } from '@/hooks/useToolIntelligence';
import { ToolRiskMatrix } from '@/components/enterprise/ToolRiskMatrix';
import { VendorAnalysis } from '@/components/enterprise/VendorAnalysis';
import { AdoptionMetrics } from '@/components/enterprise/AdoptionMetrics';

const ToolIntelligence = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { toolRiskMatrix, vendorAnalytics, adoptionMetrics, loading, error, refetch } = useToolIntelligence();

  const handleExport = async () => {
    try {
      // Generate report data
      const reportData = {
        toolRiskMatrix,
        vendorAnalytics,
        adoptionMetrics,
        generatedAt: new Date().toISOString(),
        timeRange
      };

      // Create and download blob
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tool-intelligence-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Tool Intelligence
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights across your tool ecosystem
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Real-time monitoring active
        </Badge>
        <Badge variant="outline">
          {adoptionMetrics.totalTools} tools monitored
        </Badge>
        <Badge variant="outline">
          {vendorAnalytics.length} vendors tracked
        </Badge>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading tool intelligence data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk-matrix">Risk Matrix</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analysis</TabsTrigger>
          <TabsTrigger value="adoption">Adoption Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdoptionMetrics data={adoptionMetrics} loading={loading} />
        </TabsContent>

        <TabsContent value="risk-matrix">
          <ToolRiskMatrix data={toolRiskMatrix} loading={loading} />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorAnalysis data={vendorAnalytics} loading={loading} />
        </TabsContent>

        <TabsContent value="adoption">
          <AdoptionMetrics data={adoptionMetrics} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolIntelligence;