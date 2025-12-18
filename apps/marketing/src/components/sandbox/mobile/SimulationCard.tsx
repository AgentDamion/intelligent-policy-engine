import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SandboxRun } from '@/types/sandbox';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationCardProps {
  run: SandboxRun;
  selected?: boolean;
  onClick: () => void;
  isSample?: boolean;
}

export function SimulationCard({ run, selected, onClick, isSample }: SimulationCardProps) {
  const complianceScore = run.outputs_json?.compliance_score || 0;
  const hasRiskFlags = run.outputs_json?.risk_flags?.length > 0;
  
  const statusBadge = run.outputs_json?.validation_result === 'pass' 
    ? { label: 'Passed', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' }
    : run.outputs_json?.validation_result === 'fail'
    ? { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' }
    : hasRiskFlags
    ? { label: 'Flagged', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' }
    : { label: 'Passed', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md min-h-[88px]',
        selected && 'border-primary bg-accent'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Simulation ID */}
          <div className="flex items-center gap-2 mb-2">
            <div className="font-mono text-sm font-medium">
              #{run.id.slice(0, 8)}
            </div>
            {isSample && (
              <Badge variant="outline" className="text-xs">
                Sample
              </Badge>
            )}
          </div>
          
          {/* Status & Compliance */}
          <div className="flex items-center gap-2 mb-2">
            <Badge className={statusBadge.className} variant="secondary">
              {statusBadge.label}
            </Badge>
            <span className="text-sm font-semibold">{complianceScore}%</span>
            {hasRiskFlags && (
              <Badge variant="outline" className="text-xs">
                {run.outputs_json.risk_flags.length} flags
              </Badge>
            )}
          </div>
          
          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
          </div>
        </div>
        
        {/* Action Arrow */}
        <Button variant="ghost" size="sm" className="shrink-0 h-auto p-2">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
