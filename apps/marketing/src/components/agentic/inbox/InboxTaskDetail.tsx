import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Check, X, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useInboxTask } from '@/hooks/useInboxTasks';

interface InboxTaskDetailProps {
  taskId: string;
}

export const InboxTaskDetail = ({ taskId }: InboxTaskDetailProps) => {
  const queryClient = useQueryClient();
  const { data: task, isLoading } = useInboxTask(taskId);

  const executeMutation = useMutation({
    mutationFn: async (action: 'approve' | 'reject') => {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'inbox',
          action: 'execute_action',
          payload: { task_id: taskId, action }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, action) => {
      toast.success(`Task ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['inbox-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-task', taskId] });
    },
    onError: (error) => {
      toast.error(`Failed to execute action: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    );
  }

  const getPriorityVariant = (priority: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Badge variant={getPriorityVariant(task.priority)}>
            {task.priority.toUpperCase()} PRIORITY
          </Badge>
          <Badge variant="outline">
            {task.task_type.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">From: {task.source_agent}</Badge>
          <Badge variant="outline">For: {task.user_role_target}</Badge>
          <Badge variant="secondary">{task.status}</Badge>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: task.summary_html }}
          />
        </CardContent>
      </Card>

      {/* Context Data */}
      {task.context_data && Object.keys(task.context_data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Context</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {Object.entries(task.context_data).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <dt className="font-medium text-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </dt>
                  <dd className="text-muted-foreground">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {task.status === 'pending' && (
        <div className="flex gap-3">
          <Button
            onClick={() => executeMutation.mutate('approve')}
            disabled={executeMutation.isPending}
            className="flex-1"
          >
            <Check className="mr-2 h-4 w-4" />
            Approve & Execute
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => executeMutation.mutate('reject')}
            disabled={executeMutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          
          {task.source_url && (
            <Button variant="outline" asChild>
              <a href={task.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Source
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Status Display for Completed Tasks */}
      {task.status !== 'pending' && (
        <Alert variant={task.status === 'approved' ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="capitalize">
            {task.status === 'approved' ? 'Approved' : 
             task.status === 'rejected' ? 'Rejected' : 
             task.status}
          </AlertTitle>
          <AlertDescription>
            {task.actioned_at && (
              <div className="mt-2">
                Actioned on {new Date(task.actioned_at).toLocaleString()}
              </div>
            )}
            {task.action_response && (
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(task.action_response, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata Footer */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created: {new Date(task.created_at).toLocaleString()}
        {task.updated_at !== task.created_at && (
          <> · Updated: {new Date(task.updated_at).toLocaleString()}</>
        )}
      </div>
    </div>
  );
};
