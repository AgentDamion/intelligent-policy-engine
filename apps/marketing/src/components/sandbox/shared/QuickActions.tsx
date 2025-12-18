import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Settings, FolderOpen } from 'lucide-react';

interface QuickActionsProps {
  workspaceId: string;
  enterpriseId: string;
  onRunSimulation: () => void;
  onOpenSettings: () => void;
}

export function QuickActions({ workspaceId, enterpriseId, onRunSimulation, onOpenSettings }: QuickActionsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Quick Actions
      </h3>
      <div className="grid gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={onRunSimulation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Simulation
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}
