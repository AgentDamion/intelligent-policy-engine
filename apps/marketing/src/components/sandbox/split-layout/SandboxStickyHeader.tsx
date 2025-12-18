import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Download, Clock } from 'lucide-react';
import { useSandbox } from '@/hooks/useSandbox';
import { CreateSimulationDialog } from '../CreateSimulationDialog';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SandboxStickyHeaderProps {
  workspaceId: string;
  enterpriseId: string;
  onToggleTimeline: () => void;
  timelineVisible: boolean;
  onRunCreated?: (runId?: string) => void;
}

export function SandboxStickyHeader({
  workspaceId,
  enterpriseId,
  onToggleTimeline,
  timelineVisible,
  onRunCreated
}: SandboxStickyHeaderProps) {
  const { runs } = useSandbox(workspaceId);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const { toast } = useToast();

  const handleExportProof = () => {
    try {
      const proofBundle = {
        workspace_id: workspaceId,
        generated_at: new Date().toISOString(),
        total_runs: runs.length,
        runs: runs.map(r => ({
          id: r.id,
          status: r.status,
          created_at: r.created_at,
          control_level: r.control_level,
          inputs: r.inputs_json,
          outputs: r.outputs_json,
          proof_hash: r.proof_hash
        }))
      };
      
      const blob = new Blob([JSON.stringify(proofBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sandbox-proof-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Proof bundle exported successfully' });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Export failed',
        description: 'Unable to generate proof bundle'
      });
    }
  };

  // Calculate summary stats
  const passedCount = runs.filter(r => r.outputs_json?.validation_result === 'pass').length;
  const flaggedCount = runs.filter(r => r.outputs_json?.risk_flags?.length > 0).length;
  const failedCount = runs.filter(r => r.outputs_json?.validation_result === 'fail').length;
  
  const lastRun = runs[0];
  const lastRunTime = lastRun 
    ? formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true })
    : 'Never';

  const showStats = runs.length > 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Title + Conditional Stats */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Policy Sandbox</h1>
          
          {showStats ? (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                ✅ {passedCount} Passed
              </Badge>
              {flaggedCount > 0 && (
                <Badge variant="default" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  ⚠️ {flaggedCount} Flagged
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="default" className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                  ❌ {failedCount} Failed
                </Badge>
              )}
              <span className="text-muted-foreground ml-2">
                Last run {lastRunTime}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Test AI tools against governance policies
            </p>
          )}
        </div>

        {/* Right: Conditional Actions */}
        <div className="flex items-center gap-2">
          {showStats && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleTimeline}
                className={timelineVisible ? 'bg-accent' : ''}
              >
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProof}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Proof
              </Button>
            </>
          )}
          
          <Button
            size="sm"
            onClick={() => setShowRunDialog(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Play className="h-4 w-4 mr-2" />
            Create Simulation
          </Button>
        </div>
      </div>

      <CreateSimulationDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
        onRunCreated={(runId) => {
          setShowRunDialog(false);
          onRunCreated?.(runId);
        }}
      />
    </header>
  );
}
