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
        <div className="flex items-center gap-3">
          <Button variant="secondary-light" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Template Library
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden p-6">
        <PolicyList
          enterpriseId={currentEnterprise?.id || ''}
          onSelectPolicy={(policyId) => console.log('Selected policy:', policyId)}
          onCreatePolicy={() => console.log('Create policy')}
        />
      </div>
    </SurfaceLayout>
  );
}
