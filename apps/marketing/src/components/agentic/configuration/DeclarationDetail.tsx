import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeclarationDetailProps {
  declarationId: string;
}

export function DeclarationDetail({ declarationId }: DeclarationDetailProps) {
  const { toast } = useToast();

  const { data: declaration, isLoading } = useQuery({
    queryKey: ['asset-declaration', declarationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_declarations')
        .select('*')
        .eq('id', declarationId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const downloadProofBundle = () => {
    if (!declaration?.proof_bundle_metadata) return;

    const blob = new Blob([JSON.stringify(declaration.proof_bundle_metadata, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-bundle-${declarationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Complete',
      description: 'Proof bundle downloaded successfully',
    });
  };

  if (isLoading) {
    return (
      <Card className="p-4 h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading details...
        </div>
      </Card>
    );
  }

  if (!declaration) {
    return (
      <Card className="p-4 h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Declaration not found
        </div>
      </Card>
    );
  }

  const tools = Array.isArray(declaration.tools_used) ? declaration.tools_used : [];

  return (
    <Card className="p-4 h-full">
      <ScrollArea className="h-full">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Declaration Details</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant={
                  declaration.validation_status === 'compliant'
                    ? 'default'
                    : declaration.validation_status === 'pending'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {declaration.validation_status}
              </Badge>
              <Badge variant="outline">
                {declaration.aggregated_risk_tier || 'N/A'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">File Name</p>
              <p className="text-sm text-muted-foreground">
                {declaration.file_name || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">File Hash (SHA-256)</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono break-all flex-1 bg-muted p-2 rounded">
                  {declaration.file_hash}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(declaration.file_hash, 'File hash')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {declaration.file_type && (
              <div>
                <p className="text-sm font-medium mb-1">File Type</p>
                <p className="text-sm text-muted-foreground">{declaration.file_type}</p>
              </div>
            )}

            {declaration.file_size_bytes && (
              <div>
                <p className="text-sm font-medium mb-1">File Size</p>
                <p className="text-sm text-muted-foreground">
                  {(declaration.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Declared At</p>
              <p className="text-sm text-muted-foreground">
                {new Date(declaration.declared_at).toLocaleString()}
              </p>
            </div>

            {declaration.validated_at && (
              <div>
                <p className="text-sm font-medium mb-1">Validated At</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(declaration.validated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">AI Tools Used</p>
            {tools.length > 0 ? (
              <div className="space-y-2">
                {tools.map((tool: any, idx: number) => (
                  <div key={idx} className="p-2 bg-muted rounded">
                    <p className="text-sm font-medium">{tool.tool_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {tool.risk_tier}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {tool.deployment_status}
                      </Badge>
                    </div>
                    {tool.how_used && (
                      <p className="text-xs text-muted-foreground mt-1">{tool.how_used}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tools declared</p>
            )}
          </div>

          {declaration.usage_description && (
            <div>
              <p className="text-sm font-medium mb-1">Usage Description</p>
              <p className="text-sm text-muted-foreground">{declaration.usage_description}</p>
            </div>
          )}

          {declaration.validation_result && (
            <div>
              <p className="text-sm font-medium mb-2">Validation Result</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {JSON.stringify(declaration.validation_result, null, 2)}
              </pre>
            </div>
          )}

          {declaration.proof_bundle_id && (
            <div>
              <p className="text-sm font-medium mb-1">Proof Bundle</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono flex-1 truncate">
                  {declaration.proof_bundle_id}
                </p>
                <Button size="sm" variant="outline" onClick={downloadProofBundle}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
