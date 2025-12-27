;
import { SurfaceLayout } from '../../components/SurfaceLayout';
import { InboxView } from '../../components/vera';
import { Plus, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEnterprise } from '../../contexts/EnterpriseContext';

export default function Triage() {
  const { currentEnterprise } = useEnterprise();

  return (
    <SurfaceLayout
      surface="inbox"
      title="Triage"
      subtitle="Work intake and prioritization cockpit"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Thread
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <InboxView enterpriseId={currentEnterprise?.id || ''} />
      </div>
    </SurfaceLayout>
  );
}
