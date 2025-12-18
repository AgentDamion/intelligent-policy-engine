import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Zap, Settings } from 'lucide-react';
import { getApiUrl } from '@/config/api';
import APISettingsModal from '@/components/settings/APISettingsModal';
import CursorBackendGuide from '@/components/backend/CursorBackendGuide';
import { monitoring } from '@/utils/monitoring';

interface BackendResponse {
  status: string;
  message: string;
  timestamp: string;
  endpoints: string[];
}

const BackendTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<BackendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setConnectionStatus('idle');

    try {
      const response = await fetch(getApiUrl('/api'), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: BackendResponse = await response.json();
      setResponse(data);
      setConnectionStatus('success');
      monitoring.info('Backend connected', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setConnectionStatus('error');
      monitoring.error('Backend connection failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Zap className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className={`transition-colors duration-200 ${getStatusColor()}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-2xl">Backend Connection Test</CardTitle>
              <CardDescription>
                Testing connection to backend API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Default Setup:</strong> Frontend (Lovable) runs on port 8080, Backend (Cursor) should run on port 3000. 
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline"
                onClick={() => setApiSettingsOpen(true)}
              >
                Configure different ports here
              </Button>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="bg-teal hover:bg-teal/90 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setApiSettingsOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              API Settings
            </Button>
          </div>

          {connectionStatus !== 'idle' && (
            <div className="p-4 rounded-lg bg-white border">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold">Connection Status:</span>
                <Badge variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
                  {connectionStatus === 'success' ? 'Connected' : 'Failed'}
                </Badge>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  <strong>Error:</strong> {error}
                  <div className="text-sm mt-2 text-red-600">
                    Common issues: CORS policy, backend not running, or network connectivity
                  </div>
                </div>
              )}

              {response && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">API Status</h4>
                      <p className="text-green-600">✓ {response.message}</p>
                      <p className="text-sm text-gray-600">Status: {response.status}</p>
                      <p className="text-sm text-gray-600">Timestamp: {response.timestamp}</p>
                    </div>
                  </div>


                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Available Endpoints ({response.endpoints.length})</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                      {response.endpoints.map((endpoint, index) => (
                        <div key={index} className="text-gray-700">{endpoint}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {connectionStatus === 'success' && response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎉 Ready for Agency Dashboard</CardTitle>
            <CardDescription>
              Backend connection successful! You can now build the Agency Dashboard to call:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm">
                GET /api/agency/a27cb30e-9ab9-4434-a6d9-67bf4e03557c/clients
              </code>
              <p className="text-sm text-gray-600 mt-2">
                This will display client organizations (Pfizer, Novartis, JPMorgan, etc.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cursor Backend Guide */}
      <CursorBackendGuide />

      {/* API Settings Modal */}
      <APISettingsModal 
        open={apiSettingsOpen} 
        onOpenChange={setApiSettingsOpen} 
      />
    </div>
  );
};

export default BackendTest;