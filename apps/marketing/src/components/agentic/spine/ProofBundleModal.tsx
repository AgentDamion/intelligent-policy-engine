import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ACButton } from '@/components/agentic/ac/ACButton';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ProofBundleModalProps {
  open: boolean;
  onClose: () => void;
  bundle: any;
}

export const ProofBundleModal = ({ open, onClose, bundle }: ProofBundleModalProps) => {
  if (!bundle) return null;
  
  const copyToClipboard = () => {
    const summary = `Proof Bundle: ${bundle.bundleId}\nClaim: ${bundle.claim}\nCreated: ${bundle.createdAt}`;
    navigator.clipboard.writeText(summary);
    toast.success('Copied to clipboard');
  };
  
  const exportJSON = () => {
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-bundle-${bundle.bundleId}.json`;
    a.click();
    toast.success('Exported proof bundle');
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-modal="true" data-proof-open>
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">Proof Bundle</DialogTitle>
          <DialogDescription className="text-[12px] font-mono text-ink-500">
            {bundle.bundleId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-s4 max-h-[500px] overflow-y-auto">
          <div className="space-y-s2 text-[12px]">
            <div className="flex justify-between py-s2 border-b border-ink-100">
              <span className="text-ink-500">Claim Type</span>
              <span className="font-mono text-ink-900">{bundle.claim}</span>
            </div>
            <div className="flex justify-between py-s2 border-b border-ink-100">
              <span className="text-ink-500">Policy Instance</span>
              <span className="font-mono text-ink-900">{bundle.scope?.policyInstanceId}</span>
            </div>
            <div className="flex justify-between py-s2 border-b border-ink-100">
              <span className="text-ink-500">Tool Version</span>
              <span className="font-mono text-ink-900">{bundle.scope?.toolVersionId}</span>
            </div>
            <div className="flex justify-between py-s2 border-b border-ink-100">
              <span className="text-ink-500">Checks Run</span>
              <span className="font-mono text-ink-900">{bundle.evidenceManifest?.checksRun}</span>
            </div>
            <div className="flex justify-between py-s2 border-b border-ink-100">
              <span className="text-ink-500">Signature</span>
              <span className="font-mono text-ink-500 truncate max-w-[300px]">{bundle.signature}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-s2 pt-s3 border-t border-ink-100">
          <ACButton onClick={copyToClipboard} variant="secondary">
            <Copy className="h-4 w-4 mr-s1" />
            Copy Summary
          </ACButton>
          <ACButton onClick={exportJSON} variant="secondary">
            <Download className="h-4 w-4 mr-s1" />
            Export JSON
          </ACButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
