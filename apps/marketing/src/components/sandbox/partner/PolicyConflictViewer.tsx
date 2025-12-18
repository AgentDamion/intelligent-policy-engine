import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface PolicyConflictViewerProps {
  conflict: {
    clientPolicyId: string;
    agencyPolicyId: string;
    clientPolicyName: string;
    agencyPolicyName: string;
    conflicts: Array<{
      field: string;
      clientValue: any;
      agencyValue: any;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  onResolve: (resolution: string) => void;
}

export function PolicyConflictViewer({ conflict, onResolve }: PolicyConflictViewerProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'Not set';
    }
    return String(value);
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Policy Conflict Detected
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">{conflict.clientPolicyName}</span>
              {' vs '}
              <span className="font-medium">{conflict.agencyPolicyName}</span>
            </div>
          </div>
          <Badge variant="destructive">{conflict.conflicts.length} conflicts</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {conflict.conflicts.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{item.field}</div>
              <Badge variant={getSeverityColor(item.severity) as any}>
                {item.severity} severity
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-4 items-center">
              {/* Client Value */}
              <div className="bg-muted rounded p-3">
                <div className="text-xs text-muted-foreground mb-1">Client Policy</div>
                <div className="text-sm font-mono">{formatValue(item.clientValue)}</div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Agency Value */}
              <div className="bg-muted rounded p-3">
                <div className="text-xs text-muted-foreground mb-1">Agency Policy</div>
                <div className="text-sm font-mono">{formatValue(item.agencyValue)}</div>
              </div>
            </div>

            {item.severity === 'high' && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                <p className="text-xs text-destructive">
                  <strong>High-priority conflict:</strong> This discrepancy may prevent
                  policy execution and requires immediate resolution.
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve('Adopt client policy values')}
          >
            Adopt Client Policy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve('Adopt agency policy values')}
          >
            Adopt Agency Policy
          </Button>
          <Button
            size="sm"
            onClick={() => onResolve('Create harmonized policy combining both')}
          >
            Request Dual Approval
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
