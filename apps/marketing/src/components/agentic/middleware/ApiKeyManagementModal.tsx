import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Trash2, Key, AlertCircle } from 'lucide-react';
import { usePartnerApiKeys } from '@/hooks/usePartnerApiKeys';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ApiKeyManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApiKeyManagementModal = ({
  open,
  onOpenChange,
}: ApiKeyManagementModalProps) => {
  const { keys, loading, createKey, revokeKey } = usePartnerApiKeys();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    partner_id: '',
    enterprise_id: '',
    rate_limit_tier: 'standard',
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.partner_id || !formData.enterprise_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const fullKey = await createKey(formData);
    if (fullKey) {
      setCreatedKey(fullKey);
      setShowCreateForm(false);
      setFormData({ name: '', partner_id: '', enterprise_id: '', rate_limit_tier: 'standard' });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const confirmRevoke = async () => {
    if (revokeKeyId) {
      await revokeKey(revokeKeyId);
      setRevokeKeyId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>API Key Management</DialogTitle>
            <DialogDescription>
              Create and manage partner API keys for middleware access
            </DialogDescription>
          </DialogHeader>

          {createdKey && (
            <div className="bg-green-50 border border-green-200 p-s4 rounded-r1">
              <div className="flex items-start gap-s3">
                <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-green-800 mb-s2">
                    API Key Created Successfully!
                  </p>
                  <p className="text-[12px] text-green-700 mb-s3">
                    Copy this key now - it will never be shown again for security reasons.
                  </p>
                  <div className="flex items-center gap-s2">
                    <code className="flex-1 bg-white px-s3 py-s2 rounded border border-green-300 text-[12px] font-mono">
                      {createdKey}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => handleCopyKey(createdKey)}
                      variant="outline"
                    >
                      <Copy className="h-3 w-3 mr-s1" />
                      Copy
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCreatedKey(null)}
                    className="mt-s2"
                  >
                    I've saved it, dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-s2" />
              Create New API Key
            </Button>
          )}

          {showCreateForm && (
            <div className="border border-ink-200 rounded-r1 p-s4 space-y-s3">
              <h3 className="text-[14px] font-semibold text-ink-900">Create New API Key</h3>
              <div className="space-y-s3">
                <div>
                  <Label>Key Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Production Key"
                  />
                </div>
                <div>
                  <Label>Partner ID *</Label>
                  <Input
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                    placeholder="partner-uuid"
                  />
                </div>
                <div>
                  <Label>Enterprise ID *</Label>
                  <Input
                    value={formData.enterprise_id}
                    onChange={(e) => setFormData({ ...formData, enterprise_id: e.target.value })}
                    placeholder="enterprise-uuid"
                  />
                </div>
                <div>
                  <Label>Rate Limit Tier</Label>
                  <Select
                    value={formData.rate_limit_tier}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rate_limit_tier: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget (100/day)</SelectItem>
                      <SelectItem value="standard">Standard (1000/day)</SelectItem>
                      <SelectItem value="premium">Premium (10000/day)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-s2">
                <Button onClick={handleCreate} className="flex-1">
                  Generate Key
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-s2">
            <h3 className="text-[14px] font-semibold text-ink-900">Existing Keys</h3>
            {loading ? (
              <p className="text-[13px] text-ink-500">Loading keys...</p>
            ) : keys.length === 0 ? (
              <p className="text-[13px] text-ink-500">No API keys created yet</p>
            ) : (
              <div className="space-y-s2">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="border border-ink-200 rounded-r1 p-s3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-s2 mb-s1">
                        <Key className="h-4 w-4 text-ink-500" />
                        <span className="text-[13px] font-semibold text-ink-900">
                          {key.name || 'Unnamed Key'}
                        </span>
                        <Badge 
                          variant={key.is_active ? 'default' : 'secondary'}
                          className={key.is_active ? 'bg-green-100 text-green-800 border-green-300' : ''}
                        >
                          {key.is_active ? 'Active' : 'Revoked'}
                        </Badge>
                        <Badge variant="outline">{key.rate_limit_tier}</Badge>
                      </div>
                      <p className="text-[12px] font-mono text-ink-500">
                        {key.key_prefix}...
                      </p>
                      <p className="text-[11px] text-ink-400">
                        Last used:{' '}
                        {key.last_used_at
                          ? formatDistanceToNow(new Date(key.last_used_at), {
                              addSuffix: true,
                            })
                          : 'Never'}
                      </p>
                    </div>
                    {key.is_active && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRevokeKeyId(key.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeKeyId} onOpenChange={() => setRevokeKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The API key will be permanently revoked and any
              applications using it will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke}>Revoke Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
