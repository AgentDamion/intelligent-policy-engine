import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSandbox } from '@/hooks/useSandbox';
import { GovernanceBlock } from '../governance-block/GovernanceBlock';
import { SandboxRun } from '@/types/sandbox';
import { Activity, CheckCircle, AlertTriangle, XCircle, Plus, HelpCircle, FileText } from 'lucide-react';
import { SandboxEmptyState } from '../empty-states/SandboxEmptyState';
import { CreateSimulationDialog } from '../CreateSimulationDialog';
import { useState } from 'react';

interface OverviewTabProps {
  workspaceId: string;
  enterpriseId: string;
  selectedProjectId: string | null;
  onRunSelect: (run: SandboxRun) => void;
  selectedFilters: string[];
}

export function OverviewTab({ workspaceId, enterpriseId, selectedProjectId, onRunSelect, selectedFilters }: OverviewTabProps) {
  const { runs, loading, refreshRuns } = useSandbox(workspaceId);
  const [showRunDialog, setShowRunDialog] = useState(false);

  // Apply project and status filters
  let filteredRuns = selectedProjectId
    ? runs.filter(run => run.project_id === selectedProjectId)
    : runs;

  if (selectedFilters.length > 0) {
    filteredRuns = filteredRuns.filter(run => {
      const status = run.outputs_json?.validation_result === 'pass' ? 'Passed'
        : run.outputs_json?.validation_result === 'fail' ? 'Failed'
        : run.outputs_json?.risk_flags?.length > 0 ? 'Flagged'
        : 'Passed';
      
      return selectedFilters.includes(status);
    });
  }

  const stats = {
    total: runs.length,
    passed: runs.filter(r => r.outputs_json?.validation_result === 'pass').length,
    flagged: runs.filter(r => r.outputs_json?.risk_flags?.length > 0).length,
    failed: runs.filter(r => r.outputs_json?.validation_result === 'fail').length,
  };

  const recentRuns = filteredRuns.slice(0, 5);

  // Tier 1: No simulations (empty state)
  if (!loading && runs.length === 0) {
    return (
      <>
        <SandboxEmptyState
          workspaceId={workspaceId}
          enterpriseId={enterpriseId}
          onRunSimulation={() => setShowRunDialog(true)}
        />
        <CreateSimulationDialog
          open={showRunDialog}
          onOpenChange={setShowRunDialog}
          workspaceId={workspaceId}
          enterpriseId={enterpriseId}
          onRunCreated={() => {
            setShowRunDialog(false);
            refreshRuns();
          }}
        />
      </>
    );
  }

  // Tier 2: 1-4 simulations (simplified onboarding view)
  if (runs.length > 0 && runs.length < 5) {
    return (
      <ScrollArea className="h-full">
        <div className="p-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-2xl w-full space-y-6">
            {/* Onboarding Progress Card */}
            <Card className="p-8 border-2 border-primary/20">
              <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Created Simulation</div>
                      <div className="text-xs text-muted-foreground">You're testing policies!</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-px bg-border"></div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm text-muted-foreground">Build Confidence</div>
                      <div className="text-xs text-muted-foreground">Run 5+ simulations</div>
                    </div>
                  </div>
                </div>

                {/* Progress Message */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">You have {runs.length} simulation{runs.length > 1 ? 's' : ''}</h3>
                  <p className="text-sm text-muted-foreground">
                    Create {5 - runs.length} more to unlock detailed analytics and insights
                  </p>
                </div>

                {/* Quick Stats Inline */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.passed}
                    </div>
                    <div className="text-xs text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {stats.flagged}
                    </div>
                    <div className="text-xs text-muted-foreground">Flagged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Simulations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Your Simulations</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRunDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Another
                </Button>
              </div>
              <div className="grid gap-3">
                {recentRuns.map((run) => (
                  <GovernanceBlock
                    key={run.id}
                    run={run}
                    onClick={() => onRunSelect(run)}
                  />
                ))}
              </div>
            </div>

            {/* Help Actions */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <HelpCircle className="h-4 w-4 mr-2" />
                What is a simulation?
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <FileText className="h-4 w-4 mr-2" />
                View sample results
              </Button>
            </div>
          </div>

          <CreateSimulationDialog
            open={showRunDialog}
            onOpenChange={setShowRunDialog}
            workspaceId={workspaceId}
            enterpriseId={enterpriseId}
            onRunCreated={() => {
              setShowRunDialog(false);
              refreshRuns();
            }}
          />
        </div>
      </ScrollArea>
    );
  }

  // Tier 3: 5+ simulations (full dashboard with filtered stats)
  const filteredStats = {
    total: filteredRuns.length,
    passed: filteredRuns.filter(r => r.outputs_json?.validation_result === 'pass').length,
    flagged: filteredRuns.filter(r => r.outputs_json?.risk_flags?.length > 0).length,
    failed: filteredRuns.filter(r => r.outputs_json?.validation_result === 'fail').length,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Stats Cards - Using Filtered Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredStats.total}</div>
                <div className="text-xs text-muted-foreground">
                  Total Simulations
                  {selectedProjectId && <div className="text-[10px]">(filtered)</div>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredStats.passed}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredStats.flagged}</div>
                <div className="text-xs text-muted-foreground">Flagged</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredStats.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            {filteredRuns.length > 5 && (
              <Button variant="ghost" size="sm">
                View All ({filteredRuns.length})
              </Button>
            )}
          </div>
          <div className="grid gap-3">
            {recentRuns.map((run) => (
              <GovernanceBlock
                key={run.id}
                run={run}
                onClick={() => onRunSelect(run)}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
