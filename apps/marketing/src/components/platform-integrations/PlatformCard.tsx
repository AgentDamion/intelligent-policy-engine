import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Database, Cloud, HardDrive, MoreVertical, RefreshCw, Trash2, TestTube, Power, PowerOff, Webhook } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type PlatformConfig = DatabaseType['public']['Tables']['platform_configurations']['Row'];

interface PlatformCardProps {
  config: PlatformConfig;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSync: (id: string, platformType: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

const PLATFORM_ICONS: Record<string, typeof Database> = {
  veeva: Database,
  sharepoint: Cloud,
  box: HardDrive,
  dropbox: HardDrive,
  google_drive: Cloud,
};

const PLATFORM_COLORS: Record<string, string> = {
  veeva: 'text-blue-500',
  sharepoint: 'text-green-500',
  box: 'text-purple-500',
  dropbox: 'text-sky-500',
  google_drive: 'text-yellow-500',
};

export const PlatformCard = ({ config, onDelete, onTest, onSync, onToggleStatus }: PlatformCardProps) => {
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const Icon = PLATFORM_ICONS[config.platform_type] || Database;
  const iconColor = PLATFORM_COLORS[config.platform_type] || 'text-primary';
  const isActive = config.status === 'active';
  
  const projectId = 'dqemokpnzasbeytdbzei';
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/platform-webhook`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.platform_name}</CardTitle>
              <CardDescription className="capitalize">
                {config.platform_type.replace('_', ' ')}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleStatus(config.id, config.status)}>
                {isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Enable
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTest(config.id)}>
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSync(config.id, config.platform_type)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Trigger Sync
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowWebhookConfig(!showWebhookConfig)}>
                <Webhook className="h-4 w-4 mr-2" />
                Webhook Config
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(config.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {config.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Auth Method</span>
            <span className="capitalize">{config.auth_method.replace('_', ' ')}</span>
          </div>
          {config.auto_sync_enabled && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auto Sync</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
          )}
          {config.last_connection_test && (
            <div className="text-xs text-muted-foreground">
              Last tested: {new Date(config.last_connection_test).toLocaleDateString()}
            </div>
          )}
          
          {showWebhookConfig && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <Label htmlFor={`webhook-url-${config.id}`} className="text-sm font-medium">
                  Webhook Endpoint
                </Label>
                <Input
                  id={`webhook-url-${config.id}`}
                  value={webhookUrl}
                  readOnly
                  className="mt-1 font-mono text-xs bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure this URL in your platform to receive async notifications
                </p>
              </div>
              {config.metadata && typeof config.metadata === 'object' && 'last_sync_status' in config.metadata && (
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Last Sync:</span>
                    <Badge 
                      variant={config.metadata.last_sync_status === 'completed' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {String(config.metadata.last_sync_status)}
                    </Badge>
                    {config.metadata.last_sync_records && (
                      <span className="text-muted-foreground">
                        {String(config.metadata.last_sync_records)} records
                      </span>
                    )}
                  </div>
                  {config.metadata.last_sync_completed_at && (
                    <div className="text-muted-foreground">
                      Completed: {new Date(String(config.metadata.last_sync_completed_at)).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
