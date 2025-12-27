;
import { SurfaceLayout } from '../../components/SurfaceLayout';
import { PolicyList } from '../../components/vera';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEnterprise } from '../../contexts/EnterpriseContext';

export default function TheForge() {
  const { currentEnterprise } = useEnterprise();

  return (
    <SurfaceLayout
      surface="forge"
      title="The Forge"
      subtitle="Define the rules of governance: Policies and Registries"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Template Library
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <PolicyList enterpriseId={currentEnterprise?.id || ''} />
      </div>
    </SurfaceLayout>
  );
}
