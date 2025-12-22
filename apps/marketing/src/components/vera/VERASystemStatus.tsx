import React from 'react';
import { VERAOrb } from './VERAOrb';
import { Badge } from '@/components/ui/badge';

interface VERASystemStatusProps {
  status?: 'Shadow' | 'Active' | 'Paused';
  partnerCount?: number;
  autoClearRate?: number;
  onOrbClick?: () => void;
}

export const VERASystemStatus = ({
  status = 'Shadow',
  partnerCount = 42,
  autoClearRate = 94,
  onOrbClick
}: VERASystemStatusProps) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12">
      {/* Status Ring with VERA Orb */}
      <div className="relative mb-8">
        {/* Outer status ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-[320px] h-[320px] rounded-full border-2 border-dashed border-primary/30"
            style={{ transform: 'rotateX(60deg)' }}
          />
        </div>
        
        {/* VERA Orb */}
        <div className="relative z-10 w-64 h-64 flex items-center justify-center">
          <VERAOrb onClick={onOrbClick} size="md" />
        </div>

        {/* Status overlay on orb */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center mt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              System Status
            </p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold text-foreground">{status}</span>
            </div>
            <p className="text-xs text-primary font-medium">{partnerCount} partners</p>
            <p className="text-xs text-primary">{autoClearRate}% auto-clear</p>
          </div>
        </div>
      </div>

      {/* System Ready Badge */}
      <Badge 
        variant="outline" 
        className="mb-4 px-4 py-2 border-primary/50 bg-primary/5"
      >
        <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
        <span className="text-sm font-medium text-primary">SYSTEM READY</span>
      </Badge>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Click the orb or type below to start a conversation with VERA
      </p>
    </div>
  );
};

export default VERASystemStatus;




