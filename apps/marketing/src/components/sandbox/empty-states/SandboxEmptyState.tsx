import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Upload, BookOpen, FileText, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SandboxGuideDialog } from '../dialogs/SandboxGuideDialog';

interface SandboxEmptyStateProps {
  workspaceId: string;
  enterpriseId: string;
  onRunSimulation: () => void;
}

export function SandboxEmptyState({ workspaceId, enterpriseId, onRunSimulation }: SandboxEmptyStateProps) {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <SandboxGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-2xl p-8 text-center space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">Welcome to Policy Sandbox</h3>
          <p className="text-muted-foreground">
            Start by selecting a policy to simulate a sandbox run and generate a proof bundle.
          </p>
        </div>

        {/* Visual Workflow */}
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="text-center space-y-2 group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div className="text-xs font-medium">Select Policy</div>
          </div>
          <div className="text-2xl text-muted-foreground">→</div>
          <div className="text-center space-y-2 group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg">
              <Play className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs font-medium">Run Simulation</div>
          </div>
          <div className="text-2xl text-muted-foreground">→</div>
          <div className="text-center space-y-2 group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg">
              <Award className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xs font-medium">Get Compliance Certificate</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" onClick={onRunSimulation}>
            <Play className="h-4 w-4" />
            Create Your First Simulation
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="gap-2"
            onClick={() => navigate('/enterprise/import-policy')}
          >
            <Upload className="h-4 w-4" />
            Import Policy
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="gap-2"
            onClick={() => setShowGuide(true)}
          >
            <BookOpen className="h-4 w-4" />
            View Guide
          </Button>
        </div>
      </Card>
    </div>
    </>
  );
}
