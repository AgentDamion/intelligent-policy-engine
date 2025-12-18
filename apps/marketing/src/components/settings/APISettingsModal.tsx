import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface APISettings {
  apiBaseUrl: string;
  wsBaseUrl: string;
}

interface ConnectionTestResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  endpoints?: string[];
  timestamp?: string;
}

interface APISettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const APISettingsModal: React.FC<APISettingsModalProps> = ({ 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  const [settings, setSettings] = useState<APISettings>({
    apiBaseUrl: '',
    wsBaseUrl: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('api-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      // Set defaults
      setSettings({
        apiBaseUrl: 'http://localhost:3000',
        wsBaseUrl: 'ws://localhost:3000'
      });
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('api-settings', JSON.stringify(settings));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('api-settings-changed', { detail: settings }));
    toast({
      title: "Settings saved",
      description: "API configuration has been updated."
    });
    setOpen(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const apiUrl = settings.apiBaseUrl || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          status: 'success',
          message: data.message || 'Connection successful',
          endpoints: data.endpoints || [],
          timestamp: new Date().toISOString()
        });
        toast({
          title: "Connection successful",
          description: "Backend is accessible and responding."
        });
      } else {
        setTestResult({
          status: 'warning',
          message: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Connection failed",
        description: "Unable to reach the backend server.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!testResult) return <Settings className="h-4 w-4" />;
    
    switch (testResult.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!testResult) return null;
    
    const variant = testResult.status === 'success' ? 'default' : 
                   testResult.status === 'warning' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant} className="ml-2">
        {testResult.status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {getStatusIcon()}
            API Settings
            {getStatusBadge()}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiBaseUrl">API Base URL</Label>
            <Input
              id="apiBaseUrl"
              placeholder="http://localhost:3000"
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Base URL for your Cursor backend API
            </p>
          </div>
          
          <div>
            <Label htmlFor="wsBaseUrl">WebSocket URL</Label>
            <Input
              id="wsBaseUrl"
              placeholder="ws://localhost:3000"
              value={settings.wsBaseUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, wsBaseUrl: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground mt-1">
              WebSocket URL for real-time updates
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={testing}
              variant="outline"
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={saveSettings} className="flex-1">
              Save Settings
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.status === 'success' ? 'bg-green-50 border-green-200' :
              testResult.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="font-medium">Connection Test</span>
                {getStatusBadge()}
              </div>
              <p className="text-sm">{testResult.message}</p>
              {testResult.endpoints && testResult.endpoints.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Available endpoints:</p>
                  <div className="text-xs text-muted-foreground">
                    {testResult.endpoints.map((endpoint, i) => (
                      <div key={i}>• {endpoint}</div>
                    ))}
                  </div>
                </div>
              )}
              {testResult.timestamp && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tested at {new Date(testResult.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Backend Setup Guide</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Ensure your Cursor backend is running on the configured URL</p>
              <p>• Implement GET /api endpoint returning status and available endpoints</p>
              <p>• Configure CORS to allow your Lovable app domain</p>
              <p>• See Backend Test page for detailed endpoint requirements</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default APISettingsModal;