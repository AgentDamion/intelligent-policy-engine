import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'approved'
  | 'conditional'
  | 'denied'
  | 'escalated'
  | 'pending';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  approved: 'bg-status-approved text-white',
  conditional: 'bg-aicomplyr-yellow text-aicomplyr-black',
  denied: 'bg-status-denied text-white',
  escalated: 'bg-status-escalated text-white',
  pending: 'bg-status-pending text-white',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  className,
}) => (
  <span
    className={cn(
      'inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
      variantStyles[variant],
      className
    )}
  >
    {children}
  </span>
);

export const StatusBanner: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  className,
}) => (
  <div
    className={cn(
      'px-6 py-4 text-center font-display text-base uppercase tracking-widest',
      variantStyles[variant],
      className
    )}
  >
    {children}
  </div>
);


