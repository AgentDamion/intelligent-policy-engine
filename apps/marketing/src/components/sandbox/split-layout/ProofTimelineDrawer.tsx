import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import { useSandboxRun } from '@/hooks/useSandbox';

interface ProofTimelineDrawerProps {
  workspaceId: string;
  selectedRunId: string | null;
  onClose: () => void;
}

export function ProofTimelineDrawer({
  workspaceId,
  selectedRunId,
  onClose
}: ProofTimelineDrawerProps) {
  const { events } = useSandboxRun(selectedRunId || '');

  const timelineEvents = [
    { label: 'Policy Created', status: 'complete', time: '2h ago' },
    { label: 'Test Run', status: 'complete', time: '1h ago' },
    { label: 'AI Signal Detected', status: 'complete', time: '45m ago' },
    { label: 'Human Review', status: 'pending', time: 'pending' },
    { label: 'Proof Completed', status: 'pending', time: 'pending' },
  ];

  return (
    <div className="border-t border-border bg-background animate-in slide-in-from-bottom duration-300">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Proof Timeline</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {timelineEvents.map((event, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-shrink-0">
              <Card className={`p-3 min-w-[160px] ${
                event.status === 'complete' 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                  : 'bg-muted/50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    event.status === 'complete' ? 'bg-green-500' : 'bg-muted-foreground/30'
                  }`} />
                  <div className="flex-1">
                    <div className="text-xs font-medium">{event.label}</div>
                    <div className="text-xs text-muted-foreground">{event.time}</div>
                  </div>
                </div>
              </Card>
              {idx < timelineEvents.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
