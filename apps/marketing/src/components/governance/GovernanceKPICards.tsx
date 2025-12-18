import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { GovernanceMetrics } from '@/hooks/useGovernanceData';
import { getGovernanceHealthColor, getGovernanceHealthBackground } from '@/utils/governanceCalculations';

interface GovernanceKPICardsProps {
  metrics: GovernanceMetrics;
  onCardClick: (metric: string) => void;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  color?: string;
  background?: string;
  onClick: () => void;
  sparklineData?: number[];
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  background,
  onClick,
  sparklineData
}) => {
  const formatChange = (change: { value: number; type: 'increase' | 'decrease'; period: string }) => {
    const sign = change.type === 'increase' ? '+' : '-';
    const colorClass = change.type === 'increase' ? 'text-green-600' : 'text-red-600';
    const Icon = change.type === 'increase' ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{sign}{change.value}% {change.period}</span>
      </div>
    );
  };

  // Simple sparkline using CSS
  const renderSparkline = (data: number[]) => {
    if (!data.length) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return (
      <div className="flex items-end gap-px h-8 mt-2">
        {data.slice(-10).map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className="bg-primary/30 flex-1 min-w-[2px]"
              style={{ height: `${Math.max(height, 5)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${background || ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-primary/10 ${color || 'text-primary'}`}>
            {icon}
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>
              {value}
            </div>
            {change && formatChange(change)}
          </div>
        </div>
        
        <div className="mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>

        {sparklineData && renderSparkline(sparklineData)}
      </CardContent>
    </Card>
  );
};

export const GovernanceKPICards: React.FC<GovernanceKPICardsProps> = ({
  metrics,
  onCardClick
}) => {
  const kpiCards = [
    {
      title: 'Governance Health',
      value: `${metrics.governanceHealth}%`,
      change: {
        value: metrics.changeFromPrevious,
        type: 'increase' as const,
        period: 'this week'
      },
      icon: <Activity className="h-4 w-4" />,
      color: getGovernanceHealthColor(metrics.governanceHealth),
      background: getGovernanceHealthBackground(metrics.governanceHealth),
      metric: 'governance-health',
      sparklineData: metrics.sparklineData
    },
    {
      title: 'Compliance Score',
      value: `${metrics.compliance}%`,
      change: {
        value: 2.1,
        type: 'increase' as const,
        period: 'this month'
      },
      icon: <CheckCircle className="h-4 w-4" />,
      metric: 'compliance'
    },
    {
      title: 'Tool Approval Rate',
      value: `${metrics.toolApproval}%`,
      change: {
        value: 1.8,
        type: 'decrease' as const,
        period: 'this week'
      },
      icon: <CheckCircle className="h-4 w-4" />,
      metric: 'tool-approval'
    },
    {
      title: 'Audit Completeness',
      value: `${metrics.auditCompleteness}%`,
      change: {
        value: 4.2,
        type: 'increase' as const,
        period: 'this month'
      },
      icon: <CheckCircle className="h-4 w-4" />,
      metric: 'audit-completeness'
    },
    {
      title: 'Open Risks',
      value: metrics.openRisks,
      change: {
        value: 15,
        type: 'decrease' as const,
        period: 'this week'
      },
      icon: <AlertTriangle className="h-4 w-4" />,
      color: metrics.openRisks > 10 ? 'text-red-600' : 'text-green-600',
      metric: 'open-risks'
    },
    {
      title: 'Overdue Items',
      value: metrics.overdueItems,
      change: {
        value: 8,
        type: 'decrease' as const,
        period: 'this week'
      },
      icon: <Clock className="h-4 w-4" />,
      color: metrics.overdueItems > 5 ? 'text-red-600' : 'text-green-600',
      metric: 'overdue-items'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {kpiCards.map((card) => (
        <KPICard
          key={card.metric}
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          color={card.color}
          background={card.background}
          sparklineData={card.sparklineData}
          onClick={() => onCardClick(card.metric)}
        />
      ))}
    </div>
  );
};