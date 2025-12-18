import React from 'react';
import { cn } from '@/lib/utils';

interface BrandIconProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  small: 'w-6 h-6',
  medium: 'w-8 h-8',
  large: 'w-12 h-12'
};

const colorClasses = {
  light: 'text-brand-teal',
  dark: 'text-white'
};

export function BrandIcon({ size = 'medium', variant = 'light', className, animate = false }: BrandIconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClasses[variant], animate && 'animate-pulse-glow', className)}
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hummingbird silhouette based on brand guide */}
      <path d="M8 16c0-2.5 1.5-4.5 3.5-5.5C13 9.5 14.5 9 16 9c3.5 0 6.5 2.5 7 6h-1c-.5-2.5-2.5-4.5-5-4.5-1 0-2 .5-2.5 1-.5-.5-1.5-1-2.5-1-2.5 0-4.5 2-5 4.5H8z"/>
      <path d="M16 12c-1.5 0-3 1-3.5 2.5-.5-.5-1-1-1.5-1.5-.5-1-1.5-2-3-2-2 0-3.5 1.5-4 3.5h-.5c.5-3 2.5-5 5-5 1.5 0 2.5.5 3.5 1.5C13 10.5 14.5 10 16 10c3 0 5.5 2 6 5h-.5c-.5-2.5-2.5-4.5-5.5-4.5z"/>
      <circle cx="13" cy="15" r="1"/>
      <path d="M20 16c1 0 2-.5 2.5-1.5.5.5 1 1 1.5 1.5.5 1 1.5 2 3 2 2 0 3.5-1.5 4-3.5h.5c-.5 3-2.5 5-5 5-1.5 0-2.5-.5-3.5-1.5-1 1.5-2.5 2.5-4 2.5-3 0-5.5-2-6-5h.5c.5 2.5 2.5 4.5 5.5 4.5z"/>
    </svg>
  );
}