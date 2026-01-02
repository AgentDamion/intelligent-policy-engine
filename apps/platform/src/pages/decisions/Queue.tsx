;
import { SurfaceLayout } from '../../components/SurfaceLayout';
import { DecisionsView } from '../../components/vera';
import { ShieldCheck, History } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEnterprise } from '../../contexts/EnterpriseContext';

export default function DecisionSurface() {
  const { currentEnterprise } = useEnterprise();

  return (
    <SurfaceLayout
      surface="decisions"
      title="Decision Surface"
      subtitle="High-fidelity review and human sign-off"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary-light" size="sm">
            <History className="h-4 w-4 mr-2" />
            Decision History
          </Button>
          <Button variant="secondary" size="sm">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verify Signature
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
        <DecisionsView enterpriseId={currentEnterprise?.id || ''} />
      </div>
    </SurfaceLayout>
  );
}
