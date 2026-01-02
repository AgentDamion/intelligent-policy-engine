;
import { SurfaceLayout } from '../../components/SurfaceLayout';
import { SandboxDashboard } from '../../components/sandbox/SandboxDashboard';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEnterprise } from '../../contexts/EnterpriseContext';

export default function SimulationLab() {
  const { currentEnterprise } = useEnterprise();

  return (
    <SurfaceLayout
      surface="lab"
      title="Simulation Lab"
      subtitle="Run replays and what-if scenarios against policy drafts"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary-light" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="primary-yellow" size="sm">
            <Play className="h-4 w-4 mr-2 fill-current" />
            Start Scenario
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden p-6">
        <SandboxDashboard enterpriseId={currentEnterprise?.id || ''} />
      </div>
    </SurfaceLayout>
  );
}
