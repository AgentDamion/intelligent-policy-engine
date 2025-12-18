import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type IntegrationLog = Database['public']['Tables']['platform_integration_logs']['Row'];

interface IntegrationLogsTableProps {
  logs: IntegrationLog[];
  isLoading?: boolean;
}

const STATUS_ICONS = {
  success: CheckCircle2,
  failed: XCircle,
  pending: Clock,
  in_progress: Loader2,
};

const STATUS_VARIANTS = {
  success: 'default',
  failed: 'destructive',
  pending: 'secondary',
  in_progress: 'outline',
} as const;

export const IntegrationLogsTable = ({ logs, isLoading }: IntegrationLogsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No integration logs yet
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const StatusIcon = STATUS_ICONS[log.status as keyof typeof STATUS_ICONS] || Clock;
            const statusVariant = STATUS_VARIANTS[log.status as keyof typeof STATUS_VARIANTS] || 'secondary';
            
            return (
              <TableRow key={log.id}>
                <TableCell className="font-medium capitalize">
                  {log.platform_type.replace('_', ' ')}
                </TableCell>
                <TableCell className="capitalize">
                  {log.operation_type.replace('_', ' ')}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.files_processed !== null ? (
                    <span className="text-sm">
                      {log.files_processed} processed
                      {log.files_failed ? ` • ${log.files_failed} failed` : ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.duration_ms ? (
                    <span className="text-sm">{(log.duration_ms / 1000).toFixed(2)}s</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
