import React from 'react';
import { cn } from '@/lib/utils';

type EdgeVariant = 'default' | 'selected' | 'attention';

interface EdgeCardProps {
  children: React.ReactNode;
  variant?: EdgeVariant;
  className?: string;
}

const variantClasses: Record<EdgeVariant, string> = {
  default: 'border-l-aicomplyr-black',
  selected: 'border-l-aicomplyr-yellow',
  attention: 'border-l-status-escalated',
};

export const EdgeCard: React.FC<EdgeCardProps> = ({
  children,
  variant = 'default',
  className,
}) => (
  <div
    className={cn(
      'bg-white border-l-4 transition-colors',
      variantClasses[variant],
      className
    )}
  >
    {children}
  </div>
);

export const EdgeCardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => (
  <div className={cn('px-6 py-4 border-b border-neutral-200', className)}>
    {children}
  </div>
);

export const EdgeCardBody: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

export const EdgeCardFooter: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'px-6 py-4 border-t border-neutral-200 bg-neutral-100',
      className
    )}
  >
    {children}
  </div>
);


