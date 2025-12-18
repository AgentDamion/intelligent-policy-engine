import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { monitoring } from '@/utils/monitoring';
import { 
  Users, 
  Eye, 
  FileText, 
  Cpu,
  Clock,
  Activity
} from 'lucide-react';

export interface UserPresence {
  user_id: string;
  user_email?: string;
  user_name?: string;
  avatar_url?: string;
  status: 'viewing' | 'editing' | 'processing';
  current_document?: string;
  last_activity: string;
  metadata?: Record<string, any>;
}

interface CollaborationIndicatorProps {
  documentId?: string;
  workspaceId?: string;
  className?: string;
}

export function CollaborationIndicator({
  documentId,
  workspaceId,
  className
}: CollaborationIndicatorProps) {
  const [presenceData, setPresenceData] = useState<Record<string, UserPresence>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channelName = documentId 
      ? `document-${documentId}` 
      : workspaceId 
        ? `workspace-${workspaceId}` 
        : 'global-activity';

    const channel = supabase.channel(channelName);

    // Track user presence
    const userStatus: UserPresence = {
      user_id: currentUser.id,
      user_email: currentUser.email,
      user_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
      avatar_url: currentUser.user_metadata?.avatar_url,
      status: documentId ? 'viewing' : 'editing',
      current_document: documentId,
      last_activity: new Date().toISOString(),
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    };

    // Set up presence tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        if (import.meta.env.DEV) {
          monitoring.debug('Presence sync', newState);
        }
        
        // Flatten presence data
        const flatPresence: Record<string, UserPresence> = {};
        Object.entries(newState).forEach(([userId, presences]) => {
          const presenceArray = presences as any[];
          const latestPresence = presenceArray[0] as UserPresence;
          if (latestPresence) {
            flatPresence[userId] = latestPresence;
          }
        });
        
        setPresenceData(flatPresence);
        setOnlineCount(Object.keys(flatPresence).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (import.meta.env.DEV) {
          monitoring.debug('User joined', { key, newPresences });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (import.meta.env.DEV) {
          monitoring.debug('User left', { key, leftPresences });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence
          const trackStatus = await channel.track(userStatus);
          if (import.meta.env.DEV) {
            monitoring.debug('Presence track status', trackStatus);
          }
        }
      });

    // Update presence periodically
    const presenceInterval = setInterval(async () => {
      if (channel.state === 'joined') {
        await channel.track({
          ...userStatus,
          last_activity: new Date().toISOString(),
          metadata: {
            ...userStatus.metadata,
            timestamp: Date.now()
          }
        });
      }
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(presenceInterval);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [currentUser, documentId, workspaceId]);

  const getStatusIcon = (status: UserPresence['status']) => {
    switch (status) {
      case 'viewing':
        return <Eye className="h-3 w-3" />;
      case 'editing':
        return <FileText className="h-3 w-3" />;
      case 'processing':
        return <Cpu className="h-3 w-3 animate-spin" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: UserPresence['status']) => {
    switch (status) {
      case 'viewing':
        return 'bg-blue-500';
      case 'editing':
        return 'bg-green-500';
      case 'processing':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const otherUsers = Object.values(presenceData).filter(
    user => user.user_id !== currentUser?.id
  );

  if (onlineCount === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Live Collaboration
          <Badge variant="secondary" className="text-xs">
            {onlineCount} online
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Current User */}
        {currentUser && (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <div className="relative">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentUser.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background ${getStatusColor('viewing')}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                You ({currentUser.user_metadata?.full_name || 'Me'})
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getStatusIcon('viewing')}
                <span>Viewing</span>
              </div>
            </div>
          </div>
        )}

        {/* Other Users */}
        {otherUsers.map((user) => (
          <div key={user.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
            <div className="relative">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-xs">
                  {user.user_name?.charAt(0).toUpperCase() || user.user_email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background ${getStatusColor(user.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {user.user_name || user.user_email?.split('@')[0]}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getStatusIcon(user.status)}
                <span className="capitalize">{user.status}</span>
                <span>•</span>
                <Clock className="h-2.5 w-2.5" />
                <span>{formatLastActivity(user.last_activity)}</span>
              </div>
            </div>
          </div>
        ))}

        {otherUsers.length === 0 && (
          <div className="text-center py-2">
            <div className="text-xs text-muted-foreground">
              You're the only one here
            </div>
          </div>
        )}

        {/* Activity Summary */}
        {documentId && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Document activity</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>Live</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
