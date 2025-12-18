import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EvidenceTabProps {
  workspaceId: string;
}

export function EvidenceTab({ workspaceId }: EvidenceTabProps) {
  const { toast } = useToast();
  
  // Mock proof bundles
  const proofBundles = [
    { id: '1', name: 'Q1 2024 Compliance Proof', date: '2024-01-15', runs: 145, size: '2.4 MB' },
    { id: '2', name: 'Security Audit Bundle', date: '2024-01-10', runs: 89, size: '1.8 MB' },
    { id: '3', name: 'Monthly Governance Report', date: '2024-01-05', runs: 234, size: '3.2 MB' },
  ];

  const handleDownloadBundle = (bundle: typeof proofBundles[0]) => {
    try {
      const mockBundle = {
        bundle_id: bundle.id,
        name: bundle.name,
        workspace_id: workspaceId,
        generated_at: bundle.date,
        total_runs: bundle.runs,
        proof_data: {
          cryptographic_hash: `sha256:${Math.random().toString(36).substring(2, 15)}`,
          verification_url: `https://aicomply-proof-verifier.com/bundle/${bundle.id}`
        }
      };
      
      const blob = new Blob([JSON.stringify(mockBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bundle.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Proof bundle downloaded' });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Download failed',
        description: 'Unable to download proof bundle'
      });
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-4">Proof Bundles</h3>
          <div className="space-y-3">
            {proofBundles.map((bundle) => (
              <Card key={bundle.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{bundle.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {bundle.date} · {bundle.runs} runs · {bundle.size}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadBundle(bundle)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
