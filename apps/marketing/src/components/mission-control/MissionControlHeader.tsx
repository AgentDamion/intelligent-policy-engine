import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MissionControlHeaderProps {
  enterprise: string;
  autoClearRate: number;
  decisionsNeedingAttention: number;
  shadowMode?: boolean;
}

export const MissionControlHeader = ({
  enterprise,
  autoClearRate,
  decisionsNeedingAttention,
  shadowMode = true
}: MissionControlHeaderProps) => {
  return (
    <header className="bg-card border-b border-border">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">V</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">VERA Mission Control</h1>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{enterprise}</span>
          <span>•</span>
          <span>Shadow Mode</span>
          <span>•</span>
          <span>Last 24 hours</span>
        </div>
        
        {shadowMode && (
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>

      {/* VERA Status */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md flex items-center justify-center border border-primary/20">
            <span className="text-xl font-bold text-gray-700">V</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">VERA</p>
            <p className="text-xs text-muted-foreground">{enterprise}</p>
          </div>
        </div>
        
        <div className="flex-1 px-8">
          <p className="text-sm text-foreground">
            I've auto-cleared <span className="font-semibold text-primary">{autoClearRate}%</span> of submissions. 
            <span className="font-semibold text-amber-600"> {decisionsNeedingAttention} decisions need your attention</span>
            {' '}— most are new image tools used for HCP campaigns.
          </p>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Ask VERA about this view
        </Button>
      </div>
    </header>
  );
};

export default MissionControlHeader;










