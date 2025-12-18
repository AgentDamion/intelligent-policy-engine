import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface TTATooltipProps {
  children: React.ReactNode;
  className?: string;
}

export function TTATooltip({ children, className }: TTATooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 cursor-help ${className || ''}`}>
            {children}
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="bottom">
          <div className="space-y-2">
            <h4 className="font-medium">How we estimate 'Projected Impact'</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This estimate models how much faster your approval cycle could run after fixing the highest-impact gaps in Data & Privacy, Human-in-the-Loop, Auditability, and Security.
              </p>
              <p>
                We combine your answers with standard lead-time assumptions for regulated teams to project a median Time-to-Approval reduction.
              </p>
              <p className="text-xs italic">
                It's directional, not a guarantee. See your PDF for inputs, assumptions, and the improvement plan.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}