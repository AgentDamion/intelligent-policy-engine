import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Edit, MessageSquare, CheckCircle, Clock, User } from 'lucide-react';
import { useEnhancedCollaboration, CollaborationSession } from '@/hooks/useEnhancedCollaboration';

interface DocumentSectionTrackerProps {
  documentId: string;
  documentType: string;
  sectionId?: string;
  children: React.ReactNode;
  className?: string;
}

interface UserPresenceIndicator {
  userId: string;
  sessionType: CollaborationSession['sessionType'];
  presenceData: CollaborationSession['presenceData'];
  lastActivity: string;
}

export const DocumentSectionTracker: React.FC<DocumentSectionTrackerProps> = ({
  documentId,
  documentType,
  sectionId,
  children,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresenceIndicator[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const {
    collaborationSessions,
    currentUserSession,
    startCollaborationSession,
    updatePresence
  } = useEnhancedCollaboration({
    documentId,
    documentType,
    onPresenceUpdate: (sessions) => {
      // Filter sessions for this section or document-level sessions
      const relevantSessions = sessions.filter(session => 
        !sectionId || !session.sectionId || session.sectionId === sectionId
      );
      
      const presence: UserPresenceIndicator[] = relevantSessions.map(session => ({
        userId: session.userId,
        sessionType: session.sessionType,
        presenceData: session.presenceData,
        lastActivity: session.lastActivity
      }));
      
      setUserPresence(presence);
    }
  });

  // Track section visibility and user interaction
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        
        if (entry.isIntersecting && currentUserSession) {
          updatePresence({
            scrollPosition: window.scrollY,
            lastActivity: new Date().toISOString()
          });
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [currentUserSession, updatePresence]);

  // Start section viewing session when component mounts
  useEffect(() => {
    if (isInView && !currentUserSession) {
      startCollaborationSession('viewing', sectionId);
    }
  }, [isInView, currentUserSession, startCollaborationSession, sectionId]);

  // Handle mouse interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (currentUserSession) {
      updatePresence({
        lastActivity: new Date().toISOString()
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    if (!currentUserSession) {
      startCollaborationSession('editing', sectionId);
    } else if (currentUserSession.sessionType === 'viewing') {
      startCollaborationSession('editing', sectionId);
    }
  };

  const getSessionIcon = (sessionType: CollaborationSession['sessionType']) => {
    switch (sessionType) {
      case 'viewing':
        return <Eye className="w-3 h-3" />;
      case 'editing':
        return <Edit className="w-3 h-3" />;
      case 'reviewing':
        return <CheckCircle className="w-3 h-3" />;
      case 'commenting':
        return <MessageSquare className="w-3 h-3" />;
      case 'approving':
        return <CheckCircle className="w-3 h-3" />;
      case 'validating':
        return <Clock className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getSessionColor = (sessionType: CollaborationSession['sessionType']) => {
    switch (sessionType) {
      case 'viewing':
        return 'bg-muted text-muted-foreground';
      case 'editing':
        return 'bg-warning text-warning-foreground';
      case 'reviewing':
        return 'bg-info text-info-foreground';
      case 'commenting':
        return 'bg-accent text-accent-foreground';
      case 'approving':
        return 'bg-success text-success-foreground';
      case 'validating':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMs = now.getTime() - activity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return activity.toLocaleDateString();
  };

  return (
    <div
      ref={sectionRef}
      className={`relative transition-all duration-200 ${className} ${
        isHovered ? 'ring-2 ring-accent/50' : ''
      } ${isInView ? 'border-l-2 border-l-primary/30' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      
      {/* Presence indicators */}
      {userPresence.length > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <TooltipProvider>
            {userPresence.slice(0, 3).map((presence, index) => (
              <Tooltip key={presence.userId}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="w-6 h-6 border-2 border-background">
                      <AvatarImage src={`/avatars/${presence.userId}.jpg`} />
                      <AvatarFallback className="text-xs">
                        {presence.userId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      className={`absolute -bottom-1 -right-1 w-4 h-4 p-0 flex items-center justify-center ${getSessionColor(presence.sessionType)}`}
                    >
                      {getSessionIcon(presence.sessionType)}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-sm">
                    <div className="font-medium capitalize">
                      {presence.sessionType.replace('_', ' ')}
                    </div>
                    <div className="text-muted-foreground">
                      {formatLastActivity(presence.lastActivity)}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            
            {userPresence.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    +{userPresence.length - 3}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-sm">
                    {userPresence.length - 3} more user{userPresence.length - 3 > 1 ? 's' : ''} active
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}
      
      {/* Section activity indicator */}
      {isInView && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r animate-pulse" />
      )}
    </div>
  );
};