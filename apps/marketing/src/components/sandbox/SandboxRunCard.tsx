import { format } from 'date-fns';
import { ChevronRight, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SandboxRun } from '@/types/sandbox';

interface SandboxRunCardProps {
  run: SandboxRun;
  onClick: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  running: { label: 'Running', variant: 'default' as const, icon: Shield },
  completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive' as const, icon: AlertCircle },
  pending_approval: { label: 'Pending Approval', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive' as const, icon: AlertCircle },
  changes_requested: { label: 'Changes Requested', variant: 'outline' as const, icon: AlertCircle },
};

export function SandboxRunCard({ run, onClick }: SandboxRunCardProps) {
  const config = statusConfig[run.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const complianceScore = run.outputs_json?.compliance_score || 0;

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {run.id.slice(0, 8)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(run.created_at), 'MMM d, yyyy HH:mm')}
            </span>
          </div>

          {/* Details */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Enforcement:</span>
              <span className="font-medium capitalize">{run.control_level}</span>
            </div>

            {run.status === 'completed' && run.outputs_json && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Compliance:</span>
                  <span className="font-medium">{complianceScore}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Result:</span>
                  <Badge
                    variant={
                      run.outputs_json.validation_result === 'pass'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {run.outputs_json.validation_result}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Compliance Progress */}
          {run.status === 'completed' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Compliance Score</span>
                <span>{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {run.error_message && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{run.error_message}</span>
            </div>
          )}
        </div>

        {/* Action Arrow */}
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </Card>
  );
}
