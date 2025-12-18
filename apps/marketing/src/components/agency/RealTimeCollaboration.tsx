import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Eye, 
  Edit, 
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck
} from "lucide-react";

interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  currentActivity?: string;
}

interface LiveNotification {
  id: string;
  type: 'policy_update' | 'approval_request' | 'conflict_alert' | 'system_update';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  actionRequired?: boolean;
}

interface PolicyEditor {
  policyId: string;
  policyName: string;
  editors: CollaborationUser[];
  lastUpdated: Date;
  conflictResolved: boolean;
}

const RealTimeCollaboration: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [liveEditing, setLiveEditing] = useState<PolicyEditor[]>([]);
  const [activeTab, setActiveTab] = useState('users');

  // Simulate real-time data
  useEffect(() => {
    // Mock active users
    const mockUsers: CollaborationUser[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'Senior Compliance Manager',
        status: 'online',
        currentActivity: 'Reviewing AI Usage Policy v2.1'
      },
      {
        id: '2',
        name: 'Mike Chen',
        role: 'Policy Analyst',
        status: 'online',
        currentActivity: 'Editing Data Privacy Guidelines'
      },
      {
        id: '3',
        name: 'Emma Davis',
        role: 'Governance Specialist',
        status: 'away',
        currentActivity: 'In conflict resolution meeting'
      },
      {
        id: '4',
        name: 'Tom Wilson',
        role: 'Client Success Manager',
        status: 'online',
        currentActivity: 'Monitoring TechCorp approval queue'
      }
    ];

    // Mock notifications
    const mockNotifications: LiveNotification[] = [
      {
        id: '1',
        type: 'approval_request',
        title: 'New Tool Approval Required',
        message: 'ChatGPT-4o submitted by TechCorp requires your approval',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        priority: 'high',
        read: false,
        actionRequired: true
      },
      {
        id: '2',
        type: 'policy_update',
        title: 'Policy Updated',
        message: 'AI Usage Policy v2.1 has been updated by Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        priority: 'medium',
        read: false
      },
      {
        id: '3',
        type: 'conflict_alert',
        title: 'Conflict Detected',
        message: 'Policy version mismatch detected for StartupXYZ',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        priority: 'high',
        read: true,
        actionRequired: true
      }
    ];

    // Mock live editing sessions
    const mockLiveEditing: PolicyEditor[] = [
      {
        policyId: '1',
        policyName: 'AI Usage Policy v2.1',
        editors: [mockUsers[0], mockUsers[1]],
        lastUpdated: new Date(Date.now() - 1000 * 60 * 2),
        conflictResolved: true
      },
      {
        policyId: '2',
        policyName: 'Data Privacy Guidelines',
        editors: [mockUsers[1]],
        lastUpdated: new Date(Date.now() - 1000 * 60 * 5),
        conflictResolved: false
      }
    ];

    setActiveUsers(mockUsers);
    setNotifications(mockNotifications);
    setLiveEditing(mockLiveEditing);

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Add a new notification occasionally
      if (Math.random() > 0.8) {
        const newNotification: LiveNotification = {
          id: Date.now().toString(),
          type: 'system_update',
          title: 'System Update',
          message: 'Automated conflict scan completed',
          timestamp: new Date(),
          priority: 'low',
          read: false
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_request': return <UserCheck className="h-4 w-4" />;
      case 'policy_update': return <Edit className="h-4 w-4" />;
      case 'conflict_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'system_update': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Real-Time Collaboration
            </CardTitle>
            <CardDescription>
              Live collaboration, notifications, and instant conflict resolution
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Active Users ({activeUsers.filter(u => u.status === 'online').length})
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="editing">
              <Edit className="h-4 w-4 mr-2" />
              Live Editing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="space-y-3">
              {activeUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </div>
                    {user.currentActivity && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <Eye className="h-3 w-3 inline mr-1" />
                        {user.currentActivity}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user.status}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    notification.read ? 'bg-background' : 'bg-muted/50'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.title}</span>
                        <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                          {notification.priority}
                        </Badge>
                        {notification.actionRequired && (
                          <Badge variant="outline" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="editing" className="space-y-4">
            <div className="space-y-3">
              {liveEditing.map((session) => (
                <div key={session.policyId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{session.policyName}</div>
                    <div className="flex items-center gap-2">
                      {session.conflictResolved ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Conflict
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">Editors:</span>
                    <div className="flex -space-x-2">
                      {session.editors.map((editor) => (
                        <Avatar key={editor.id} className="w-6 h-6 border-2 border-background">
                          <AvatarImage src={editor.avatar} />
                          <AvatarFallback className="text-xs">
                            {editor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({session.editors.length} active)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Last updated: {session.lastUpdated.toLocaleTimeString()}
                    </span>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Join Session
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RealTimeCollaboration;