import { useState } from 'react';
import { SurfaceLayout } from '../../components/SurfaceLayout';
import { ProofBundleList } from '../../components/vera';
import { ProofBundleViewer } from '../../components/vera/ProofBundleViewer';
import { Share2, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import SplitView from '../../components/layout/SplitView';
import EmptyState from '../../components/ui/EmptyState';

export default function EvidenceVault() {
  const { currentEnterprise } = useEnterprise();
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  return (
    <SurfaceLayout
      surface="proof"
      title="Evidence Vault"
      subtitle="Immutable audit trails and cryptographic proof bundles"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Bulk Export
          </Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
            <Share2 className="h-4 w-4 mr-2" />
            Share Trust Center
          </Button>
        </div>
      }
    >
      <SplitView
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        leftClassName="md:w-[420px]"
        left={
          <ProofBundleList
            enterpriseId={currentEnterprise?.id || ''}
            onSelectBundle={(id) => setSelectedBundleId(id)}
            className="h-full"
          />
        }
        main={
          <div className="h-full bg-slate-50/50">
            {!selectedBundleId ? (
              <EmptyState
                title="Select a proof bundle"
                description="Proof bundles are automatically generated from signed decisions. Select a bundle to inspect its contents, verify hashes, and export regulator packages."
                actions={[
                  { label: 'Go to Decisions', href: '/decisions', variant: 'outline' },
                ]}
                className="h-full"
              />
            ) : (
              <ProofBundleViewer proofBundleId={selectedBundleId} className="h-full" />
            )}
          </div>
        }
      />
    </SurfaceLayout>
  );
}
