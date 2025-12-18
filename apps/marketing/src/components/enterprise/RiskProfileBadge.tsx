import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, AlertCircle, XCircle, CheckCircle } from 'lucide-react';

interface RiskProfileBadgeProps {
  tier: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  showIcon?: boolean;
  className?: string;
}

export const RiskProfileBadge = ({ tier, showIcon = true, className }: RiskProfileBadgeProps) => {
  const tierConfig = {
    minimal: {
      color: 'bg-green-500 text-white border-green-600',
      icon: CheckCircle,
      label: 'Minimal Risk'
    },
    low: {
      color: 'bg-blue-500 text-white border-blue-600',
      icon: Shield,
      label: 'Low Risk'
    },
    medium: {
      color: 'bg-yellow-500 text-white border-yellow-600',
      icon: AlertTriangle,
      label: 'Medium Risk'
    },
    high: {
      color: 'bg-orange-500 text-white border-orange-600',
      icon: AlertCircle,
      label: 'High Risk'
    },
    critical: {
      color: 'bg-red-500 text-white border-red-600',
      icon: XCircle,
      label: 'Critical Risk'
    }
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <Badge className={cn(config.color, 'uppercase text-xs font-semibold', className)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
