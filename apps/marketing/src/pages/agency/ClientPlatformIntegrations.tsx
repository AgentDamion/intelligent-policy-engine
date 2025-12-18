import { useEffect, useState } from 'react';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, Workflow } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AgencyPlatformConfigDialog } from '@/components/platform-integrations/AgencyPlatformConfigDialog';
import { PlatformCard } from '@/components/platform-integrations/PlatformCard';
import { IntegrationLogsTable } from '@/components/platform-integrations/IntegrationLogsTable';
import { useToast } from '@/hooks/use-toast';

const ClientPlatformIntegrations = () => {
  const { setMode } = useMode();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agencyWorkspaceId, setAgencyWorkspaceId] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');

  useEffect(() => {
    setMode('partner');
    loadAgencyData();
  }, [setMode]);

  const loadAgencyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get agency workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(enterprise_id)')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!membership) return;

      setAgencyWorkspaceId(membership.workspace_id);

      // Load clients
      const { data: relationships } = await supabase
        .from('client_agency_relationships')
        .select(`
          client_enterprise_id,
          enterprises!client_enterprise_id(id, name)
        `)
        .eq('agency_enterprise_id', membership.workspaces?.enterprise_id)
        .eq('status', 'active');

      const clientList = relationships?.map(rel => ({
        id: rel.client_enterprise_id,
        name: rel.enterprises?.name || 'Unknown'
      })) || [];

      setClients(clientList);

      // Load platform configurations
      await loadConfigurations(membership.workspace_id);
      await loadLogs();

    } catch (error) {
      console.error('Error loading agency data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform integrations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigurations = async (workspaceId: string) => {
    const { data, error } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('agency_workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading configurations:', error);
      return;
    }

    setConfigurations(data || []);
  };

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('platform_integration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading logs:', error);
      return;
    }

    setLogs(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    const { error } = await supabase
      .from('platform_configurations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Platform integration deleted',
    });

    loadConfigurations(agencyWorkspaceId);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('platform_configurations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
      return;
    }

    loadConfigurations(agencyWorkspaceId);
  };

  const handleTestConnection = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('platform-manager', {
      body: { action: 'test', config_id: id }
    });

    if (error || !data?.success) {
      toast({
        title: 'Connection Failed',
        description: data?.message || error?.message || 'Unable to connect',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Connection Successful',
      description: data.message,
    });
  };

  const handleSync = async (id: string, platformType: string) => {
    const { data, error } = await supabase.functions.invoke('platform-universal', {
      body: { config_id: id, sync_type: 'incremental' }
    });

    if (error || !data?.success) {
      toast({
        title: 'Sync Failed',
        description: data?.message || error?.message || 'Sync operation failed',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sync Completed',
      description: `${data.records_synced || 0} records synced`,
    });

    loadLogs();
  };

  const filteredConfigurations = selectedClient === 'all' 
    ? configurations 
    : configurations.filter(c => c.client_enterprise_id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Platform Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Manage platform integrations for your client enterprises
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client Integration
        </Button>
      </div>

      {/* Client Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Filter by Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedClient === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedClient('all')}
            >
              All Clients ({configurations.length})
            </Button>
            {clients.map(client => {
              const count = configurations.filter(c => c.client_enterprise_id === client.id).length;
              return (
                <Button
                  key={client.id}
                  variant={selectedClient === client.id ? 'default' : 'outline'}
                  onClick={() => setSelectedClient(client.id)}
                >
                  {client.name} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">
            <Workflow className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading integrations...
              </CardContent>
            </Card>
          ) : filteredConfigurations.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Integrations Yet</CardTitle>
                <CardDescription>
                  Add platform integrations for your clients to start automated compliance distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConfigurations.map((config) => (
                <PlatformCard
                  key={config.id}
                  config={config}
                  onDelete={handleDelete}
                  onTest={handleTestConnection}
                  onSync={handleSync}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Integration Activity Logs</CardTitle>
              <CardDescription>
                View sync operations, errors, and platform interactions across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationLogsTable logs={logs} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AgencyPlatformConfigDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => loadConfigurations(agencyWorkspaceId)}
        agencyWorkspaceId={agencyWorkspaceId}
      />
    </div>
  );
};

export default ClientPlatformIntegrations;
