import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { useProductionHealth } from '@/hooks/useProductionHealth';
import { useBackendHealth } from '@/hooks/useBackendHealth';

interface HealthIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'inline';
  showDetails?: boolean;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({ 
  position = 'top-right',
  showDetails = false 
}) => {
  const { health, isHealthy, hasCriticalIssues } = useProductionHealth();
  const backendHealth = useBackendHealth();

  const getHealthColor = () => {
    if (hasCriticalIssues || backendHealth.isOffline) return 'destructive';
    if (health.warnings > 0 || backendHealth.isDegraded) return 'warning';
    if (isHealthy && backendHealth.isOnline) return 'success';
    return 'secondary';
  };

  const getHealthIcon = () => {
    if (health.isChecking) return <Clock className="h-3 w-3" />;
    if (hasCriticalIssues || backendHealth.isOffline) return <AlertTriangle className="h-3 w-3" />;
    if (backendHealth.isOnline) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  const getHealthStatus = () => {
    if (health.isChecking) return 'Checking...';
    if (hasCriticalIssues) return 'Critical Issues';
    if (backendHealth.isOffline) return 'Backend Offline';
    if (health.warnings > 0) return 'Warnings';
    if (backendHealth.isDegraded) return 'Degraded';
    return 'Healthy';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      case 'inline':
      default:
        return '';
    }
  };

  const healthDetails = showDetails ? (
    <div className="space-y-2 text-xs">
      <div className="flex justify-between">
        <span>Application:</span>
        <span className={hasCriticalIssues ? 'text-destructive' : 'text-success'}>
          {hasCriticalIssues ? `${health.criticalIssues} critical` : 'Healthy'}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Backend:</span>
        <span className={backendHealth.isOffline ? 'text-destructive' : 'text-success'}>
          {backendHealth.health.status} ({backendHealth.health.responseTime}ms)
        </span>
      </div>
      {health.warnings > 0 && (
        <div className="flex justify-between">
          <span>Warnings:</span>
          <span className="text-warning">{health.warnings}</span>
        </div>
      )}
      <div className="text-muted-foreground text-xs">
        Last checked: {health.lastChecked.toLocaleTimeString()}
      </div>
    </div>
  ) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={getPositionClasses()}>
            <Badge 
              variant={getHealthColor() as any}
              className="flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
            >
              {getHealthIcon()}
              <span className="text-xs">{getHealthStatus()}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div>
            <p className="font-medium">System Health</p>
            {healthDetails || (
              <p className="text-sm text-muted-foreground">
                Application and backend status
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HealthIndicator;