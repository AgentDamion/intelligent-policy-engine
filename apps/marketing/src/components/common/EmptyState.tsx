import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMode } from '@/contexts/ModeContext';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: EmptyStateAction[];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actions = [],
  className = ''
}) => {
  const { mode } = useMode();

  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {icon && (
          <div className={`mb-4 p-3 rounded-full ${mode === 'enterprise' ? 'bg-brand-teal/10' : 'bg-brand-coral/10'}`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: `h-8 w-8 ${mode === 'enterprise' ? 'text-brand-teal' : 'text-brand-coral'}`
            })}
          </div>
        )}
        
        <h3 className="text-lg font-semibold mb-2">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                className={`
                  ${action.variant === 'default' && mode === 'enterprise' ? 'bg-brand-teal hover:bg-brand-teal/90' : ''}
                  ${action.variant === 'default' && mode === 'partner' ? 'bg-brand-coral hover:bg-brand-coral/90' : ''}
                `}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;