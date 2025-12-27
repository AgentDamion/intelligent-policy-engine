import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface MissionMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export const MissionMetricCard: React.FC<MissionMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-slate-400',
}) => {
  return (
    <Card className="border border-gray-100 shadow-none bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {Icon && <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />}
        </div>
        <div>
          <div className="mt-6 text-3xl font-bold text-slate-900">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

