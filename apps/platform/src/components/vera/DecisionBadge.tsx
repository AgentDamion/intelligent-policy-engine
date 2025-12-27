/**
 * DecisionBadge Component
 * 
 * Displays decision outcome with human-readable rationale subtitle.
 * Includes tooltip showing structured details on hover.
 * 
 * For AI governance decisions in the aicomplyr.io platform.
 */

import React, { memo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, Clock, Info } from 'lucide-react';
import type { RationaleStructured } from '@/types/rationale';

export type DecisionOutcome = 'allow' | 'deny' | 'escalate' | 'conditional' | 
                               'approved' | 'rejected' | 'flagged' | 'pending';

interface DecisionBadgeProps {
  /** Decision outcome */
  decision: DecisionOutcome | string;
  /** Human-readable rationale (≤140 chars) */
  rationaleHuman?: string | null;
  /** Structured rationale for tooltip details */
  rationaleStructured?: RationaleStructured | null;
  /** Whether to show the rationale subtitle */
  showRationale?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

// Decision configuration
const DECISION_CONFIG: Record<string, {
  label: string;
  variant: string;
  icon: React.ComponentType<{ className?: string }>;
  textColor: string;
  bgColor: string;
  borderColor: string;
}> = {
  allow: {
    label: 'Allowed',
    variant: 'success',
    icon: Check,
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    icon: Check,
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  deny: {
    label: 'Denied',
    variant: 'destructive',
    icon: X,
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    icon: X,
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  escalate: {
    label: 'Escalated',
    variant: 'warning',
    icon: AlertTriangle,
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  flagged: {
    label: 'Flagged',
    variant: 'warning',
    icon: AlertTriangle,
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  conditional: {
    label: 'Conditional',
    variant: 'info',
    icon: Info,
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  pending: {
    label: 'Pending',
    variant: 'secondary',
    icon: Clock,
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200'
  }
};

const SIZE_CONFIG = {
  sm: {
    badge: 'px-2 py-0.5 text-[10px]',
    icon: 'w-3 h-3',
    rationale: 'text-[10px]'
  },
  md: {
    badge: 'px-2.5 py-1 text-xs',
    icon: 'w-3.5 h-3.5',
    rationale: 'text-xs'
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    rationale: 'text-sm'
  }
};

/**
 * Format confidence score as percentage
 */
function formatConfidence(score?: number): string {
  if (score === undefined || score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
}

/**
 * DecisionBadge Component
 */
export const DecisionBadge = memo(function DecisionBadge({
  decision,
  rationaleHuman,
  rationaleStructured,
  showRationale = true,
  size = 'md',
  className = ''
}: DecisionBadgeProps) {
  // Normalize decision to lowercase
  const normalizedDecision = decision?.toLowerCase() || 'pending';
  const config = DECISION_CONFIG[normalizedDecision] || DECISION_CONFIG.pending;
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = config.icon;

  const badgeContent = (
    <Badge 
      className={`
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeConfig.badge}
        font-bold uppercase tracking-wide border
        inline-flex items-center gap-1
      `}
    >
      <IconComponent className={sizeConfig.icon} />
      {config.label}
    </Badge>
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Badge with optional tooltip */}
      {rationaleStructured ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeContent}
            </TooltipTrigger>
            <TooltipContent 
              className="max-w-sm p-3 bg-slate-900 text-white border-slate-800"
              sideOffset={5}
            >
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="font-bold text-slate-300">Decision Details</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.bgColor} ${config.textColor}`}>
                    {config.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-slate-400">Policy:</span>
                  <span className="font-medium">
                    {rationaleStructured.policy_id} v{rationaleStructured.policy_version}
                  </span>
                  
                  <span className="text-slate-400">Rule:</span>
                  <span className="font-medium truncate" title={rationaleStructured.rule_matched}>
                    {rationaleStructured.rule_matched}
                  </span>
                  
                  <span className="text-slate-400">Tool:</span>
                  <span className="font-medium">
                    {rationaleStructured.inputs?.tool}
                    {rationaleStructured.inputs?.tool_version && 
                      ` v${rationaleStructured.inputs.tool_version}`
                    }
                  </span>
                  
                  <span className="text-slate-400">Data Class:</span>
                  <span className="font-medium">
                    {rationaleStructured.inputs?.dataset_class || 'N/A'}
                  </span>
                  
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-medium">
                    {formatConfidence(rationaleStructured.confidence_score)}
                  </span>
                  
                  <span className="text-slate-400">Actor:</span>
                  <span className="font-medium">
                    {rationaleStructured.actor?.name || rationaleStructured.actor?.type || 'automated'}
                  </span>
                </div>
                
                {rationaleStructured.secondary_rules && rationaleStructured.secondary_rules.length > 0 && (
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                      Additional Rules:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rationaleStructured.secondary_rules.slice(0, 3).map((rule, i) => (
                        <span 
                          key={i}
                          className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]"
                        >
                          {rule}
                        </span>
                      ))}
                      {rationaleStructured.secondary_rules.length > 3 && (
                        <span className="text-slate-500 text-[10px]">
                          +{rationaleStructured.secondary_rules.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        badgeContent
      )}
      
      {/* Rationale subtitle */}
      {showRationale && rationaleHuman && (
        <span className={`
          ${sizeConfig.rationale}
          font-mono text-slate-500 
          bg-slate-50 px-2 py-1 rounded
          line-clamp-1
        `}>
          {rationaleHuman}
        </span>
      )}
    </div>
  );
});

DecisionBadge.displayName = 'DecisionBadge';

export default DecisionBadge;







