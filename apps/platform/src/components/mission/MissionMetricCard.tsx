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
  iconColor = 'text-neutral-400',
}) => {
  return (
    <Card className="shadow-none bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-widest">{title}</h3>
          {Icon && <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />}
        </div>
        <div>
          <div className="mt-6 text-3xl font-display text-aicomplyr-black tracking-tight">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-neutral-500 font-medium">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

