import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SandboxSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Settings {
  defaultControlLevel: 'strict' | 'standard' | 'permissive';
  autoRefresh: boolean;
  refreshInterval: number;
  showTimelineByDefault: boolean;
  notifyOnCompletion: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  defaultControlLevel: 'standard',
  autoRefresh: false,
  refreshInterval: 30,
  showTimelineByDefault: false,
  notifyOnCompletion: true,
};

export function SandboxSettingsDialog({ open, onOpenChange }: SandboxSettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('sandbox-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, [open]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('sandbox-settings', JSON.stringify(updated));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('sandbox-settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sandbox Settings</DialogTitle>
          <DialogDescription>
            Configure your sandbox preferences and default behaviors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Default Control Level */}
          <div className="space-y-2">
            <Label htmlFor="control-level">Default Control Level</Label>
            <Select
              value={settings.defaultControlLevel}
              onValueChange={(value) => updateSetting('defaultControlLevel', value as Settings['defaultControlLevel'])}
            >
              <SelectTrigger id="control-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="permissive">Permissive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default governance control level for new simulations
            </p>
          </div>

          {/* Auto Refresh */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh">Auto-refresh Runs</Label>
              <p className="text-xs text-muted-foreground">
                Automatically refresh sandbox runs every {settings.refreshInterval}s
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
            />
          </div>

          {/* Refresh Interval */}
          {settings.autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Select
                value={settings.refreshInterval.toString()}
                onValueChange={(value) => updateSetting('refreshInterval', parseInt(value))}
              >
                <SelectTrigger id="refresh-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show Timeline by Default */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="timeline-default">Show Timeline by Default</Label>
              <p className="text-xs text-muted-foreground">
                Open timeline drawer when viewing sandbox
              </p>
            </div>
            <Switch
              id="timeline-default"
              checked={settings.showTimelineByDefault}
              onCheckedChange={(checked) => updateSetting('showTimelineByDefault', checked)}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify">Notify on Completion</Label>
              <p className="text-xs text-muted-foreground">
                Show notification when simulation completes
              </p>
            </div>
            <Switch
              id="notify"
              checked={settings.notifyOnCompletion}
              onCheckedChange={(checked) => updateSetting('notifyOnCompletion', checked)}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={resetToDefaults} className="w-full">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
