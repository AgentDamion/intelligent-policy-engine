import React from 'react';
import { BrandIcon } from './BrandIcon';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'stacked';
  showIcon?: boolean;
  className?: string;
}

const sizeClasses = {
  small: {
    text: 'text-lg font-semibold',
    icon: 'small' as const,
    gap: 'gap-2'
  },
  medium: {
    text: 'text-xl font-semibold',
    icon: 'medium' as const,
    gap: 'gap-2'
  },
  large: {
    text: 'text-2xl font-bold',
    icon: 'large' as const,
    gap: 'gap-3'
  }
};

const variantClasses = {
  light: 'text-slate-700',
  dark: 'text-white'
};

export function BrandLogo({ 
  size = 'medium', 
  variant = 'light', 
  layout = 'horizontal',
  showIcon = true,
  className 
}: BrandLogoProps) {
  const sizeConfig = sizeClasses[size];
  
  if (layout === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        {showIcon && <BrandIcon size={sizeConfig.icon} variant={variant} />}
        <div className={cn('font-brand', sizeConfig.text)}>
          <span className="text-orange-500">ai</span>
          <span className="text-teal-500">complyr.</span>
          <span className="text-black">io</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', sizeConfig.gap, className)}>
      {showIcon && <BrandIcon size={sizeConfig.icon} variant={variant} />}
      <div className={cn('font-brand', sizeConfig.text)}>
        <span className="text-orange-500">ai</span>
        <span className="text-teal-500">complyr.</span>
        <span className="text-black">io</span>
      </div>
    </div>
  );
}