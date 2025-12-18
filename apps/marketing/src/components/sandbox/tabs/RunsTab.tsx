import { ScrollArea } from '@/components/ui/scroll-area';
import { useSandbox } from '@/hooks/useSandbox';
import { GovernanceBlock } from '../governance-block/GovernanceBlock';
import { SandboxEmptyState } from '../empty-states/SandboxEmptyState';
import { SandboxRun } from '@/types/sandbox';
import { CreateSimulationDialog } from '../CreateSimulationDialog';
import { useState } from 'react';

interface RunsTabProps {
  workspaceId: string;
  selectedRunId: string | null;
  selectedProjectId: string | null;
  onRunSelect: (run: SandboxRun) => void;
  selectedFilters: string[];
}

export function RunsTab({
  workspaceId,
  selectedRunId,
  selectedProjectId,
  onRunSelect,
  selectedFilters
}: RunsTabProps) {
  const { runs, loading, refreshRuns } = useSandbox(workspaceId);
  const [showRunDialog, setShowRunDialog] = useState(false);
  
  // Assume enterprise ID matches workspace pattern
  const enterpriseId = workspaceId.replace('660e8400', '550e8400');

  // Apply project filter
  let filteredRuns = selectedProjectId
    ? runs.filter(run => run.project_id === selectedProjectId)
    : runs;

  // Apply status filters
  if (selectedFilters.length > 0) {
    filteredRuns = filteredRuns.filter(run => {
      const status = run.outputs_json?.validation_result === 'pass' ? 'Passed'
        : run.outputs_json?.validation_result === 'fail' ? 'Failed'
        : run.outputs_json?.risk_flags?.length > 0 ? 'Flagged'
        : 'Passed';
      
      return selectedFilters.includes(status);
    });
  }

  if (filteredRuns.length === 0 && !loading) {
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

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredRuns.map((run) => (
            <GovernanceBlock
              key={run.id}
              run={run}
              selected={run.id === selectedRunId}
              onClick={() => onRunSelect(run)}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
