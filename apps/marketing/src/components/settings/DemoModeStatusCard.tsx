import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DemoModeStatusCardProps {
  isDemoMode: boolean;
  isLoading: boolean;
  preferenceSource: 'manual' | 'auto_rule' | 'default';
  lastChanged?: string;
  onToggle: () => void;
}

export const DemoModeStatusCard: React.FC<DemoModeStatusCardProps> = ({
  isDemoMode,
  isLoading,
  preferenceSource,
  lastChanged,
  onToggle
}) => {
  const getSourceBadgeVariant = () => {
    switch (preferenceSource) {
      case 'manual':
        return 'default';
      case 'auto_rule':
        return 'secondary';
      case 'default':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSourceLabel = () => {
    switch (preferenceSource) {
      case 'manual':
        return 'Manual Override';
      case 'auto_rule':
        return 'Auto-Enabled Rule';
      case 'default':
        return 'Default Setting';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Demo Mode Status</span>
          <Info className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isDemoMode ? 'bg-green-500' : 'bg-muted'}`} />
            <span className="text-base font-medium">
              Demo Mode: {isDemoMode ? 'ON' : 'OFF'}
            </span>
          </div>
          <Switch
            checked={isDemoMode}
            onCheckedChange={onToggle}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Source:</span>
            <Badge variant={getSourceBadgeVariant()}>
              {getSourceLabel()}
            </Badge>
          </div>
          {lastChanged && (
            <div className="text-muted-foreground">
              Last changed: {formatDistanceToNow(new Date(lastChanged), { addSuffix: true })}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <Info className="inline h-4 w-4 mr-2" />
          Demo mode allows you to test the platform with synthetic data without affecting real compliance records.
        </div>
      </CardContent>
    </Card>
  );
};
