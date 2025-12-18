import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MetricChange {
  value: number;
  type: 'increase' | 'decrease' | 'neutral';
  period: string;
}

interface EnhancedAdminMetricCardProps {
  title: string;
  value: string | number;
  change?: MetricChange;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  className?: string;
  drillDownPath?: string;
  emphasis?: boolean;
  governanceData?: {
    score: number;
    breakdown: {
      compliance: number;
      toolApproval: number;
      auditComplete: number;
    };
  };
}

export const EnhancedAdminMetricCard: React.FC<EnhancedAdminMetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
  drillDownPath,
  emphasis = false,
  governanceData
}) => {
  const navigate = useNavigate();
  
  const getTrendIcon = (type: MetricChange['type']) => {
    switch (type) {
      case 'increase': return TrendingUp;
      case 'decrease': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (type: MetricChange['type']) => {
    switch (type) {
      case 'increase': return 'text-brand-green border-brand-green bg-brand-green/10';
      case 'decrease': return 'text-destructive border-destructive bg-destructive/10';
      default: return 'text-muted-foreground border-muted bg-muted/10';
    }
  };

  const getGovernanceColor = (score: number) => {
    if (score >= 85) return 'text-brand-green';
    if (score >= 60) return 'text-brand-orange';
    return 'text-destructive';
  };

  const getGovernanceGradient = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-r from-brand-green/20 to-brand-teal/20';
    if (score >= 60) return 'bg-gradient-to-r from-brand-orange/20 to-brand-coral/20';
    return 'bg-gradient-to-r from-destructive/20 to-destructive/30';
  };

  const handleClick = () => {
    if (drillDownPath) {
      navigate(drillDownPath);
    }
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-300 hover-scale border-l-4',
        drillDownPath && 'cursor-pointer hover:shadow-lg',
        emphasis && 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-brand-teal/5',
        governanceData && getGovernanceGradient(governanceData.score),
        emphasis ? 'border-l-primary' : 'border-l-brand-teal',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="text-sm font-medium leading-none tracking-tight">{title}</h3>
          {drillDownPath && (
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
          )}
        </div>
        {change && (
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", getTrendColor(change.type))}
          >
            {React.createElement(getTrendIcon(change.type), { className: "h-3 w-3 mr-1" })}
            {Math.abs(change.value)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className={cn(
            "text-2xl font-bold leading-none",
            emphasis && "bg-gradient-to-r from-primary to-brand-teal bg-clip-text text-transparent",
            governanceData && getGovernanceColor(governanceData.score)
          )}>
            {value}
            {governanceData && '%'}
          </div>
          {change && (
            <p className="text-xs text-muted-foreground">
              {change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}
              {change.value}% from {change.period}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {governanceData && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Compliance:</span>
                <span className={getGovernanceColor(governanceData.breakdown.compliance)}>
                  {governanceData.breakdown.compliance}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tool Approval:</span>
                <span className={getGovernanceColor(governanceData.breakdown.toolApproval)}>
                  {governanceData.breakdown.toolApproval}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Audit Complete:</span>
                <span className={getGovernanceColor(governanceData.breakdown.auditComplete)}>
                  {governanceData.breakdown.auditComplete}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};