import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="w-full h-1 bg-neutral-200">
        <div
          className="h-full bg-aicomplyr-yellow transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-2 text-xs text-neutral-400 font-mono">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

