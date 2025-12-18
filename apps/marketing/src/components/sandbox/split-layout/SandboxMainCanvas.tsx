import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { OverviewTab } from '../tabs/OverviewTab';
import { RunsTab } from '../tabs/RunsTab';
import { EvidenceTab } from '../tabs/EvidenceTab';
import { ConfigurationTab } from '../tabs/ConfigurationTab';
import { PartnerGovernanceTab } from '../tabs/PartnerGovernanceTab';
import { SandboxRun } from '@/types/sandbox';
import { SandboxProjectMode } from '@/types/sandboxProject';
import { useMemo } from 'react';

interface SandboxMainCanvasProps {
  workspaceId: string;
  enterpriseId: string;
  activeTab: 'overview' | 'runs' | 'evidence' | 'config';
  onTabChange: (tab: 'overview' | 'runs' | 'evidence' | 'config') => void;
  selectedRunId: string | null;
  selectedProjectId: string | null;
  onRunSelect: (run: SandboxRun) => void;
  selectedFilters: string[];
  projectMode?: SandboxProjectMode;
}

export function SandboxMainCanvas({
  workspaceId,
  enterpriseId,
  activeTab,
  onTabChange,
  selectedRunId,
  selectedProjectId,
  onRunSelect,
  selectedFilters,
  projectMode = 'tool_evaluation'
}: SandboxMainCanvasProps) {
  // Mode-aware tab configuration
  const tabs = useMemo(() => {
    const baseTab = { value: 'overview', label: 'Overview' };
    
    switch (projectMode) {
      case 'tool_evaluation':
        return [
          baseTab,
          { value: 'runs', label: 'Runs' },
          { value: 'evidence', label: 'Evidence' },
          { value: 'config', label: 'Compliance Reports' },
        ];
      case 'policy_adaptation':
        return [
          baseTab,
          { value: 'runs', label: 'Template' },
          { value: 'evidence', label: 'Adaptations' },
          { value: 'config', label: 'Approvals' },
        ];
      case 'partner_governance':
        return [
          baseTab,
          { value: 'runs', label: 'Partner Policies' },
          { value: 'evidence', label: 'Shared Runs' },
          { value: 'config', label: 'Audit Trail' },
        ];
      default:
        return [
          baseTab,
          { value: 'runs', label: 'Runs' },
          { value: 'evidence', label: 'Evidence' },
          { value: 'config', label: 'Configuration' },
        ];
    }
  }, [projectMode]);

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="flex-1 flex flex-col">
        <div className="border-b border-border px-6 bg-muted/20">
          <TabsList className="bg-transparent h-12">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="data-[state=active]:bg-background"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="h-full m-0">
            <OverviewTab
              workspaceId={workspaceId}
              enterpriseId={enterpriseId}
              selectedProjectId={selectedProjectId}
              onRunSelect={onRunSelect}
              selectedFilters={selectedFilters}
            />
          </TabsContent>

          <TabsContent value="runs" className="h-full m-0">
            {projectMode === 'partner_governance' ? (
              <PartnerGovernanceTab
                workspaceId={workspaceId}
                enterpriseId={enterpriseId}
              />
            ) : (
              <RunsTab
                workspaceId={workspaceId}
                selectedRunId={selectedRunId}
                selectedProjectId={selectedProjectId}
                onRunSelect={onRunSelect}
                selectedFilters={selectedFilters}
              />
            )}
          </TabsContent>

          <TabsContent value="evidence" className="h-full m-0">
            <EvidenceTab workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value="config" className="h-full m-0">
            {projectMode === 'partner_governance' ? (
              <div className="p-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Partner Audit Trail</h3>
                  <p className="text-muted-foreground">
                    Cross-tenant audit logs showing all partner governance activities
                  </p>
                </Card>
              </div>
            ) : (
              <ConfigurationTab
                workspaceId={workspaceId}
                enterpriseId={enterpriseId}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
