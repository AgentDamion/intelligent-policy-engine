import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { monitoring } from '@/utils/monitoring';
import { 
  Bell, 
  FileText, 
  Cpu, 
  CheckCircle, 
  AlertCircle,
  Clock,
  X,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProcessingNotification {
  id: string;
  type: 'processing_started' | 'processing_completed' | 'processing_failed' | 'document_uploaded';
  title: string;
  message: string;
  documentId?: string;
  documentName?: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface RealTimeNotificationsProps {
  workspaceId?: string;
  className?: string;
}

export function RealTimeNotifications({
  workspaceId,
  className
}: RealTimeNotificationsProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ProcessingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('processing-notifications')
      .on('broadcast', { event: 'processing_progress' }, (payload) => {
        handleProcessingUpdate(payload.payload);
      })
      .on('broadcast', { event: 'document_uploaded' }, (payload) => {
        handleDocumentUpload(payload.payload);
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        handleDocumentChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const handleProcessingUpdate = useCallback((payload: any) => {
    const { jobId, stage, progress, message, data } = payload;
    
    // Create notification based on progress
    let notification: ProcessingNotification | null = null;

    if (progress === 0 && stage === 'Initializing') {
      notification = {
        id: `${jobId}-started`,
        type: 'processing_started',
        title: 'Processing Started',
        message: `Document processing has begun`,
        documentId: data?.documentId,
        documentName: data?.documentName,
        timestamp: new Date(),
        read: false,
        data: payload
      };
    } else if (progress === 100) {
      notification = {
        id: `${jobId}-completed`,
        type: 'processing_completed',
        title: 'Processing Complete',
        message: `Document has been successfully processed`,
        documentId: data?.documentId,
        documentName: data?.documentName,
        timestamp: new Date(),
        read: false,
        data: payload
      };
    } else if (message?.includes('failed') || message?.includes('error')) {
      notification = {
        id: `${jobId}-failed`,
        type: 'processing_failed',
        title: 'Processing Failed',
        message: message || 'Document processing encountered an error',
        documentId: data?.documentId,
        documentName: data?.documentName,
        timestamp: new Date(),
        read: false,
        data: payload
      };
    }

    if (notification) {
      addNotification(notification);
      
      // Show toast for important updates
      if (notification.type === 'processing_completed') {
        toast({
          title: "Processing Complete",
          description: notification.message,
          duration: 5000,
        });
      } else if (notification.type === 'processing_failed') {
        toast({
          title: "Processing Failed",
          description: notification.message,
          variant: "destructive",
          duration: 7000,
        });
      }
    }
  }, [toast]);

  const handleDocumentUpload = useCallback((payload: any) => {
    const notification: ProcessingNotification = {
      id: `upload-${payload.documentId}`,
      type: 'document_uploaded',
      title: 'Document Uploaded',
      message: `${payload.documentName} has been uploaded successfully`,
      documentId: payload.documentId,
      documentName: payload.documentName,
      timestamp: new Date(),
      read: false,
      data: payload
    };

    addNotification(notification);
  }, []);

  const handleDocumentChange = useCallback((payload: any) => {
    if (import.meta.env.DEV) {
      monitoring.debug('Document change', payload);
    }
    
    if (payload.eventType === 'UPDATE' && payload.new.processing_status !== payload.old?.processing_status) {
      const status = payload.new.processing_status;
      let notification: ProcessingNotification | null = null;

      if (status === 'processing') {
        notification = {
          id: `doc-${payload.new.id}-processing`,
          type: 'processing_started',
          title: 'Processing Started',
          message: `${payload.new.filename} is now being processed`,
          documentId: payload.new.id,
          documentName: payload.new.filename,
          timestamp: new Date(),
          read: false
        };
      } else if (status === 'completed') {
        notification = {
          id: `doc-${payload.new.id}-completed`,
          type: 'processing_completed',
          title: 'Processing Complete',
          message: `${payload.new.filename} has been processed successfully`,
          documentId: payload.new.id,
          documentName: payload.new.filename,
          timestamp: new Date(),
          read: false
        };
      } else if (status === 'failed') {
        notification = {
          id: `doc-${payload.new.id}-failed`,
          type: 'processing_failed',
          title: 'Processing Failed',
          message: `${payload.new.filename} processing failed`,
          documentId: payload.new.id,
          documentName: payload.new.filename,
          timestamp: new Date(),
          read: false
        };
      }

      if (notification) {
        addNotification(notification);
      }
    }
  }, []);

  const addNotification = useCallback((notification: ProcessingNotification) => {
    setNotifications(prev => {
      // Remove existing notification with same ID to avoid duplicates
      const filtered = prev.filter(n => n.id !== notification.id);
      const updated = [notification, ...filtered].slice(0, 50); // Keep last 50
      return updated;
    });

    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? prev - 1 : prev;
    });
  }, [notifications]);

  const getNotificationIcon = (type: ProcessingNotification['type']) => {
    switch (type) {
      case 'processing_started':
        return <Cpu className="h-4 w-4 text-blue-500" />;
      case 'processing_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'document_uploaded':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-1"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-0">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 border-b hover:bg-muted/50 transition-colors",
                      !notification.read && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        {notification.documentName && (
                          <div className="flex items-center gap-1 mb-2">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">
                              {notification.documentName}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(notification.timestamp)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {notification.documentId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 text-xs"
                                onClick={() => {
                                  // Navigate to document
                                  monitoring.trackUserAction('Navigate to document', { 
                                    documentId: notification.documentId 
                                  });
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1"
                              onClick={() => {
                                if (!notification.read) markAsRead(notification.id);
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}