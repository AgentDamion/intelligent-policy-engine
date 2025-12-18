import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard,
  Bot, 
  Shield,
  BarChart3,
  FileText,
  Settings,
  Network,
  Building2
} from "lucide-react";
import { useClientContext } from '@/hooks/useClientContext';
import DashboardOverview from './DashboardOverview';
import AIToolsHub from './AIToolsHub';
import GovernanceHub from './GovernanceHub';
import RealTimeFeatures from './RealTimeFeatures';
import { SubmissionReviewWorkflow } from './SubmissionReviewWorkflow';
import { ClientPerformanceDashboard } from './ClientPerformanceDashboard';
import { EssentialReporting } from './EssentialReporting';
import { NetworkOperationsCenter } from './NetworkOperationsCenter';

interface AgencyOperationsDashboardProps {
  agencyWorkspaceId?: string;
  agencyEnterpriseId?: string;
}

const AgencyOperationsDashboard: React.FC<AgencyOperationsDashboardProps> = ({
  agencyWorkspaceId,
  agencyEnterpriseId
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedContext } = useClientContext();

  return (
    <div className="space-y-6">
      {/* Agency Client Context Header */}
      {selectedContext && (
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">
                  Managing: {selectedContext.clientName}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedContext.workspaceName}</span>
                  <span>•</span>
                  <span>{selectedContext.toolsCount} AI Tools</span>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedContext.complianceReadiness}% Compliant
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Client Settings
              </Button>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Agency Operations Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Tools
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <SubmissionReviewWorkflow 
            agencyWorkspaceId={agencyWorkspaceId || "demo-workspace-001"} 
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <ClientPerformanceDashboard />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <EssentialReporting />
        </TabsContent>

        <TabsContent value="ai-tools" className="mt-6">
          <AIToolsHub />
        </TabsContent>

        <TabsContent value="governance" className="mt-6">
          <GovernanceHub />
        </TabsContent>

        <TabsContent value="network" className="mt-6">
          {agencyWorkspaceId && agencyEnterpriseId && (
            <NetworkOperationsCenter 
              agencyWorkspaceId={agencyWorkspaceId}
              agencyEnterpriseId={agencyEnterpriseId}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Real-time features moved to bottom for less visual noise */}
      <div className="border-t pt-6">
        <RealTimeFeatures />
      </div>
    </div>
  );
};

export default AgencyOperationsDashboard;