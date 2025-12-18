import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, CheckCircle, AlertTriangle, FileText, Users } from 'lucide-react';

const Notifications = () => {
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'submission',
      title: 'New submission received',
      message: 'MedTech Innovations submitted "AI Diagnostic Tool" for review',
      timestamp: '2 hours ago',
      unread: true,
      link: '/submissions/123'
    },
    {
      id: 2,
      type: 'decision',
      title: 'Decision issued',
      message: 'Your submission "Oncology AI Tool" has been approved with conditions',
      timestamp: '1 day ago',
      unread: false,
      link: '/decisions/456'
    },
    {
      id: 3,
      type: 'policy',
      title: 'Policy updated',
      message: 'Medical Device AI Policy v2.1 has been distributed to your workspace',
      timestamp: '2 days ago',
      unread: false,
      link: '/policies/789'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission': return <FileText className="h-4 w-4" />;
      case 'decision': return <CheckCircle className="h-4 w-4" />;
      case 'policy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'submission': return 'text-brand-teal';
      case 'decision': return 'text-brand-green';
      case 'policy': return 'text-brand-orange';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on submissions, decisions, and policy changes
            </p>
          </div>
          <Button variant="outline" size="sm">
            Mark All Read
          </Button>
        </div>

        <Separator />

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.unread ? 'border-brand-teal/20 bg-brand-teal/5' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {notification.unread && (
                          <Badge variant="outline" className="text-xs">
                            New
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {notification.unread && (
                        <Button variant="ghost" size="sm">
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for when no notifications */}
        {notifications.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! We'll notify you when there are updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;