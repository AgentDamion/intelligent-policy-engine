import React from 'react';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface DecisionBadgeProps {
  recommendation: 'ESCALATE' | 'BLOCK' | 'ALLOW';
  confidence: number;
}

export const DecisionBadge = ({ recommendation, confidence }: DecisionBadgeProps) => {
  const config = {
    ESCALATE: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    BLOCK: {
      icon: XCircle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    },
    ALLOW: {
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    }
  };

  const { icon: Icon, bgColor, textColor, borderColor } = config[recommendation];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${bgColor} ${textColor} ${borderColor}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{recommendation}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {confidence}% confidence
      </span>
    </div>
  );
};

export default DecisionBadge;










