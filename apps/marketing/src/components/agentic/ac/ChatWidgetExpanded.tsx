import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatSuggestionsPanel } from './ChatSuggestionsPanel';
import { ChatInput } from './ChatInput';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import type { ChatMessage, SuggestedAction } from '@/types/chat';

interface ChatWidgetExpandedProps {
  messages: ChatMessage[];
  unreadCount: number;
  isSending: boolean;
  isConnected: boolean;
  onClose: () => void;
  onSendMessage: (content: string) => Promise<void>;
  onActionClick: (action: SuggestedAction) => void;
}

export const ChatWidgetExpanded = ({
  messages,
  unreadCount,
  isSending,
  isConnected,
  onClose,
  onSendMessage,
  onActionClick
}: ChatWidgetExpandedProps) => {
  const [inputValue, setInputValue] = useState('');
  const [drawerHeight, setDrawerHeight] = useState('600px');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mobile keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        
        if (viewportHeight < windowHeight) {
          // Keyboard is open
          setDrawerHeight(`${viewportHeight}px`);
        } else {
          // Keyboard is closed
          setDrawerHeight('600px');
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    }
  }, []);

  // Extract suggested actions from latest assistant message
  const suggestedActions: SuggestedAction[] = messages
    .filter(m => m.role === 'assistant' && m.actions)
    .flatMap(m => m.actions || []);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const message = inputValue;
    setInputValue('');
    
    try {
      await onSendMessage(message);
    } catch (error) {
      // Error handling in parent component
      console.error('Failed to send message:', error);
    }
  };

  const showDisconnected = !isConnected;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{ 
        height: drawerHeight,
        transformOrigin: 'bottom right'
      }}
      className="fixed bottom-s4 right-s4 w-[384px] bg-surface-0 border border-ink-100 rounded-t-r3 shadow-2xl z-50 flex flex-col max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:border-0"
      role="dialog"
      aria-label="Chat assistant"
    >
      {/* Header */}
      <div className="h-[64px] px-s4 py-s3 border-b border-ink-100 bg-surface-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-s2">
          <h2 className="text-[14px] font-semibold text-ink-900">Assistant</h2>
          {showDisconnected && (
            <span className="font-mono text-[11px] text-destructive">
              Reconnecting...
            </span>
          )}
          {!showDisconnected && (
            <span className="font-mono text-[11px] text-ink-500 flex items-center gap-s1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Connected
            </span>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="p-s2 text-ink-500 hover:text-ink-900 hover:bg-surface-100 rounded-r1 focus:shadow-focus-ring outline-none"
          aria-label="Close chat"
        >
          <X size={16} />
        </button>
      </div>

      {/* Suggestions Panel */}
      <ChatSuggestionsPanel 
        actions={suggestedActions}
        onActionClick={onActionClick}
      />

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-s4 space-y-s3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(0 0% 79%) transparent'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-[14px] text-ink-700 mb-s2">
                No messages yet
              </p>
              <p className="text-[12px] text-ink-500">
                Start a conversation with the assistant
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatMessageBubble 
                  message={message} 
                  isLatest={index === messages.length - 1}
                />
              </motion.div>
            ))}
            
            {isSending && <ChatTypingIndicator />}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="h-[72px] p-s3 border-t border-ink-100 bg-surface-50 shrink-0">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isSending || showDisconnected}
        />
      </div>
    </motion.div>
  );
};
