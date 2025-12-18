import { CheckCircle, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DeclarationReceiptProps {
  data: {
    declaration_id: string;
    file_hash: string;
    proof_bundle_id: string;
    validation_status: string;
    aggregated_risk_tier: string;
    tools_used: Array<{ tool_name: string; risk_tier: string }>;
    declared_at: string;
  };
  onClose: () => void;
}

export function DeclarationReceipt({ data, onClose }: DeclarationReceiptProps) {
  const { toast } = useToast();

  const downloadReceipt = () => {
    const receiptData = JSON.stringify(data, null, 2);
    const blob = new Blob([receiptData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-declaration-${data.declaration_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Receipt Downloaded',
      description: 'Asset declaration receipt saved successfully',
    });
  };

  const copyProofBundleId = () => {
    navigator.clipboard.writeText(data.proof_bundle_id);
    toast({
      title: 'Copied',
      description: 'Proof Bundle ID copied to clipboard',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Declaration Submitted Successfully</h2>
        <p className="text-muted-foreground">
          Your asset has been registered and validated against policy
        </p>
      </div>

      <div className="border rounded-lg p-6 space-y-4 bg-muted/50">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Declaration ID</p>
          <p className="font-mono text-sm">{data.declaration_id}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Proof Bundle ID</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm flex-1 truncate">{data.proof_bundle_id}</p>
            <Button size="sm" variant="ghost" onClick={copyProofBundleId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">File Hash (SHA-256)</p>
          <p className="font-mono text-xs break-all">{data.file_hash}</p>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge variant={data.validation_status === 'compliant' ? 'default' : 'destructive'}>
              {data.validation_status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Risk Tier</p>
            <Badge variant="outline">{data.aggregated_risk_tier}</Badge>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Tools Declared</p>
          <div className="flex flex-wrap gap-2">
            {data.tools_used.map((tool, idx) => (
              <Badge key={idx} variant="secondary">
                {tool.tool_name} ({tool.risk_tier})
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Declared At</p>
          <p className="text-sm">{new Date(data.declared_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={downloadReceipt} variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download Receipt
        </Button>
        <Button onClick={onClose} className="flex-1">
          Declare Another Asset
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Keep this receipt as proof of compliant AI tool usage for audit purposes
      </p>
    </div>
  );
}
