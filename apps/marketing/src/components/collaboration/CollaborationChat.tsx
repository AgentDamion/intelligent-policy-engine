import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Users,
  X,
  Minimize2,
  Maximize2,
  AtSign,
  Paperclip
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEnhancedCollaboration, CollaborationMessage } from '@/hooks/useEnhancedCollaboration';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationChatProps {
  documentId: string;
  documentType: string;
  workspaceId?: string;
  className?: string;
}

interface VoiceRecording {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
}

export const CollaborationChat: React.FC<CollaborationChatProps> = ({
  documentId,
  documentType,
  workspaceId,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    isRecording: false,
    audioBlob: null,
    duration: 0
  });
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout>();

  const {
    messages,
    collaborationSessions,
    sendMessage,
    currentUserSession
  } = useEnhancedCollaboration({
    documentId,
    documentType,
    workspaceId,
    onMessageReceived: (message) => {
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      scrollToBottom();
    }
  });

  // Mock user data - in real app, this would come from your user management system
  const mockUsers = [
    { id: 'user1', name: 'Alice Johnson', avatar: null },
    { id: 'user2', name: 'Bob Smith', avatar: null },
    { id: 'user3', name: 'Carol Davis', avatar: null }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    await sendMessage(messageText);
    setMessageText('');
    scrollToBottom();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setVoiceRecording(prev => ({ ...prev, audioBlob, isRecording: false }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setVoiceRecording(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setVoiceRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && voiceRecording.isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!voiceRecording.audioBlob) return;

    // In a real app, you'd upload the audio blob to storage first
    const voiceMessageContent = `Voice message (${voiceRecording.duration}s)`;
    
    await sendMessage(
      voiceMessageContent,
      undefined,
      'voice',
      {
        duration: voiceRecording.duration,
        voiceNoteUrl: URL.createObjectURL(voiceRecording.audioBlob)
      }
    );

    setVoiceRecording({ isRecording: false, audioBlob: null, duration: 0 });
  };

  const handleMention = (text: string) => {
    const atIndex = text.lastIndexOf('@');
    if (atIndex >= 0) {
      const query = text.slice(atIndex + 1);
      setMentionQuery(query);
      setShowMentions(query.length > 0);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (userName: string) => {
    const atIndex = messageText.lastIndexOf('@');
    const beforeMention = messageText.slice(0, atIndex);
    const afterMention = messageText.slice(atIndex + mentionQuery.length + 1);
    setMessageText(`${beforeMention}@${userName} ${afterMention}`);
    setShowMentions(false);
    messageInputRef.current?.focus();
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getActiveUsers = () => {
    return collaborationSessions.filter(session => session.isActive);
  };

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="relative rounded-full w-12 h-12 shadow-lg"
          size="lg"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 shadow-xl animate-scale-in ${
        isMinimized ? 'w-80 h-12' : 'w-80 h-96'
      } ${className}`}
    >
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Collaboration Chat
            <Badge variant="secondary" className="text-xs">
              {getActiveUsers().length} online
            </Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="pt-0 flex flex-col h-80">
          {/* Active users */}
          <div className="flex items-center gap-1 mb-2 pb-2 border-b">
            <Users className="w-3 h-3 text-muted-foreground" />
            <div className="flex gap-1">
              {getActiveUsers().slice(0, 5).map((session) => (
                <Avatar key={session.id} className="w-5 h-5">
                  <AvatarFallback className="text-xs">
                    {session.userId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {getActiveUsers().length > 5 && (
                <Badge variant="secondary" className="w-5 h-5 p-0 text-xs">
                  +{getActiveUsers().length - 5}
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.senderId === currentUserSession?.userId ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {message.senderId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 min-w-0 ${
                    message.senderId === currentUserSession?.userId ? 'text-right' : ''
                  }`}>
                    <div
                      className={`inline-block p-2 rounded-lg text-sm max-w-xs ${
                        message.senderId === currentUserSession?.userId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.messageType === 'voice' ? (
                        <div className="flex items-center gap-2">
                          <Mic className="w-3 h-3" />
                          <span>Voice message ({message.metadata?.duration}s)</span>
                          {message.metadata?.voiceNoteUrl && (
                            <audio controls className="w-full max-w-32">
                              <source src={message.metadata.voiceNoteUrl} type="audio/wav" />
                            </audio>
                          )}
                        </div>
                      ) : (
                        <div>{message.content}</div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Voice recording preview */}
          {voiceRecording.audioBlob && (
            <div className="p-2 border rounded-lg mb-2 bg-muted">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">Voice message ({voiceRecording.duration}s)</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={sendVoiceMessage}>
                    <Send className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVoiceRecording({ isRecording: false, audioBlob: null, duration: 0 })}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Message input */}
          <div className="flex gap-1 relative">
            <div className="flex-1 relative">
              <Input
                ref={messageInputRef}
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleMention(e.target.value);
                }}
                onKeyPress={handleKeyPress}
                disabled={voiceRecording.isRecording}
                className="pr-8"
              />
              
              {/* Mentions dropdown */}
              {showMentions && (
                <Card className="absolute bottom-full left-0 right-0 mb-1 shadow-lg">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {mockUsers
                        .filter(user => 
                          user.name.toLowerCase().includes(mentionQuery.toLowerCase())
                        )
                        .map(user => (
                          <Button
                            key={user.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => insertMention(user.name)}
                          >
                            <AtSign className="w-3 h-3 mr-1" />
                            {user.name}
                          </Button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className={`${voiceRecording.isRecording ? 'bg-red-500 text-white' : ''}`}
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onMouseLeave={stopVoiceRecording}
            >
              {voiceRecording.isRecording ? (
                <div className="flex items-center gap-1">
                  <MicOff className="w-4 h-4" />
                  <span className="text-xs">{voiceRecording.duration}s</span>
                </div>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || voiceRecording.isRecording}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};