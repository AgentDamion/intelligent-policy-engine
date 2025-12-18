import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CreatePlatformConfigInput } from '@/services/platform-integrations-api';

interface AddPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePlatformConfigInput) => void;
  isLoading?: boolean;
}

const PLATFORM_TYPES = [
  { value: 'veeva', label: 'Veeva Vault' },
  { value: 'sharepoint', label: 'SharePoint' },
  { value: 'box', label: 'Box' },
  { value: 'dropbox', label: 'Dropbox' },
  { value: 'google_drive', label: 'Google Drive' },
];

const AUTH_METHODS = [
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
];

export const AddPlatformDialog = ({ open, onOpenChange, onSubmit, isLoading }: AddPlatformDialogProps) => {
  const [formData, setFormData] = useState<CreatePlatformConfigInput>({
    platform_type: '',
    platform_name: '',
    auth_method: 'oauth2',
    credentials: {},
    endpoint_url: '',
    auto_sync_enabled: false,
  });

  const [credentialsJson, setCredentialsJson] = useState('{}');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const credentials = JSON.parse(credentialsJson);
      onSubmit({ ...formData, credentials });
      handleReset();
    } catch (error) {
      alert('Invalid JSON in credentials field');
    }
  };

  const handleReset = () => {
    setFormData({
      platform_type: '',
      platform_name: '',
      auth_method: 'oauth2',
      credentials: {},
      endpoint_url: '',
      auto_sync_enabled: false,
    });
    setCredentialsJson('{}');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Platform Integration</DialogTitle>
          <DialogDescription>
            Connect a new platform for automated compliance document distribution
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform_type">Platform Type</Label>
              <Select
                value={formData.platform_type}
                onValueChange={(value) => setFormData({ ...formData, platform_type: value })}
              >
                <SelectTrigger id="platform_type">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                placeholder="e.g., Production Veeva"
                value={formData.platform_name}
                onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth_method">Authentication Method</Label>
              <Select
                value={formData.auth_method}
                onValueChange={(value) => setFormData({ ...formData, auth_method: value })}
              >
                <SelectTrigger id="auth_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint_url">Endpoint URL</Label>
              <Input
                id="endpoint_url"
                type="url"
                placeholder="https://api.example.com"
                value={formData.endpoint_url}
                onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentials">Credentials (JSON)</Label>
            <Textarea
              id="credentials"
              placeholder='{"api_key": "your-key", "secret": "your-secret"}'
              value={credentialsJson}
              onChange={(e) => setCredentialsJson(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter credentials as JSON. These will be encrypted.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto_sync"
              checked={formData.auto_sync_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_sync_enabled: checked })}
            />
            <Label htmlFor="auto_sync">Enable automatic sync</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Integration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
