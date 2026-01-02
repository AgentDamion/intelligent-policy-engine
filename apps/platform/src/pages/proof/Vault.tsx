import { useState, useEffect } from 'react';
import { SurfaceLayout } from '../../components/SurfaceLayout';
import { ProofBundleList } from '../../components/vera';
import { ProofBundleDetailViewer } from '../../components/proof-bundle/ProofBundleDetailViewer';
import { ProofBundleBatchViewer } from '../../components/proof-bundle/ProofBundleBatchViewer';
import { Share2, FileDown } from 'lucide-react';
import { AICOMPLYRButton as Button } from '../../components/ui/aicomplyr-button';
import { useEnterprise } from '../../contexts/EnterpriseContext';
import SplitView from '../../components/layout/SplitView';
import EmptyState from '../../components/ui/EmptyState';
import ProofBundleCard from '@/components/proof-bundle/ProofBundleCard';
import { supabase } from '@/lib/supabase';

export default function EvidenceVault() {
  const { currentEnterprise } = useEnterprise();
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [bundleType, setBundleType] = useState<'single' | 'batch' | null>(null);

  // Fetch bundle type when bundle ID changes
  useEffect(() => {
    const fetchBundleType = async () => {
      if (!selectedBundleId) {
        setBundleType(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('proof_bundles')
          .select('bundle_type')
          .eq('id', selectedBundleId)
          .single();

        if (error) {
          console.error('Error fetching bundle type:', error);
          // Default to single if we can't determine
          setBundleType('single');
          return;
        }

        setBundleType((data?.bundle_type as 'single' | 'batch') || 'single');
      } catch (err) {
        console.error('Error fetching bundle type:', err);
        setBundleType('single'); // Default to single
      }
    };

    fetchBundleType();
  }, [selectedBundleId]);

  return (
    <SurfaceLayout
      surface="proof"
      title="Evidence Vault"
      subtitle="Immutable audit trails and cryptographic proof bundles"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary-light">
            <FileDown className="w-4 h-4" />
            Bulk Export
          </Button>
          <Button variant="secondary">
            <Share2 className="w-4 h-4" />
            Share Trust Center
          </Button>
        </div>
      }
    >
      <SplitView
        className="bg-white border border-neutral-200 overflow-hidden"
        leftClassName="md:w-[420px]"
        left={
          <ProofBundleList
            enterpriseId={currentEnterprise?.id || ''}
            onSelectBundle={(id) => setSelectedBundleId(id)}
            className="h-full"
          />
        }
        main={
          <div className="h-full bg-neutral-100">
            {!selectedBundleId ? (
              <div className="p-6 space-y-4">
                <EmptyState
                  title="Select a proof bundle"
                  description="Proof bundles are automatically generated from signed decisions. Select a bundle to inspect its contents, verify hashes, and export regulator packages."
                  actions={[
                    { label: 'Go to Decisions', href: '/decisions', variant: 'outline' },
                  ]}
                  className="bg-white border border-neutral-200"
                />
                <ProofBundleCard
                  boundary="AstraZeneca → Horizon Creative"
                  tool="Midjourney v6.1"
                  useCase="HCP campaign imagery"
                  riskLevel="high"
                  policyId="AIG-Pharma-2024.03.2"
                  conditions="Human review required"
                  approver="Sarah Chen"
                  authority="VP Compliance, MLR Final"
                  timestamp="2024-12-28T14:32:07Z"
                  decisionId="DEC-2024-0847-EC-AP"
                />
              </div>
            ) : bundleType === 'batch' ? (
              <ProofBundleBatchViewer bundleId={selectedBundleId} className="h-full" />
            ) : (
              <ProofBundleDetailViewer proofBundleId={selectedBundleId} className="h-full" />
            )}
          </div>
        }
      />
    </SurfaceLayout>
  );
}
