import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMode } from '@/contexts/ModeContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: React.ReactNode;
  description?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  status = 'neutral',
  className = ''
}) => {
  const { mode } = useMode();

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-brand-green/20 bg-brand-green/5';
      case 'warning':
        return 'border-brand-orange/20 bg-brand-orange/5';
      case 'danger':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-border bg-card';
    }
  };

  const getChangeIcon = () => {
    switch (change?.type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase':
        return 'text-brand-green bg-brand-green/10';
      case 'decrease':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <Card className={`${getStatusColor()} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={`p-2 rounded-md ${mode === 'enterprise' ? 'bg-brand-teal/10' : 'bg-brand-coral/10'}`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          
          {change && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`${getChangeColor()} border-none text-xs`}>
                {getChangeIcon()}
                {Math.abs(change.value)}%
              </Badge>
              {change.period && (
                <span className="text-xs text-muted-foreground">
                  vs {change.period}
                </span>
              )}
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;