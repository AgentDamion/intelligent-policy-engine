import { useEffect, useState } from 'react';
import { useMode } from '@/contexts/ModeContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Plug, TestTube } from 'lucide-react';
import { usePlatformIntegrations } from '@/hooks/usePlatformIntegrations';
import { AddPlatformDialog } from '@/components/platform-integrations/AddPlatformDialog';
import { PlatformCard } from '@/components/platform-integrations/PlatformCard';
import { IntegrationLogsTable } from '@/components/platform-integrations/IntegrationLogsTable';

const PlatformIntegrations = () => {
  const { setMode } = useMode();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    configurations,
    logs,
    isLoadingConfigurations,
    isLoadingLogs,
    createConfiguration,
    deleteConfiguration,
    updateConfiguration,
    testConnection,
    triggerSync,
    isCreating,
  } = usePlatformIntegrations();

  useEffect(() => {
    setMode('enterprise');
  }, [setMode]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      deleteConfiguration(id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateConfiguration({ id, input: { status: newStatus } });
  };

  const handleSync = (id: string, platformType: string) => {
    triggerSync({ id, platformType });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect and manage external platforms for automated compliance document distribution
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/enterprise/platform-integrations-demo')}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Demo & Test
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {isLoadingConfigurations ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading integrations...
              </CardContent>
            </Card>
          ) : configurations.length === 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plug className="h-5 w-5 text-primary" />
                  <CardTitle>No Integrations Yet</CardTitle>
                </div>
                <CardDescription>
                  Get started by adding your first platform integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configurations.map((config) => (
                <PlatformCard
                  key={config.id}
                  config={config}
                  onDelete={handleDelete}
                  onTest={testConnection}
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
                View sync operations, errors, and platform interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationLogsTable logs={logs} isLoading={isLoadingLogs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddPlatformDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={createConfiguration}
        isLoading={isCreating}
      />
    </div>
  );
};

export default PlatformIntegrations;
