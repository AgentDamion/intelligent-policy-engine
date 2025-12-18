import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { SandboxStickyHeader } from './SandboxStickyHeader';
import { SandboxLeftSidebar } from './SandboxLeftSidebar';
import { SandboxMainCanvas } from './SandboxMainCanvas';
import { SandboxRightPanel } from './SandboxRightPanel';
import { ProofTimelineDrawer } from './ProofTimelineDrawer';
import { CreateSimulationDialog } from '@/components/sandbox/CreateSimulationDialog';
import { CreateSandboxProjectDialog } from '../dialogs/CreateSandboxProjectDialog';
import { SandboxSettingsDialog } from '@/components/sandbox/dialogs/SandboxSettingsDialog';
import { SandboxKeyboardShortcuts } from '../SandboxKeyboardShortcuts';
import { SandboxRun } from '@/types/sandbox';
import { SandboxProjectMode } from '@/types/sandboxProject';
import { useSandbox } from '@/hooks/useSandbox';
import { useSandboxProjects } from '@/hooks/useSandboxProjects';
import { useResponsiveSandbox } from '@/hooks/useResponsiveSandbox';

interface SandboxSplitLayoutProps {
  workspaceId: string;
  enterpriseId: string;
}

export function SandboxSplitLayout({ workspaceId, enterpriseId }: SandboxSplitLayoutProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'evidence' | 'config'>('overview');
  const [showTimeline, setShowTimeline] = useState(false);
  const [leftPanelSize, setLeftPanelSize] = useState(20);
  const [rightPanelSize, setRightPanelSize] = useState(25);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const { refreshRuns } = useSandbox(workspaceId);
  const { projects } = useSandboxProjects(workspaceId);
  const { isMobile, isTablet } = useResponsiveSandbox();
  
  // Get current project mode
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const projectMode: SandboxProjectMode = currentProject?.mode || 'tool_evaluation';

  // Persist panel sizes to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sandbox-panel-sizes');
    if (saved) {
      const { left, right } = JSON.parse(saved);
      setLeftPanelSize(left);
      setRightPanelSize(right);
    }
  }, []);

  // Show first-time keyboard shortcuts hint
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('sandbox_shortcuts_hint_shown');
    
    if (!hasSeenHint) {
      const timer = setTimeout(() => {
        toast(
          <div className="flex items-center gap-3">
            <Keyboard className="h-5 w-5 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Keyboard shortcuts available</span>
              <span className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+/</kbd> to view all shortcuts
              </span>
            </div>
          </div>,
          {
            duration: 8000,
            position: 'bottom-right',
            action: {
              label: "Got it",
              onClick: () => {
                localStorage.setItem('sandbox_shortcuts_hint_shown', 'true');
              }
            }
          }
        );
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handlePanelResize = (sizes: number[]) => {
    const [left, _, right] = sizes;
    setLeftPanelSize(left);
    setRightPanelSize(right);
    localStorage.setItem('sandbox-panel-sizes', JSON.stringify({ left, right }));
  };

  const handleRunSelect = (run: SandboxRun) => {
    setSelectedRunId(run.id);
  };

  const handleRunCreated = (runId?: string) => {
    setShowRunDialog(false);
    refreshRuns();
    
    // Auto-select the newly created run and switch to runs tab
    if (runId) {
      setSelectedRunId(runId);
      setActiveTab('runs');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background enhanced-focus" role="main" aria-label="Sandbox workspace">
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Keyboard Shortcuts Handler */}
      <SandboxKeyboardShortcuts
        onCreateSimulation={() => setShowRunDialog(true)}
        onToggleLeftSidebar={() => setShowLeftSidebar(!showLeftSidebar)}
        onToggleInspector={() => setShowRightPanel(!showRightPanel)}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onEscape={() => {
          setShowRunDialog(false);
          setShowCreateProject(false);
          setShowSettings(false);
          setShowTimeline(false);
        }}
      />

      <SandboxStickyHeader
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        timelineVisible={showTimeline}
        onRunCreated={handleRunCreated}
      />

      <div id="main-content" className="flex-1 overflow-hidden">
        {/* Desktop/Tablet Layout */}
        {!isMobile && (
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
            onLayout={handlePanelResize}
          >
            {/* Left Sidebar - Collapsible on tablet */}
            {showLeftSidebar && (
              <>
                <ResizablePanel
                  defaultSize={leftPanelSize}
                  minSize={15}
                  maxSize={30}
                  className="border-r border-border"
                >
                  <SandboxLeftSidebar
                    workspaceId={workspaceId}
                    enterpriseId={enterpriseId}
                    selectedProjectId={selectedProjectId}
                    selectedRunId={selectedRunId}
                    onProjectSelect={setSelectedProjectId}
                    onRunSelect={handleRunSelect}
                    onRunSimulation={() => setShowRunDialog(true)}
                    onCreateProject={() => setShowCreateProject(true)}
                    onOpenSettings={() => setShowSettings(true)}
                    selectedFilters={selectedFilters}
                    onFilterChange={setSelectedFilters}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Main Canvas */}
            <ResizablePanel defaultSize={55} minSize={40}>
              <SandboxMainCanvas
                workspaceId={workspaceId}
                enterpriseId={enterpriseId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedRunId={selectedRunId}
                selectedProjectId={selectedProjectId}
                onRunSelect={handleRunSelect}
                selectedFilters={selectedFilters}
                projectMode={projectMode}
              />
            </ResizablePanel>

            {/* Right Context Panel - Only show when simulation is selected */}
            {selectedRunId && showRightPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={rightPanelSize}
                  minSize={20}
                  maxSize={40}
                  className="border-l border-border"
                >
                  <SandboxRightPanel
                    selectedRunId={selectedRunId}
                    workspaceId={workspaceId}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="h-full flex flex-col">
            {/* Main canvas takes full screen */}
            <SandboxMainCanvas
              workspaceId={workspaceId}
              enterpriseId={enterpriseId}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedRunId={selectedRunId}
              selectedProjectId={selectedProjectId}
              onRunSelect={handleRunSelect}
              selectedFilters={selectedFilters}
              projectMode={projectMode}
            />

            {/* Left sidebar as Sheet */}
            <Sheet open={showLeftSidebar && isMobile} onOpenChange={setShowLeftSidebar}>
              <SheetContent side="left" className="w-[85vw] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Simulations</SheetTitle>
                </SheetHeader>
                <SandboxLeftSidebar
                  workspaceId={workspaceId}
                  enterpriseId={enterpriseId}
                  selectedProjectId={selectedProjectId}
                  selectedRunId={selectedRunId}
                  onProjectSelect={setSelectedProjectId}
                  onRunSelect={handleRunSelect}
                  onRunSimulation={() => setShowRunDialog(true)}
                  onCreateProject={() => setShowCreateProject(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  selectedFilters={selectedFilters}
                  onFilterChange={setSelectedFilters}
                />
              </SheetContent>
            </Sheet>

            {/* Right panel as bottom Sheet */}
            <Sheet open={!!selectedRunId && showRightPanel && isMobile} onOpenChange={setShowRightPanel}>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader className="pb-4">
                  <SheetTitle>Inspector</SheetTitle>
                </SheetHeader>
                <SandboxRightPanel
                  selectedRunId={selectedRunId}
                  workspaceId={workspaceId}
                />
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* Timeline Drawer */}
      {showTimeline && (
        <ProofTimelineDrawer
          workspaceId={workspaceId}
          selectedRunId={selectedRunId}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {/* Create Simulation Dialog */}
      <CreateSimulationDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
        onRunCreated={handleRunCreated}
        selectedProjectId={selectedProjectId}
        projectMode={projectMode}
      />

      {/* Create Project Dialog */}
      <CreateSandboxProjectDialog
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
      />

      {/* Settings Dialog */}
      <SandboxSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
