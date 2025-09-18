import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Alert({ 
  children, 
  variant = 'default', 
  className = '' 
}: AlertProps) {
  const baseClasses = 'p-4 rounded-lg border';
  
  const variantClasses = {
    default: 'border-gray-200 bg-gray-50 text-gray-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    error: 'border-red-200 bg-red-50 text-red-900'
  };
  
  const iconClasses = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };
  
  const icons = {
    default: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
  };
  
  const Icon = icons[variant];
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex items-start space-x-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconClasses[variant])} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}