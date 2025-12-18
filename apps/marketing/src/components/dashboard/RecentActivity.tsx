import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAgentActivities } from '@/hooks/useAgentActivities';

const RecentActivity = () => {
  const { agentActivities: activities, activitiesLoading: loading, refetch: fetchActivities } = useAgentActivities();
  const getStatusIcon = (status: string) => {
    return status === 'healthy' || status === 'active' || status === 'success' ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI Agent Activity</CardTitle>
            <CardDescription>
              Real-time updates from your compliance agents
            </CardDescription>
          </div>
          <button
            onClick={fetchActivities}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-1">
                  {getStatusIcon(activity.status || 'success')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.agent}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="font-medium text-gray-700">
                {loading ? 'Loading agent activities...' : 'No agent activities yet'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {!loading && 'Run some agent actions to see them appear here!'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;