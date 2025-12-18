import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { AgentActivity } from '@/hooks/useSandboxAgents';

interface SandboxAgentActivityProps {
  activities: AgentActivity[];
  isProcessing: boolean;
}

const agentIcons: Record<string, string> = {
  policy: '📋',
  sandbox: '🔬',
  compliance: '✓',
  risk: '⚠️',
  governance: '⚖️',
};

const statusIcons = {
  pending: Clock,
  processing: Loader2,
  success: CheckCircle2,
  failed: XCircle,
};

const statusColors = {
  pending: 'bg-muted',
  processing: 'bg-primary',
  success: 'bg-success',
  failed: 'bg-destructive',
};

export function SandboxAgentActivity({ activities, isProcessing }: SandboxAgentActivityProps) {
  if (activities.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI Agent Activity</CardTitle>
        </div>
        <CardDescription>
          Real-time multi-agent policy simulation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => {
          const StatusIcon = statusIcons[activity.status];
          
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-xl">
                {agentIcons[activity.agent] || '🤖'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize">
                    {activity.agent}Agent
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {activity.action.replace(/_/g, ' ')}
                  </Badge>
                  <StatusIcon 
                    className={`h-4 w-4 ml-auto ${
                      activity.status === 'processing' ? 'animate-spin' : ''
                    }`}
                  />
                </div>
                
                {activity.confidence && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>Confidence:</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${activity.confidence * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(activity.confidence * 100)}%</span>
                  </div>
                )}
                
                {activity.riskLevel && (
                  <Badge 
                    variant={
                      activity.riskLevel === 'high' ? 'destructive' :
                      activity.riskLevel === 'medium' ? 'default' :
                      'secondary'
                    }
                    className="text-xs mt-1"
                  >
                    {activity.riskLevel} risk
                  </Badge>
                )}
                
                {activity.reasoning && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {activity.reasoning}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {isProcessing && activities.every(a => a.status === 'success') && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
            Finalizing simulation...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
