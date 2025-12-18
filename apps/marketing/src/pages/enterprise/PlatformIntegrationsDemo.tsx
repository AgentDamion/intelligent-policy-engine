import { useState } from 'react';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TestTube, 
  Send, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Copy,
  Webhook,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PlatformIntegrationsDemo = () => {
  const { setMode } = useMode();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('connection');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Demo form state
  const [demoConfig, setDemoConfig] = useState({
    platform_type: 'veeva',
    platform_name: 'Demo Veeva Instance',
    endpoint_url: 'https://demo.veevavault.com',
    username: 'demo@test.com',
    password: 'demo123',
    configId: '',
  });

  const [syncPayload, setSyncPayload] = useState({
    submissionIds: '',
    policyIds: '',
    includeAudit: true,
  });

  const [webhookPayload, setWebhookPayload] = useState(JSON.stringify({
    config_id: 'your-config-id-here',
    platform_type: 'veeva',
    event_type: 'sync_completed',
    data: {
      records_synced: 25,
      timestamp: new Date().toISOString()
    }
  }, null, 2));

  useState(() => {
    setMode('enterprise');
  });

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('platform-manager', {
        body: {
          action: 'test',
          platform_type: demoConfig.platform_type,
          config: {
            endpoint_url: demoConfig.endpoint_url,
            credentials: {
              username: demoConfig.username,
              password: demoConfig.password
            }
          }
        }
      });

      if (error) throw error;

      setTestResults({
        success: data?.success || false,
        message: data?.message || 'Connection test completed',
        timestamp: new Date().toISOString(),
        details: data
      });

      toast({
        title: data?.success ? 'Success' : 'Failed',
        description: data?.message,
        variant: data?.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!demoConfig.configId) {
      toast({
        title: 'Missing Config ID',
        description: 'Please enter a Platform Configuration ID first',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('platform-universal', {
        body: {
          config_id: demoConfig.configId,
          filters: {
            submission_ids: syncPayload.submissionIds.split(',').filter(id => id.trim()),
            policy_ids: syncPayload.policyIds.split(',').filter(id => id.trim()),
            include_audit: syncPayload.includeAudit
          }
        }
      });

      if (error) throw error;

      setTestResults({
        success: data?.success || false,
        message: `Sync ${data?.success ? 'completed' : 'failed'}`,
        timestamp: new Date().toISOString(),
        details: data
      });

      toast({
        title: data?.success ? 'Sync Started' : 'Sync Failed',
        description: data?.message || 'Check results below',
        variant: data?.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebhookTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const payload = JSON.parse(webhookPayload);
      
      const { data, error } = await supabase.functions.invoke('platform-webhook', {
        body: payload,
        headers: {
          'x-webhook-signature': 'demo-signature-12345'
        }
      });

      if (error) throw error;

      setTestResults({
        success: data?.success || false,
        message: 'Webhook processed',
        timestamp: new Date().toISOString(),
        details: data
      });

      toast({
        title: data?.success ? 'Webhook Received' : 'Webhook Failed',
        description: data?.result?.status || 'Check results below'
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard'
    });
  };

  const projectId = 'dqemokpnzasbeytdbzei';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Integrations Demo</h1>
          <p className="text-muted-foreground mt-2">
            Test edge functions and platform adapters without real credentials
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <TestTube className="h-4 w-4 mr-2" />
          Demo Mode
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Test</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Platform Connection</CardTitle>
              <CardDescription>
                Tests the platform-manager edge function with mock credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform Type</Label>
                  <Select 
                    value={demoConfig.platform_type} 
                    onValueChange={(value) => setDemoConfig({...demoConfig, platform_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veeva">Veeva Vault</SelectItem>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="sharepoint">SharePoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input 
                    value={demoConfig.platform_name}
                    onChange={(e) => setDemoConfig({...demoConfig, platform_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endpoint URL</Label>
                <Input 
                  value={demoConfig.endpoint_url}
                  onChange={(e) => setDemoConfig({...demoConfig, endpoint_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username (Demo)</Label>
                  <Input 
                    value={demoConfig.username}
                    onChange={(e) => setDemoConfig({...demoConfig, username: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password (Demo)</Label>
                  <Input 
                    type="password"
                    value={demoConfig.password}
                    onChange={(e) => setDemoConfig({...demoConfig, password: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                onClick={handleTestConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trigger Data Sync</CardTitle>
              <CardDescription>
                Tests the platform-universal edge function for data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Platform Configuration ID</Label>
                <Input 
                  value={demoConfig.configId}
                  onChange={(e) => setDemoConfig({...demoConfig, configId: e.target.value})}
                  placeholder="Enter UUID from platform_configurations table"
                />
                <p className="text-xs text-muted-foreground">
                  Get this from the Platform Integrations page or database
                </p>
              </div>

              <div className="space-y-2">
                <Label>Submission IDs (comma-separated, optional)</Label>
                <Input 
                  value={syncPayload.submissionIds}
                  onChange={(e) => setSyncPayload({...syncPayload, submissionIds: e.target.value})}
                  placeholder="uuid1, uuid2, uuid3"
                />
              </div>

              <div className="space-y-2">
                <Label>Policy IDs (comma-separated, optional)</Label>
                <Input 
                  value={syncPayload.policyIds}
                  onChange={(e) => setSyncPayload({...syncPayload, policyIds: e.target.value})}
                  placeholder="uuid1, uuid2, uuid3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="includeAudit"
                  checked={syncPayload.includeAudit}
                  onChange={(e) => setSyncPayload({...syncPayload, includeAudit: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="includeAudit">Include audit events</Label>
              </div>

              <Button 
                onClick={handleTriggerSync} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Trigger Sync
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook Endpoint</CardTitle>
              <CardDescription>
                Send a test webhook payload to the platform-webhook edge function
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Webhook URL</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`https://${projectId}.supabase.co/functions/v1/platform-webhook`)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <Input 
                  value={`https://${projectId}.supabase.co/functions/v1/platform-webhook`}
                  readOnly
                  className="font-mono text-xs bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook Payload (JSON)</Label>
                <Textarea 
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  className="font-mono text-xs min-h-[300px]"
                  placeholder='{"event_type": "sync_completed", ...}'
                />
                <p className="text-xs text-muted-foreground">
                  Supported events: sync_completed, sync_failed, credential_expired, data_updated
                </p>
              </div>

              <Button 
                onClick={handleWebhookTest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Webhook...
                  </>
                ) : (
                  <>
                    <Webhook className="h-4 w-4 mr-2" />
                    Send Test Webhook
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {testResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Results</CardTitle>
              {testResults.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <CardDescription>
              {testResults.timestamp}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={testResults.success ? 'default' : 'destructive'}>
                  {testResults.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="text-sm">{testResults.message}</span>
              </div>

              <div className="mt-4">
                <Label className="mb-2 block">Response Details</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
                  {JSON.stringify(testResults.details, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quick Database Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-muted p-3 rounded font-mono text-xs">
            SELECT * FROM platform_configurations ORDER BY created_at DESC;
          </div>
          <div className="bg-muted p-3 rounded font-mono text-xs">
            SELECT * FROM platform_integration_logs ORDER BY created_at DESC LIMIT 20;
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Run these in the Supabase SQL Editor to view test data
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformIntegrationsDemo;
