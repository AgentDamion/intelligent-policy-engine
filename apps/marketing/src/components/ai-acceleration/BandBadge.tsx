import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BandBadgeProps {
  band: 'blocked' | 'cautious' | 'enabled' | 'native';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const bandConfig = {
  blocked: {
    label: 'Blocked',
    description: 'Critical gaps prevent AI deployment',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20'
  },
  cautious: {
    label: 'Cautious',
    description: 'Foundation needs work before scaling',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
  },
  enabled: {
    label: 'Enabled',
    description: 'Strong compliance posture for deployment',
    className: 'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
  },
  native: {
    label: 'Native',
    description: 'Audit-ready AI operations at scale',
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300'
  }
};

export function BandBadge({ band, size = 'default', className }: BandBadgeProps) {
  const config = bandConfig[band];
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium',
        config.className,
        size === 'sm' && 'text-xs px-2 py-1',
        size === 'lg' && 'text-base px-4 py-2',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}