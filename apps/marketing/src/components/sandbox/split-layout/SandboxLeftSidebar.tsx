import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SandboxProjectList } from '../shared/SandboxProjectList';
import { RunFilters } from '../shared/RunFilters';
import { QuickActions } from '../shared/QuickActions';
import { PolicyInstancesList } from '../shared/PolicyInstancesList';
import { SimulationsListTab } from '../tabs/SimulationsListTab';
import { SandboxRun } from '@/types/sandbox';
import { useSandboxProjects } from '@/hooks/useSandboxProjects';
import { Play, Plus, List } from 'lucide-react';

interface SandboxLeftSidebarProps {
  workspaceId: string;
  enterpriseId: string;
  selectedProjectId: string | null;
  selectedRunId: string | null;
  onProjectSelect: (projectId: string) => void;
  onRunSelect: (run: SandboxRun) => void;
  onRunSimulation: () => void;
  onCreateProject: () => void;
  onOpenSettings: () => void;
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
  onAdaptPolicy?: () => void;
}

export function SandboxLeftSidebar({
  workspaceId,
  enterpriseId,
  selectedProjectId,
  selectedRunId,
  onProjectSelect,
  onRunSelect,
  onRunSimulation,
  onCreateProject,
  onOpenSettings,
  selectedFilters,
  onFilterChange,
  onAdaptPolicy
}: SandboxLeftSidebarProps) {
  const [activeTab, setActiveTab] = useState('projects');
  const { projects } = useSandboxProjects(workspaceId);

  // Progressive disclosure logic
  const showFilters = projects.length >= 3;
  const showTabs = projects.length >= 3;

  // Empty state for first-time users
  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-full bg-muted/30">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground/80">Get Started</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-xs">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">No simulations yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first simulation to test AI tools against policies.
              </p>
            </div>
            <Button onClick={onRunSimulation} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Simulation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm text-foreground/80">
          {showTabs ? 'Sandbox Control' : 'Simulations'}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <QuickActions
            workspaceId={workspaceId}
            enterpriseId={enterpriseId}
            onRunSimulation={onRunSimulation}
            onOpenSettings={onOpenSettings}
          />

          {showTabs ? (
            /* Full tabs interface for 3+ projects */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="instances">Policy Instances</TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-4 mt-4">
                {/* Filters */}
                <RunFilters 
                  selectedFilters={selectedFilters}
                  onFilterChange={onFilterChange}
                />

                {/* Sandbox Projects List */}
                <SandboxProjectList
                  workspaceId={workspaceId}
                  selectedProjectId={selectedProjectId}
                  onProjectSelect={onProjectSelect}
                />
              </TabsContent>

              <TabsContent value="instances" className="mt-4">
                <PolicyInstancesList
                  enterpriseId={enterpriseId}
                  workspaceId={workspaceId}
                  onAdaptPolicy={onAdaptPolicy}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* Simplified view for 1-2 projects */
            <div className="space-y-4">
              {showFilters && (
                <RunFilters 
                  selectedFilters={selectedFilters}
                  onFilterChange={onFilterChange}
                />
              )}
              <SandboxProjectList
                workspaceId={workspaceId}
                selectedProjectId={selectedProjectId}
                onProjectSelect={onProjectSelect}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
