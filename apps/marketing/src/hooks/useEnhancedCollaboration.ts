import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebSocketService } from '@/services/webSocketService';

// Enhanced collaboration types
export interface CollaborationSession {
  id: string;
  documentId: string;
  documentType: string;
  userId: string;
  sessionType: 'viewing' | 'editing' | 'reviewing' | 'approving' | 'commenting' | 'validating';
  sectionId?: string;
  presenceData: {
    cursorPosition?: number;
    selection?: { start: number; end: number };
    scrollPosition?: number;
    lastActivity?: string;
  };
  isActive: boolean;
  lastActivity: string;
}

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  documentType: string;
  sectionId?: string;
  userId: string;
  annotationType: 'comment' | 'suggestion' | 'approval' | 'concern';
  content: string;
  positionData: {
    offset?: number;
    elementId?: string;
    xpath?: string;
  };
  parentId?: string;
  status: 'active' | 'resolved' | 'archived';
  createdAt: string;
  replies?: DocumentAnnotation[];
}

export interface CollaborationMessage {
  id: string;
  documentId?: string;
  documentType?: string;
  workspaceId?: string;
  senderId: string;
  recipientId?: string;
  messageType: 'text' | 'voice' | 'system' | 'mention';
  content: string;
  metadata?: {
    voiceNoteUrl?: string;
    mentions?: string[];
    duration?: number;
  };
  threadId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApprovalWorkflow {
  id: string;
  documentId: string;
  documentType: string;
  workflowName: string;
  currentStage: string;
  stages: {
    name: string;
    assignees: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    completedAt?: string;
    estimatedDuration?: number;
    actualDuration?: number;
  }[];
  progressPercentage: number;
  estimatedCompletion?: string;
  bottleneckDetected: boolean;
  escalationTriggered: boolean;
}

interface UseEnhancedCollaborationOptions {
  documentId: string;
  documentType: string;
  workspaceId?: string;
  onPresenceUpdate?: (sessions: CollaborationSession[]) => void;
  onAnnotationAdded?: (annotation: DocumentAnnotation) => void;
  onMessageReceived?: (message: CollaborationMessage) => void;
  onWorkflowUpdate?: (workflow: ApprovalWorkflow) => void;
}

export const useEnhancedCollaboration = (options: UseEnhancedCollaborationOptions) => {
  const {
    documentId,
    documentType,
    workspaceId,
    onPresenceUpdate,
    onAnnotationAdded,
    onMessageReceived,
    onWorkflowUpdate
  } = options;

  const [collaborationSessions, setCollaborationSessions] = useState<CollaborationSession[]>([]);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserSession, setCurrentUserSession] = useState<CollaborationSession | null>(null);

  const wsSubscriptions = useRef<Set<() => void>>(new Set());
  const sessionUpdateTimer = useRef<NodeJS.Timeout>();

  // Start collaboration session
  const startCollaborationSession = useCallback(async (
    sessionType: CollaborationSession['sessionType'],
    sectionId?: string
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const sessionData = {
        document_id: documentId,
        document_type: documentType,
        user_id: user.user.id,
        session_type: sessionType,
        section_id: sectionId,
        presence_data: {
          lastActivity: new Date().toISOString(),
          sessionType
        },
        is_active: true,
        last_activity: new Date().toISOString()
      };

      const { data: session, error } = await supabase
        .from('collaboration_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

          const collaborationSession: CollaborationSession = {
            id: session.id,
            documentId: session.document_id,
            documentType: session.document_type,
            userId: session.user_id,
            sessionType: session.session_type as CollaborationSession['sessionType'],
            sectionId: session.section_id,
            presenceData: session.presence_data as CollaborationSession['presenceData'],
            isActive: session.is_active,
            lastActivity: session.last_activity
          };

      setCurrentUserSession(collaborationSession);
      setIsConnected(true);

      // Set up periodic presence updates
      sessionUpdateTimer.current = setInterval(() => {
        updatePresence({ lastActivity: new Date().toISOString() });
      }, 30000); // Update every 30 seconds

      return collaborationSession;
    } catch (error) {
      console.error('Failed to start collaboration session:', error);
      return null;
    }
  }, [documentId, documentType]);

  // Update presence data
  const updatePresence = useCallback(async (presenceData: Partial<CollaborationSession['presenceData']>) => {
    if (!currentUserSession) return;

    try {
      const updatedPresenceData = {
        ...currentUserSession.presenceData,
        ...presenceData,
        lastActivity: new Date().toISOString()
      };

      const { error } = await supabase
        .from('collaboration_sessions')
        .update({
          presence_data: updatedPresenceData,
          last_activity: new Date().toISOString()
        })
        .eq('id', currentUserSession.id);

      if (error) throw error;

      setCurrentUserSession(prev => prev ? {
        ...prev,
        presenceData: updatedPresenceData,
        lastActivity: new Date().toISOString()
      } : null);

      // Note: WebSocket broadcasting would be implemented when WebSocketService is extended
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [currentUserSession, documentId]);

  // Add annotation
  const addAnnotation = useCallback(async (
    annotationType: DocumentAnnotation['annotationType'],
    content: string,
    positionData: DocumentAnnotation['positionData'],
    parentId?: string
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const annotationData = {
        document_id: documentId,
        document_type: documentType,
        user_id: user.user.id,
        annotation_type: annotationType,
        content,
        position_data: positionData,
        parent_id: parentId,
        status: 'active'
      };

      const { data: annotation, error } = await supabase
        .from('document_annotations')
        .insert(annotationData)
        .select()
        .single();

      if (error) throw error;

      const newAnnotation: DocumentAnnotation = {
        id: annotation.id,
        documentId: annotation.document_id,
        documentType: annotation.document_type,
        sectionId: annotation.section_id,
        userId: annotation.user_id,
        annotationType: annotation.annotation_type as DocumentAnnotation['annotationType'],
        content: annotation.content,
        positionData: annotation.position_data as DocumentAnnotation['positionData'],
        parentId: annotation.parent_id,
        status: annotation.status as DocumentAnnotation['status'],
        createdAt: annotation.created_at
      };

      setAnnotations(prev => [...prev, newAnnotation]);
      onAnnotationAdded?.(newAnnotation);

      // Note: WebSocket broadcasting would be implemented when WebSocketService is extended

      return newAnnotation;
    } catch (error) {
      console.error('Failed to add annotation:', error);
      return null;
    }
  }, [documentId, documentType, onAnnotationAdded]);

  // Send collaboration message
  const sendMessage = useCallback(async (
    content: string,
    recipientId?: string,
    messageType: CollaborationMessage['messageType'] = 'text',
    metadata?: CollaborationMessage['metadata']
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const messageData = {
        document_id: documentId,
        document_type: documentType,
        workspace_id: workspaceId,
        sender_id: user.user.id,
        recipient_id: recipientId,
        message_type: messageType,
        content,
        metadata: metadata || {},
        is_read: false
      };

      const { data: message, error } = await supabase
        .from('collaboration_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      const newMessage: CollaborationMessage = {
        id: message.id,
        documentId: message.document_id,
        documentType: message.document_type,
        workspaceId: message.workspace_id,
        senderId: message.sender_id,
        recipientId: message.recipient_id,
        messageType: message.message_type as CollaborationMessage['messageType'],
        content: message.content,
        metadata: message.metadata as CollaborationMessage['metadata'],
        isRead: message.is_read,
        createdAt: message.created_at
      };

      setMessages(prev => [...prev, newMessage]);
      onMessageReceived?.(newMessage);

      // Note: WebSocket broadcasting would be implemented when WebSocketService is extended

      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }, [documentId, documentType, workspaceId, onMessageReceived]);

  // End collaboration session
  const endCollaborationSession = useCallback(async () => {
    if (!currentUserSession) return;

    try {
      const { error } = await supabase
        .from('collaboration_sessions')
        .update({ is_active: false })
        .eq('id', currentUserSession.id);

      if (error) throw error;

      setCurrentUserSession(null);
      setIsConnected(false);

      if (sessionUpdateTimer.current) {
        clearInterval(sessionUpdateTimer.current);
      }

      // Clean up WebSocket subscriptions
      wsSubscriptions.current.forEach(unsubscribe => unsubscribe());
      wsSubscriptions.current.clear();
    } catch (error) {
      console.error('Failed to end collaboration session:', error);
    }
  }, [currentUserSession]);

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    const loadCollaborationData = async () => {
      try {
        // Load active collaboration sessions
        const { data: sessions } = await supabase
          .from('collaboration_sessions')
          .select('*')
          .eq('document_id', documentId)
          .eq('is_active', true);

        if (sessions) {
          const collaborationSessions = sessions.map(session => ({
            id: session.id,
            documentId: session.document_id,
            documentType: session.document_type,
            userId: session.user_id,
            sessionType: session.session_type as CollaborationSession['sessionType'],
            sectionId: session.section_id,
            presenceData: session.presence_data as CollaborationSession['presenceData'],
            isActive: session.is_active,
            lastActivity: session.last_activity
          }));
          setCollaborationSessions(collaborationSessions);
          onPresenceUpdate?.(collaborationSessions);
        }

        // Load annotations
        const { data: annotationsData } = await supabase
          .from('document_annotations')
          .select('*')
          .eq('document_id', documentId)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (annotationsData) {
          const annotations = annotationsData.map(annotation => ({
            id: annotation.id,
            documentId: annotation.document_id,
            documentType: annotation.document_type,
            sectionId: annotation.section_id,
            userId: annotation.user_id,
            annotationType: annotation.annotation_type as DocumentAnnotation['annotationType'],
            content: annotation.content,
            positionData: annotation.position_data as DocumentAnnotation['positionData'],
            parentId: annotation.parent_id,
            status: annotation.status as DocumentAnnotation['status'],
            createdAt: annotation.created_at
          }));
          setAnnotations(annotations);
        }

        // Load recent messages
        const { data: messagesData } = await supabase
          .from('collaboration_messages')
          .select('*')
          .eq('document_id', documentId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (messagesData) {
          const messages = messagesData.map(message => ({
            id: message.id,
            documentId: message.document_id,
            documentType: message.document_type,
            workspaceId: message.workspace_id,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            messageType: message.message_type as CollaborationMessage['messageType'],
            content: message.content,
            metadata: message.metadata as CollaborationMessage['metadata'],
            isRead: message.is_read,
            createdAt: message.created_at
          })).reverse();
          setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load collaboration data:', error);
      }
    };

    loadCollaborationData();

    // Set up real-time subscriptions
    const sessionChannel = supabase
      .channel(`collaboration_sessions:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_sessions',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const session = payload.new;
            const collaborationSession: CollaborationSession = {
              id: session.id,
              documentId: session.document_id,
              documentType: session.document_type,
              userId: session.user_id,
              sessionType: session.session_type,
              sectionId: session.section_id,
              presenceData: session.presence_data,
              isActive: session.is_active,
              lastActivity: session.last_activity
            };

            setCollaborationSessions(prev => {
              const updated = prev.filter(s => s.id !== session.id);
              if (session.is_active) {
                updated.push(collaborationSession);
              }
              onPresenceUpdate?.(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    const annotationChannel = supabase
      .channel(`annotations:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_annotations',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          const annotation = payload.new;
          const newAnnotation: DocumentAnnotation = {
            id: annotation.id,
            documentId: annotation.document_id,
            documentType: annotation.document_type,
            sectionId: annotation.section_id,
            userId: annotation.user_id,
            annotationType: annotation.annotation_type,
            content: annotation.content,
            positionData: annotation.position_data,
            parentId: annotation.parent_id,
            status: annotation.status,
            createdAt: annotation.created_at
          };

          setAnnotations(prev => [...prev, newAnnotation]);
          onAnnotationAdded?.(newAnnotation);
        }
      )
      .subscribe();

    const messageChannel = supabase
      .channel(`messages:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_messages',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          const message = payload.new;
          const newMessage: CollaborationMessage = {
            id: message.id,
            documentId: message.document_id,
            documentType: message.document_type,
            workspaceId: message.workspace_id,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            messageType: message.message_type,
            content: message.content,
            metadata: message.metadata,
            isRead: message.is_read,
            createdAt: message.created_at
          };

          setMessages(prev => [...prev, newMessage]);
          onMessageReceived?.(newMessage);
        }
      )
      .subscribe();

    // Note: WebSocket subscriptions would be set up when WebSocketService is extended
    const wsUnsubs: (() => void)[] = [];

    wsSubscriptions.current = new Set(wsUnsubs);

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(annotationChannel);
      supabase.removeChannel(messageChannel);
      
      wsSubscriptions.current.forEach(unsubscribe => unsubscribe());
      
      if (sessionUpdateTimer.current) {
        clearInterval(sessionUpdateTimer.current);
      }
    };
  }, [documentId, onPresenceUpdate, onAnnotationAdded, onMessageReceived]);

  return {
    // State
    collaborationSessions,
    annotations,
    messages,
    approvalWorkflows,
    isConnected,
    currentUserSession,

    // Actions
    startCollaborationSession,
    endCollaborationSession,
    updatePresence,
    addAnnotation,
    sendMessage
  };
};