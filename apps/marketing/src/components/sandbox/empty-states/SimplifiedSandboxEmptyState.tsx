import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Play, Award, Plus } from 'lucide-react';
import { CreateSimulationDialog } from '../CreateSimulationDialog';

interface SimplifiedSandboxEmptyStateProps {
  workspaceId: string;
  enterpriseId: string;
  onSimulationCreated?: () => void;
}

export function SimplifiedSandboxEmptyState({
  workspaceId,
  enterpriseId,
  onSimulationCreated
}: SimplifiedSandboxEmptyStateProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleSimulationCreated = () => {
    setShowDialog(false);
    onSimulationCreated?.();
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-6">
      <div className="max-w-3xl w-full">
        {/* 2-Step Visual Guide */}
        <div className="flex justify-center items-center gap-8 mb-12">
          {/* Step 1 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-bold shrink-0">
              1
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Create a Simulation</h3>
              <p className="text-sm text-muted-foreground">Define tool & policies</p>
            </div>
          </div>
          
          <div className="flex-1 h-px bg-border max-w-[100px]"></div>

          {/* Step 2 */}
          <div className="flex items-center gap-4 opacity-50">
            <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-lg font-bold shrink-0">
              2
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-muted-foreground">Run & Get Proof</h3>
              <p className="text-sm text-muted-foreground">Generate compliance reports</p>
            </div>
          </div>
        </div>

        {/* Main Empty State Card */}
        <div className="bg-card border border-dashed border-border rounded-xl p-12">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 text-muted-foreground bg-muted/50 p-4 rounded-full border border-border flex items-center justify-center">
              <Play className="w-8 h-8" />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Your sandbox is ready</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your first simulation to test an AI tool against a set of governance policies and see potential compliance issues.
              </p>
            </div>

            {/* Primary CTA */}
            <Button 
              size="lg"
              onClick={() => setShowDialog(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Simulation
            </Button>

            {/* Visual Feature Icons */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border mt-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Define what to test</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Run simulation</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Get compliance proof</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Simulation Dialog */}
      <CreateSimulationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
        onRunCreated={handleSimulationCreated}
      />
    </div>
  );
}
