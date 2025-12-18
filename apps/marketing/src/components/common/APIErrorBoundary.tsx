import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { useBackendHealth } from '@/hooks/useBackendHealth';
import APISettingsModal from '@/components/settings/APISettingsModal';

interface APIErrorBoundaryProps {
  error?: string | null;
  onRetry?: () => void;
  showSettings?: boolean;
  children?: React.ReactNode;
}

const APIErrorBoundary: React.FC<APIErrorBoundaryProps> = ({
  error,
  onRetry,
  showSettings = true,
  children
}) => {
  const { health, refreshHealth } = useBackendHealth(0); // No auto-refresh for error boundary

  if (!error) {
    return <>{children}</>;
  }

  const isConnectionError = error.includes('Failed to fetch') || 
                           error.includes('Network request failed') ||
                           error.includes('Connection failed');

  const getErrorTitle = () => {
    if (isConnectionError) {
      return 'Backend Connection Failed';
    }
    return 'API Error';
  };

  const getErrorDescription = () => {
    if (isConnectionError) {
      return 'Unable to connect to the backend server. Check your API settings and ensure the server is running.';
    }
    return error;
  };

  const handleRetry = async () => {
    if (isConnectionError) {
      await refreshHealth();
    }
    onRetry?.();
  };

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {getErrorTitle()}
        <div className="flex gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {showSettings && isConnectionError && <APISettingsModal />}
        </div>
      </AlertTitle>
      <AlertDescription className="mt-2">
        {getErrorDescription()}
        {isConnectionError && (
          <div className="mt-2 text-sm">
            <p>Common solutions:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Ensure your Cursor backend is running</li>
              <li>Check the API Base URL in settings</li>
              <li>Verify CORS configuration on your backend</li>
              <li>Check network connectivity</li>
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default APIErrorBoundary;