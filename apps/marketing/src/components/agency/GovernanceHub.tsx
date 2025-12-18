import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Settings
} from "lucide-react";
import PolicyManagement from './PolicyManagement';
import ConflictResolution from './ConflictResolution';
import MultiClientGovernance from './MultiClientGovernance';

const GovernanceHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('policies');
  const [expandedSections, setExpandedSections] = useState({
    policyOverview: true,
    conflictsSummary: true,
    multiClientSummary: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Governance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Active Policies</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-muted-foreground text-sm">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Active Conflicts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-sm">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              <CardTitle className="text-lg">Client Workspaces</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-muted-foreground text-sm">Under management</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview Sections */}
      <div className="space-y-4">
        {/* Policy Overview */}
        <Card>
          <Collapsible
            open={expandedSections.policyOverview}
            onOpenChange={() => toggleSection('policyOverview')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle>Policy Status Overview</CardTitle>
                  </div>
                  {expandedSections.policyOverview ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  Recent policy updates and compliance status
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">18</div>
                    <div className="text-sm text-muted-foreground">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">4</div>
                    <div className="text-sm text-muted-foreground">Under Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">2</div>
                    <div className="text-sm text-muted-foreground">Non-Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">3</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Conflicts Summary */}
        <Card>
          <Collapsible
            open={expandedSections.conflictsSummary}
            onOpenChange={() => toggleSection('conflictsSummary')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle>Conflict Resolution Status</CardTitle>
                  </div>
                  {expandedSections.conflictsSummary ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  Active conflicts requiring immediate attention
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div>
                      <div className="font-medium">High Priority</div>
                      <div className="text-sm text-muted-foreground">Policy conflicts requiring immediate action</div>
                    </div>
                    <div className="text-lg font-bold text-red-600">1</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div>
                      <div className="font-medium">Medium Priority</div>
                      <div className="text-sm text-muted-foreground">Tool compatibility issues</div>
                    </div>
                    <div className="text-lg font-bold text-yellow-600">2</div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Detailed Governance Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Governance Management</CardTitle>
              <CardDescription>
                Detailed policy, conflict, and multi-client management
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="policies">
                <FileText className="h-4 w-4 mr-2" />
                Policies
              </TabsTrigger>
              <TabsTrigger value="conflicts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Conflicts
              </TabsTrigger>
              <TabsTrigger value="multi-client">
                <Users className="h-4 w-4 mr-2" />
                Multi-Client
              </TabsTrigger>
            </TabsList>

            <TabsContent value="policies" className="mt-6">
              <PolicyManagement />
            </TabsContent>

            <TabsContent value="conflicts" className="mt-6">
              <ConflictResolution />
            </TabsContent>

            <TabsContent value="multi-client" className="mt-6">
              <MultiClientGovernance />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernanceHub;