import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Download } from 'lucide-react';
import { useSandboxRun } from '@/hooks/useSandbox';
import { YAMLViewer } from '../shared/YAMLViewer';
import { useToast } from '@/hooks/use-toast';
import { PolicyInstanceService } from '@/services/policyInstanceService';
import type { PolicyInstance } from '@/types/policyInstance';

interface SandboxRightPanelProps {
  selectedRunId: string | null;
  workspaceId: string;
}

export function SandboxRightPanel({
  selectedRunId,
  workspaceId
}: SandboxRightPanelProps) {
  const { run, events } = useSandboxRun(selectedRunId || null);
  const { toast } = useToast();
  const [policyInstance, setPolicyInstance] = useState<PolicyInstance | null>(null);

  // Fetch policy instance details when run changes
  useEffect(() => {
    if (run?.policy_id) {
      PolicyInstanceService.getInstance(run.policy_id).then(setPolicyInstance);
    }
  }, [run]);

  const handleCopyInput = async () => {
    if (!run) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(run.inputs_json, null, 2));
      toast({ title: 'Copied to clipboard' });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to copy',
        description: 'Unable to copy to clipboard'
      });
    }
  };

  const handleVerifyBlockchain = () => {
    if (!run) return;
    const explorerUrl = `https://aicomply-proof-verifier.com/verify/${run.proof_hash}`;
    window.open(explorerUrl, '_blank');
    
    toast({ 
      title: 'Opening proof verifier',
      description: 'Verify cryptographic integrity in new tab'
    });
  };

  if (!selectedRunId) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-muted/20">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Select a simulation to view details
          </p>
          <div className="text-xs text-muted-foreground/60">
            Click on any simulation result to inspect
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col bg-background" 
      role="complementary" 
      aria-label="Simulation inspector panel"
      aria-live="polite"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Inspector</h3>
          {run && (
            <Badge variant="outline" className="text-xs">
              Run #{run.id.slice(0, 8)}
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {run && (
            <>
              {/* Active Policy Details */}
              {policyInstance && (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Active Policy</h4>
                      <Badge variant="outline">{policyInstance.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="font-medium">Use Case:</span>{' '}
                        <span className="text-muted-foreground">{policyInstance.use_case}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Jurisdiction:</span>{' '}
                        <span className="text-muted-foreground">
                          {policyInstance.jurisdiction.join(', ')}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Audience:</span>{' '}
                        <span className="text-muted-foreground">
                          {policyInstance.audience.join(', ')}
                        </span>
                      </div>
                      {policyInstance.approved_by && (
                        <div className="text-xs">
                          <span className="font-medium">Approved:</span>{' '}
                          <span className="text-muted-foreground">
                            {new Date(policyInstance.approved_at!).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Download className="h-3 w-3 mr-2" />
                      View POM
                    </Button>
                  </div>
                </Card>
              )}

              {/* Run Overview */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge
                      variant={
                        run.status === 'completed' ? 'default' :
                        run.status === 'failed' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {run.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <span className="text-sm font-semibold">
                      {run.outputs_json?.compliance_score || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enforcement Level</span>
                    <Badge variant="outline" className="capitalize">{run.control_level}</Badge>
                  </div>
                </div>
              </Card>

              {/* AI Signals */}
              {run.outputs_json?.risk_flags && run.outputs_json.risk_flags.length > 0 && (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">⚠️ Risk Flags</h4>
                      <Badge variant="destructive" className="text-xs">
                        {run.outputs_json.risk_flags.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {run.outputs_json.risk_flags.map((flag, idx) => (
                        <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-2 border-l-red-500">
                          {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Input Data */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Input Configuration</h4>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleCopyInput}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <YAMLViewer data={run.inputs_json} />
                </div>
              </Card>

              {/* Governance Events */}
              {events.length > 0 && (
                <Card className="p-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Activity Log</h4>
                    <div className="space-y-2">
                      {events.slice(0, 5).map((event) => (
                        <div key={event.id} className="text-xs p-2 bg-muted rounded">
                          <div className="font-medium">{event.action}</div>
                          <div className="text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Compliance Certificate */}
              <Card className="p-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Compliance Certificate</h4>
                  <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                    {run.proof_hash}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleVerifyBlockchain}>
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Verify on Blockchain
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
