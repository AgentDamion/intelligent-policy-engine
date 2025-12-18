import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary`} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;