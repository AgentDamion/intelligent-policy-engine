import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  band: 'blocked' | 'cautious' | 'enabled' | 'native';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const bandColors = {
  blocked: 'hsl(var(--muted-foreground))',
  cautious: 'hsl(38 92% 50%)',
  enabled: 'hsl(var(--primary))',
  native: 'hsl(265 85% 60%)'
};

const sizeConfig = {
  small: { size: 80, strokeWidth: 6, fontSize: 'text-lg' },
  medium: { size: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  large: { size: 160, strokeWidth: 10, fontSize: 'text-4xl' }
};

export function ScoreRing({ score, band, size = 'medium', className }: ScoreRingProps) {
  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = config.size / 2;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={config.strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bandColors[band]}
          strokeWidth={config.strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${bandColors[band]}40)`
          }}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={cn('font-bold text-foreground', config.fontSize)}>
            {score}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Score
          </div>
        </div>
      </div>
    </div>
  );
}