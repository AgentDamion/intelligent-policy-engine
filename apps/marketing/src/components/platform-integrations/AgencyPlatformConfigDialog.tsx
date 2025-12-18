import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgencyPlatformConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  agencyWorkspaceId: string;
}

const PLATFORM_TYPES = [
  { value: 'veeva_vault', label: 'Veeva Vault' },
  { value: 'salesforce_health_cloud', label: 'Salesforce Health Cloud' },
  { value: 'sharepoint', label: 'SharePoint' },
];

const AUTH_METHODS = [
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
];

interface ClientEnterprise {
  id: string;
  name: string;
}

interface BrandWorkspace {
  id: string;
  name: string;
  client_enterprise_id: string;
}

export const AgencyPlatformConfigDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  agencyWorkspaceId 
}: AgencyPlatformConfigDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<ClientEnterprise[]>([]);
  const [brandWorkspaces, setBrandWorkspaces] = useState<BrandWorkspace[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  
  const [formData, setFormData] = useState({
    platform_type: '',
    platform_name: '',
    auth_method: 'oauth2',
    endpoint_url: '',
    auto_sync_enabled: false,
    managed_by_agency: true,
  });

  const [credentialsJson, setCredentialsJson] = useState('{}');

  // Load clients and brand workspaces
  useEffect(() => {
    if (open) {
      loadClientsAndBrands();
    }
  }, [open, agencyWorkspaceId]);

  const loadClientsAndBrands = async () => {
    try {
      // Get agency's enterprise_id
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('enterprise_id')
        .eq('id', agencyWorkspaceId)
        .single();

      if (!workspaceData) return;

      // Get client relationships
      const { data: relationships } = await supabase
        .from('client_agency_relationships')
        .select(`
          client_enterprise_id,
          enterprises!client_enterprise_id(id, name)
        `)
        .eq('agency_enterprise_id', workspaceData.enterprise_id)
        .eq('status', 'active');

      const clientList = relationships?.map(rel => ({
        id: rel.client_enterprise_id,
        name: rel.enterprises?.name || 'Unknown'
      })) || [];

      setClients(clientList);

      // Load brand workspaces for this agency
      const { data: brands } = await supabase
        .from('brand_workspaces')
        .select('id, name, client_enterprise_id')
        .eq('agency_workspace_id', agencyWorkspaceId)
        .eq('is_active', true);

      setBrandWorkspaces(brands || []);

    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const filteredBrands = brandWorkspaces.filter(
    b => !selectedClientId || b.client_enterprise_id === selectedClientId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credentials = JSON.parse(credentialsJson);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get agency's enterprise_id
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('enterprise_id')
        .eq('id', agencyWorkspaceId)
        .single();

      if (!workspaceData) throw new Error('Workspace not found');

      const configData = {
        platform_type: formData.platform_type,
        platform_name: formData.platform_name,
        auth_method: formData.auth_method,
        endpoint_url: formData.endpoint_url,
        credentials,
        auto_sync_enabled: formData.auto_sync_enabled,
        enterprise_id: workspaceData.enterprise_id,
        workspace_id: selectedBrandId || agencyWorkspaceId,
        agency_workspace_id: agencyWorkspaceId,
        client_enterprise_id: selectedClientId || null,
        metadata: {
          managed_by_agency: true,
          created_via: 'agency_ui'
        },
        created_by: user.id,
        status: 'active'
      };

      const { error } = await supabase
        .from('platform_configurations')
        .insert(configData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Platform integration created for client',
      });

      handleReset();
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error creating platform config:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create platform integration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      platform_type: '',
      platform_name: '',
      auth_method: 'oauth2',
      endpoint_url: '',
      auto_sync_enabled: false,
      managed_by_agency: true,
    });
    setCredentialsJson('{}');
    setSelectedClientId('');
    setSelectedBrandId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Client Platform Integration</DialogTitle>
          <DialogDescription>
            Configure a platform integration on behalf of your client
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client & Brand Selection */}
          <div className="border-b pb-4 mb-4">
            <h4 className="font-medium mb-3">Client Assignment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Enterprise</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand Workspace (Optional)</Label>
                <Select 
                  value={selectedBrandId} 
                  onValueChange={setSelectedBrandId}
                  disabled={!selectedClientId}
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select brand workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Platform Configuration */}
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
                placeholder="e.g., Client Production Veeva"
                value={formData.platform_name}
                onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth_method">Authentication</Label>
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
              placeholder='{"api_key": "client-key", "secret": "client-secret"}'
              value={credentialsJson}
              onChange={(e) => setCredentialsJson(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              🔒 Client credentials are encrypted and managed by your agency
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
            <Button type="submit" disabled={isLoading || !selectedClientId}>
              {isLoading ? 'Creating...' : 'Create Integration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
