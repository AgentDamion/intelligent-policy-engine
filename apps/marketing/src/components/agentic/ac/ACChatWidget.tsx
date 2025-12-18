import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useChatWidget } from '@/hooks/useChatWidget';
import { useToast } from '@/hooks/use-toast';
import { ChatWidgetCollapsed } from './ChatWidgetCollapsed';
import { ChatWidgetExpanded } from './ChatWidgetExpanded';
import { FloatingPortal } from '@/components/shared/FloatingPortal';
import type { SuggestedAction } from '@/types/chat';

interface ACChatWidgetProps {
  threadId: string;
  className?: string;
}

export const ACChatWidget = ({ threadId, className }: ACChatWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔍 DEBUG: Component mounting
  console.log('🔍 ACChatWidget MOUNTED', {
    threadId,
    className,
    timestamp: new Date().toISOString()
  });
  
  const {
    messages,
    unreadCount,
    isLoading,
    isSending,
    isConnected,
    sendMessage,
    clearUnread,
    error
  } = useChatWidget(threadId, isExpanded);

  // 🔍 DEBUG: Hook state
  console.log('🔍 ACChatWidget Hook State', {
    threadId,
    messagesCount: messages.length,
    unreadCount,
    isLoading,
    isSending,
    isConnected,
    hasError: !!error,
    errorMessage: error?.message
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Chat Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  // Clear unread when opening
  const handleOpen = useCallback(() => {
    setIsExpanded(true);
    clearUnread();
  }, [clearUnread]);

  // Close widget
  const handleClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Handle action clicks
  const handleActionClick = useCallback(async (action: SuggestedAction) => {
    switch (action.action_type) {
      case 'navigate':
        navigate(action.target);
        setIsExpanded(false);
        break;
        
      case 'download':
        window.open(action.target, '_blank');
        toast({
          title: 'Download Started',
          description: action.description || 'Opening download link'
        });
        break;
        
      case 'modal':
        // Dispatch custom event for modal
        window.dispatchEvent(new CustomEvent('ac-open-modal', {
          detail: {
            type: action.target,
            threadId,
            context: action.context
          }
        }));
        break;
        
      case 'api':
        try {
          const response = await fetch(action.target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.context || {})
          });
          
          if (!response.ok) throw new Error('API call failed');
          
          toast({
            title: 'Action Completed',
            description: action.description || 'Action executed successfully'
          });
        } catch (err) {
          toast({
            title: 'Action Failed',
            description: 'Unable to complete the requested action',
            variant: 'destructive'
          });
        }
        break;
    }
  }, [navigate, threadId, toast]);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      // Error already handled by hook
      throw err;
    }
  }, [sendMessage]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, handleClose]);

  // 🔍 DEBUG: Geometry logging
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById('ac-debug-box');
      if (el) {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        console.log('🔍 ACChatWidget DEBUG BOX GEOMETRY', {
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right
          },
          styles: {
            zIndex: styles.zIndex,
            visibility: styles.visibility,
            display: styles.display,
            opacity: styles.opacity,
            position: styles.position,
            transform: styles.transform
          }
        });
      } else {
        console.log('🔍 ACChatWidget DEBUG BOX NOT FOUND IN DOM');
      }
      console.log('🔍 Viewport', {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        visualViewport: {
          width: window.visualViewport?.width,
          height: window.visualViewport?.height,
          scale: window.visualViewport?.scale
        }
      });
    });
  }, [isExpanded, messages.length]);

  // Don't render for general thread
  if (threadId === 'general') {
    console.log('🔍 ACChatWidget: NOT RENDERING (threadId is "general")');
    return null;
  }

  console.log('🔍 ACChatWidget: RENDERING', {
    isExpanded,
    shouldShowCollapsed: !isExpanded
  });

  return (
    <FloatingPortal>
      {/* 🔍 DEBUG VISUAL INDICATOR - Top left with max z-index */}
      <div 
        id="ac-debug-box"
        className="fixed top-[12px] left-[12px] w-[140px] h-[140px] bg-red-500 border-4 border-yellow-400 shadow-[0_0_20px_rgba(255,255,0,0.8)] rounded-lg z-[2147483647] pointer-events-none flex flex-col items-center justify-center text-white text-xs font-mono p-2"
      >
        <div className="font-bold mb-1">DEBUG</div>
        <div className="text-[10px] text-center space-y-0.5">
          <div>ID: {threadId.slice(0, 8)}</div>
          <div>Exp: {isExpanded ? 'Y' : 'N'}</div>
          <div>Msg: {messages.length}</div>
          <div>Unr: {unreadCount}</div>
          <div>Con: {isConnected ? 'Y' : 'N'}</div>
          <div>Err: {error ? 'Y' : 'N'}</div>
        </div>
      </div>

      <div className={className}>
        {!isExpanded && (
          <ChatWidgetCollapsed
            unreadCount={unreadCount}
            onClick={handleOpen}
          />
        )}
        
        <AnimatePresence>
          {isExpanded && (
            <ChatWidgetExpanded
              messages={messages}
              unreadCount={unreadCount}
              isSending={isSending}
              isConnected={isConnected}
              onClose={handleClose}
              onSendMessage={handleSendMessage}
              onActionClick={handleActionClick}
            />
          )}
        </AnimatePresence>
      </div>
    </FloatingPortal>
  );
};
