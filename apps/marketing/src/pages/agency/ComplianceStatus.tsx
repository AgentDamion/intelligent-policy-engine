import React from 'react';
import { motion } from 'framer-motion';
import { useClientComplianceData } from '@/hooks/useClientComplianceData';
import { ComplianceStatusGrid } from '@/components/agency/ComplianceStatusGrid';
import { GapAnalysisPanel } from '@/components/agency/GapAnalysisPanel';
import { ActionItemsList } from '@/components/agency/ActionItemsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, TrendingDown, AlertTriangle } from 'lucide-react';

const ComplianceStatus = () => {
  const { data: clients, loading, statusCounts, allActionItems, refetch } = useClientComplianceData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Compliance Status</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Traffic-light view per client with gap analysis and action items
        </p>
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <Shield className="h-4 w-4" />
            Client Overview
          </TabsTrigger>
          <TabsTrigger value="gaps" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Gap Analysis
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Action Items ({allActionItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ComplianceStatusGrid
            clients={clients}
            loading={loading}
            statusCounts={statusCounts}
            onRefresh={refetch}
            onViewDetails={(clientId) => {
              console.log('View details for client:', clientId);
              // TODO: Navigate to client detail page
            }}
          />
        </TabsContent>

        <TabsContent value="gaps">
          <GapAnalysisPanel clients={clients} />
        </TabsContent>

        <TabsContent value="actions">
          <ActionItemsList actionItems={allActionItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceStatus;