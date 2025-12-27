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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Play className="h-4 w-4 mr-2 fill-current" />
            Start Scenario
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <SandboxDashboard enterpriseId={currentEnterprise?.id || ''} />
      </div>
    </SurfaceLayout>
  );
}
