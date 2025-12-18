import { useState } from 'react';
import { AlertCircle, Check, X, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PolicyConflict } from '@/types/policy-inheritance';
import { PolicyInheritanceService } from '@/lib/governance/policyInheritanceService';
import { useToast } from '@/hooks/use-toast';

interface ConflictResolutionPanelProps {
  conflicts: PolicyConflict[];
  onConflictResolved?: () => void;
  refreshTrigger?: number;
}

const severityColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500',
  warning: 'bg-warning/10 text-warning border-warning',
  error: 'bg-destructive/10 text-destructive border-destructive'
};

const conflictTypeLabels = {
  stricter: 'Stricter than parent',
  looser: 'Looser than parent',
  incompatible: 'Incompatible with parent'
};

export function ConflictResolutionPanel({ conflicts, onConflictResolved }: ConflictResolutionPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const unresolvedConflicts = conflicts.filter(c => c.resolution_status === 'unresolved');
  const resolvedConflicts = conflicts.filter(c => c.resolution_status !== 'unresolved');

  const handleResolve = async (
    conflictId: string,
    resolution: 'accept_child' | 'revert_to_parent' | 'acknowledge'
  ) => {
    setResolvingId(conflictId);
    const success = await PolicyInheritanceService.resolveConflict(
      conflictId,
      resolution,
      notes[conflictId]
    );

    if (success) {
      toast({
        title: 'Conflict resolved',
        description: 'The policy conflict has been marked as resolved'
      });
      setNotes(prev => {
        const next = { ...prev };
        delete next[conflictId];
        return next;
      });
      onConflictResolved?.();
    } else {
      toast({
        title: 'Failed to resolve conflict',
        description: 'An error occurred while resolving the conflict',
        variant: 'destructive'
      });
    }

    setResolvingId(null);
  };

  const renderConflictCard = (conflict: PolicyConflict, isResolved: boolean = false) => (
    <Card key={conflict.id} className={cn(
      "border-l-4",
      severityColors[conflict.severity]
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{conflict.conflicting_rule}</span>
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className={severityColors[conflict.severity]}>
                {conflict.severity}
              </Badge>
              <Badge variant="outline">
                {conflictTypeLabels[conflict.conflict_type]}
              </Badge>
              {isResolved && (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Resolved
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{conflict.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Parent Value</div>
              <div className="p-3 bg-muted/50 rounded-md">
                <code className="text-xs">
                  {JSON.stringify(conflict.parent_value, null, 2)}
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Child Value</div>
              <div className="p-3 bg-accent/50 rounded-md">
                <code className="text-xs">
                  {JSON.stringify(conflict.child_value, null, 2)}
                </code>
              </div>
            </div>
          </div>

          {!isResolved && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Resolution Notes</span>
                </div>
                <Textarea
                  placeholder="Add notes about this resolution (optional)..."
                  value={notes[conflict.id] || ''}
                  onChange={(e) => setNotes(prev => ({ ...prev, [conflict.id]: e.target.value }))}
                  className="resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleResolve(conflict.id, 'accept_child')}
                    disabled={resolvingId === conflict.id}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept Child
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id, 'revert_to_parent')}
                    disabled={resolvingId === conflict.id}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Revert to Parent
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleResolve(conflict.id, 'acknowledge')}
                    disabled={resolvingId === conflict.id}
                  >
                    Mark as Reviewed
                  </Button>
                </div>
              </div>
            </>
          )}

          {isResolved && conflict.resolution_notes && (
            <>
              <Separator />
              <div className="text-sm">
                <span className="font-medium">Resolution Notes: </span>
                <span className="text-muted-foreground">{conflict.resolution_notes}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {unresolvedConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Unresolved Conflicts</h3>
            <Badge variant="destructive">{unresolvedConflicts.length}</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-3 pr-4">
              {unresolvedConflicts.map(conflict => renderConflictCard(conflict, false))}
            </div>
          </ScrollArea>
        </div>
      )}

      {resolvedConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resolved Conflicts</h3>
            <Badge variant="secondary">{resolvedConflicts.length}</Badge>
          </div>
          <ScrollArea className="max-h-96">
            <div className="space-y-3 pr-4">
              {resolvedConflicts.map(conflict => renderConflictCard(conflict, true))}
            </div>
          </ScrollArea>
        </div>
      )}

      {conflicts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="h-12 w-12 text-success mb-4" />
            <p className="text-lg font-medium">No Conflicts</p>
            <p className="text-sm text-muted-foreground mt-1">
              All policies are aligned with their parent policies
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
