import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle, AlertTriangle, Clock, Activity, Zap } from 'lucide-react';

interface Notification {
  id: string;
  type: 'approval' | 'conflict' | 'compliance' | 'alert';
  title: string;
  description: string;
  client: string;
  timestamp: Date;
  isRead: boolean;
}

interface ActivityFeedItem {
  id: string;
  user: string;
  action: string;
  target: string;
  client: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'warning';
}

const RealTimeFeatures = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate real-time notifications
  useEffect(() => {
    const simulateNotifications = () => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: ['approval', 'conflict', 'compliance', 'alert'][Math.floor(Math.random() * 4)] as any,
        title: 'New Tool Request',
        description: 'Claude 3.5 Sonnet approval pending',
        client: 'Acme Pharma',
        timestamp: new Date(),
        isRead: false
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    };

    const simulateActivity = () => {
      const activities = [
        'approved AI tool request',
        'updated policy document',
        'completed risk assessment',
        'resolved policy conflict',
        'submitted compliance report'
      ];
      
      const newActivity: ActivityFeedItem = {
        id: Math.random().toString(36).substr(2, 9),
        user: ['Dr. Sarah Chen', 'Mike Rodriguez', 'Elena Vasquez'][Math.floor(Math.random() * 3)],
        action: activities[Math.floor(Math.random() * activities.length)],
        target: 'GPT-4 Turbo',
        client: ['Acme Pharma', 'BioTech Corp', 'MediGen Labs'][Math.floor(Math.random() * 3)],
        timestamp: new Date(),
        status: ['success', 'pending', 'warning'][Math.floor(Math.random() * 3)] as any
      };
      
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 14)]);
    };

    // Initial data
    simulateNotifications();
    simulateActivity();

    // Set up intervals for real-time simulation
    const notificationInterval = setInterval(simulateNotifications, 15000);
    const activityInterval = setInterval(simulateActivity, 8000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(activityInterval);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'conflict': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'compliance': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending': return <Clock className="h-3 w-3 text-orange-600" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <AlertDescription>
            {isConnected ? 'Real-time updates active' : 'Connection lost - attempting to reconnect...'}
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Live Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time alerts and updates</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Mark All Read
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.isRead ? 'bg-background' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {notification.client}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time user actions across all clients</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.client}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common real-time governance actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-sm">Bulk Approve</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <span className="text-sm">Review Conflicts</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <span className="text-sm">Send Alert</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Activity className="h-6 w-6 text-purple-600" />
              <span className="text-sm">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeFeatures;