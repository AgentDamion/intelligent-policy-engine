import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { getApiUrl } from '@/config/api';

interface BackendStatus {
  status: 'online' | 'degraded' | 'offline';
  message: string;
  lastChecked: Date;
  responseTime?: number;
}

const MetaLoopStatusBadge = () => {
  const [status, setStatus] = useState<BackendStatus>({
    status: 'offline',
    message: 'Checking connection...',
    lastChecked: new Date()
  });

  const checkBackendHealth = async (): Promise<BackendStatus> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(getApiUrl('/api'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (responseTime > 3000) {
          return {
            status: 'degraded',
            message: `Backend responding slowly (${responseTime}ms)`,
            lastChecked: new Date(),
            responseTime
          };
        }
        
        return {
          status: 'online',
          message: data.message || `Backend active (${responseTime}ms)`,
          lastChecked: new Date(),
          responseTime
        };
      } else {
        return {
          status: 'degraded',
          message: `HTTP ${response.status}: ${response.statusText}`,
          lastChecked: new Date(),
          responseTime
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        (error.name === 'AbortError' ? 'Request timeout' : error.message) : 
        'Connection failed';
      
      return {
        status: 'offline',
        message: errorMessage,
        lastChecked: new Date()
      };
    }
  };

  useEffect(() => {
    // Initial check
    checkBackendHealth().then(setStatus);
    
    // Periodic health checks every 30 seconds
    const interval = setInterval(() => {
      checkBackendHealth().then(setStatus);
    }, 30000);

    // Listen for API settings changes
    const handleSettingsChange = () => {
      checkBackendHealth().then(setStatus);
    };
    
    window.addEventListener('api-settings-changed', handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('api-settings-changed', handleSettingsChange);
    };
  }, []);

  const getBadgeVariant = () => {
    switch (status.status) {
      case 'online':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'offline':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'online':
        return <Circle className="h-3 w-3 fill-green-500 text-green-500 mr-1" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3 text-yellow-600 mr-1" />;
      case 'offline':
        return <WifiOff className="h-3 w-3 text-red-500 mr-1" />;
      default:
        return <Wifi className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'online':
        return 'MetaLoop Active';
      case 'degraded':
        return 'MetaLoop Degraded';
      case 'offline':
        return 'MetaLoop Offline';
      default:
        return 'MetaLoop';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getBadgeVariant()} className="cursor-help">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{status.message}</p>
            <p className="text-xs text-muted-foreground">
              Last checked: {status.lastChecked.toLocaleTimeString()}
            </p>
            {status.responseTime && (
              <p className="text-xs text-muted-foreground">
                Response time: {status.responseTime}ms
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MetaLoopStatusBadge;