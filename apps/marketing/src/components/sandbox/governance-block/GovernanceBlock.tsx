import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SandboxRun } from '@/types/sandbox';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface GovernanceBlockProps {
  run: SandboxRun;
  selected?: boolean;
  onClick: () => void;
}

const statusConfig = {
  completed: {
    icon: '✅',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    badge: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
  },
  failed: {
    icon: '❌',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
  },
  pending: {
    icon: '⏳',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
  },
  running: {
    icon: '🔄',
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
  }
};

export function GovernanceBlock({ run, selected, onClick }: GovernanceBlockProps) {
  const config = statusConfig[run.status as keyof typeof statusConfig] || statusConfig.pending;
  const complianceScore = run.outputs_json?.compliance_score || 0;
  const hasRiskFlags = run.outputs_json?.risk_flags?.length > 0;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'border-l-4 cursor-pointer transition-all hover:shadow-md',
        config.borderColor,
        config.bgColor,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <div>
              <div className="font-mono text-xs text-muted-foreground">
                Simulation #{run.id.slice(0, 8)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <Badge className={config.badge} variant="secondary">
            {run.status}
          </Badge>
        </div>

        {/* Metrics */}
        {run.status === 'completed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Compliance Score</span>
              <span className="font-semibold">{complianceScore}%</span>
            </div>
            <Progress value={complianceScore} className="h-1.5" />
          </div>
        )}

        {/* Enforcement Level & Risk Flags */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs capitalize">
            {run.control_level} enforcement
          </Badge>
          {hasRiskFlags && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ {run.outputs_json.risk_flags.length} flags
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
