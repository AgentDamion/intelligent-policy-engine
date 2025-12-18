import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { useClientsData } from '@/hooks/useClientsData';
import { useAgentActivities } from '@/hooks/useAgentActivities';
import StatsOverview from '../dashboard/StatsOverview';
import ClientActivity from '../dashboard/ClientActivity';
import ConflictActions from '../dashboard/ConflictActions';
import AgentActivity from '../dashboard/AgentActivity';
import CrossTabIntegrationPanel from './CrossTabIntegrationPanel';
import WorkflowAutomationPanel from './WorkflowAutomationPanel';
import RealTimeCollaboration from './RealTimeCollaboration';

const DashboardOverview: React.FC = () => {
  const { clients, stats, loading } = useClientsData();
  const { agentActivities, activitiesLoading, refetch: fetchAgentActivities } = useAgentActivities();
  
  const [expandedSections, setExpandedSections] = useState({
    quickMetrics: true,
    clientActivity: false,
    agentActivity: false,
    conflicts: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Always Visible: Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Performance Metrics
          </CardTitle>
          <CardDescription>
            Overview of your agency's AI tool governance performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsOverview stats={stats} />
        </CardContent>
      </Card>

      {/* Collapsible: Client Activity */}
      <Card>
        <Collapsible
          open={expandedSections.clientActivity}
          onOpenChange={() => toggleSection('clientActivity')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>Client Activity</CardTitle>
                </div>
                {expandedSections.clientActivity ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <CardDescription>
                Recent client submissions and tool usage
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ClientActivity clients={clients} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Collapsible: Conflicts & Issues */}
      <Card>
        <Collapsible
          open={expandedSections.conflicts}
          onOpenChange={() => toggleSection('conflicts')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle>Conflicts & Actions Required</CardTitle>
                </div>
                {expandedSections.conflicts ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <CardDescription>
                Policy conflicts and urgent actions needed
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ConflictActions 
                onConflictsClick={() => {}}
                onAnalyticsClick={() => {}}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Collapsible: Agent Activity */}
      <Card>
        <Collapsible
          open={expandedSections.agentActivity}
          onOpenChange={() => toggleSection('agentActivity')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>Agent Activity</CardTitle>
                </div>
                {expandedSections.agentActivity ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <CardDescription>
                AI agent processing and decision activity
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <AgentActivity 
                activities={agentActivities}
                loading={activitiesLoading}
                onRefresh={fetchAgentActivities}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm">
              Review Pending Submissions
            </Button>
            <Button variant="outline" size="sm">
              Update Policies
            </Button>
            <Button variant="outline" size="sm">
              Run Conflict Scan
            </Button>
            <Button variant="outline" size="sm">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phase 4A Integration Components */}
      <div className="space-y-6">
        <CrossTabIntegrationPanel />
        <WorkflowAutomationPanel />
        <RealTimeCollaboration />
      </div>
    </div>
  );
};

export default DashboardOverview;