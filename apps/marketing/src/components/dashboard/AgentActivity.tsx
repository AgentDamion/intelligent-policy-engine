import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw } from "lucide-react";

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'running';
  details: {
    status?: string;
    description?: string;
  };
}

interface AgentActivityProps {
  activities: AgentActivity[];
  loading: boolean;
  onRefresh: () => void;
}

const AgentActivity = ({ activities, loading, onRefresh }: AgentActivityProps) => {
  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          Recent AI Agent Activity
        </CardTitle>
        <CardDescription>Real-time updates from your compliance agents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {activities.length} recent activities
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading activities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{activity.agent}</span>
                        <Badge className={getActivityStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{activity.action}</p>
                      {activity.details.description && (
                        <p className="text-xs text-gray-500">{activity.details.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Bot className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-700">All quiet for now</p>
                <p className="text-sm text-gray-500">Your agents will report activity here</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentActivity;