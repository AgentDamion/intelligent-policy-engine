import React from 'react';
import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ComplianceStreak } from '@/types/gamification';

interface ComplianceStreakBadgeProps {
  streak: ComplianceStreak;
  size?: 'sm' | 'md' | 'lg';
}

export const ComplianceStreakBadge: React.FC<ComplianceStreakBadgeProps> = ({ 
  streak, 
  size = 'md' 
}) => {
  const isActive = streak.current > 0;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  
  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isActive ? 'default' : 'secondary'}
            className={`${sizeClasses[size]} flex items-center gap-1.5 cursor-help transition-all hover:scale-105`}
          >
            <Flame 
              size={iconSizes[size]} 
              className={isActive ? 'text-orange-400 animate-pulse' : 'text-muted-foreground'} 
            />
            <span className="font-bold">{streak.current}</span>
            <span className="text-muted-foreground">day{streak.current !== 1 ? 's' : ''}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Compliance Streak</p>
            <p className="text-sm">Current: {streak.current} days</p>
            <p className="text-sm">Best: {streak.best} days</p>
            {streak.lastDate && (
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(streak.lastDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
