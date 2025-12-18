import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PartnerKey {
  id: string;
  key_prefix: string;
  partner_id: string;
  rate_limit_tier: string;
  expires_at: string;
  is_active: boolean;
  name: string;
  last_used_at?: string;
}

/**
 * PartnerCredentialsPanel - API Key Management with ConfigurationAgent
 */
export function PartnerCredentialsPanel() {
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [keyModal, setKeyModal] = useState<{ open: boolean; rawKey?: string; warning?: string }>({ open: false });
  const [copiedKey, setCopiedKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partner keys
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['partner-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PartnerKey[];
    }
  });

  // Generate new key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'configuration',
          action: 'generate_partner_key',
          payload: {
            partner_id: 'default-partner',
            enterprise_id: 'default-enterprise',
            rate_limit_tier: 'standard',
            validity_days: 365,
            name: `API Key - ${new Date().toLocaleDateString()}`
          }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.raw_key) {
        setKeyModal({ 
          open: true, 
          rawKey: data.raw_key, 
          warning: data.warning 
        });
        queryClient.invalidateQueries({ queryKey: ['partner-keys'] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Key generation failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const toggleKeyVisibility = (idx: number) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const copyKeyToClipboard = async () => {
    if (keyModal.rawKey) {
      await navigator.clipboard.writeText(keyModal.rawKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast({
        title: 'Key copied to clipboard',
        description: 'Store this key securely. It will not be shown again.'
      });
    }
  };

  const getStatusColor = (expires_at: string, is_active: boolean) => {
    if (!is_active) return 'bg-muted text-muted-foreground';
    const daysUntilExpiry = Math.ceil((new Date(expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) return 'bg-destructive/10 text-destructive';
    if (daysUntilExpiry <= 30) return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  };

  const getStatusLabel = (expires_at: string, is_active: boolean) => {
    if (!is_active) return 'inactive';
    const daysUntilExpiry = Math.ceil((new Date(expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring soon';
    return 'active';
  };

  return (
    <>
      <div className="h-full flex">
        {/* Center Panel: API Key List */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Partner API Keys</h2>
            <Button 
              size="sm" 
              onClick={() => generateKeyMutation.mutate()}
              disabled={generateKeyMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {generateKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          ) : keys.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No API keys generated yet</p>
              <p className="text-xs text-muted-foreground mt-2">Click "Generate Key" to create your first partner API key</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {keys.map((key, idx) => (
                <Card key={key.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{key.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {key.key_prefix}...
                        </code>
                        <button 
                          onClick={() => toggleKeyVisibility(idx)}
                          className="p-1 hover:bg-muted rounded"
                          title="Key prefix only (full key never stored)"
                        >
                          {visibleKeys.has(idx) ? 
                            <EyeOff className="h-3 w-3 text-muted-foreground" /> : 
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          }
                        </button>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(key.expires_at, key.is_active)}`}>
                      {getStatusLabel(key.expires_at, key.is_active)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tier: <span className="font-semibold uppercase">{key.rate_limit_tier}</span></span>
                    <span className="text-muted-foreground">Expires: <span className="font-semibold">{new Date(key.expires_at).toLocaleDateString()}</span></span>
                  </div>
                  {key.last_used_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Last used: {new Date(key.last_used_at).toLocaleString()}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

      {/* Right Panel: Key Management Info */}
      <div className="w-96 overflow-y-auto p-6 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-4">Key Lifecycle Management</h3>
        
        <Card className="p-4 mb-4 border-l-4 border-l-warning">
          <p className="text-sm font-semibold text-warning mb-1">Security Notice</p>
          <p className="text-xs text-muted-foreground">
            API keys are displayed in full only once at creation. Store them securely - they cannot be retrieved later.
          </p>
        </Card>

        <div className="mt-6">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">RATE LIMIT TIERS</h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">ENTERPRISE</p>
              <p className="text-xs text-muted-foreground">Unlimited req/day • Priority support</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">PREMIUM</p>
              <p className="text-xs text-muted-foreground">10,000 req/day • No throttling</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">STANDARD</p>
              <p className="text-xs text-muted-foreground">1,000 req/day • 10 req/sec</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">BUDGET</p>
              <p className="text-xs text-muted-foreground">100 req/day • 1 req/sec</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* One-time key display modal */}
    <Dialog open={keyModal.open} onOpenChange={(open) => setKeyModal({ open })}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            API Key Generated Successfully
          </DialogTitle>
          <DialogDescription className="text-destructive font-semibold">
            {keyModal.warning}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg border-2 border-warning">
            <p className="text-sm font-semibold mb-2">Your API Key (shown once):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-background px-3 py-2 rounded font-mono break-all">
                {keyModal.rawKey}
              </code>
              <Button 
                size="sm" 
                variant="outline"
                onClick={copyKeyToClipboard}
              >
                {copiedKey ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Important:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Store this key in a secure location (password manager, secrets vault)</li>
              <li>Never commit this key to version control or expose it in client-side code</li>
              <li>This key will not be shown again - if lost, you must generate a new one</li>
              <li>The key is stored as a bcrypt hash and cannot be recovered</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
