import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Shield, ShieldAlert, ShieldX, Eye, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVERAAgent, type VERAResponse } from '@/hooks/useVERAAgent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Security metadata for assistant messages
  securityStatus?: 'passed' | 'flagged' | 'blocked';
  traceId?: string | null;
  processingTimeMs?: number;
  stepsLogged?: number;
}

interface VERAChatWidgetProps {
  onClose: () => void;
  onViewTrace?: (traceId: string) => void;
  className?: string;
  workspaceId?: string;
  enterpriseId?: string;
  initialMessage?: string;
}

// Fallback responses when agent is unavailable
const FALLBACK_RESPONSES = [
  "I can help you understand how AI governance policies work across your partner network. What specific aspect would you like to explore?",
  "That's a great question about compliance. Let me explain how Proof Bundles capture the evidence trail for every AI tool usage event.",
  "Based on your current policy configuration, I'd recommend starting with tool registration before moving to automated enforcement.",
];

export function VERAChatWidget({ 
  onClose, 
  onViewTrace,
  className = '',
  workspaceId,
  enterpriseId,
  initialMessage,
}: VERAChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm VERA, your AI governance assistant. I can help you understand policies, review decisions, and navigate compliance requirements. What would you like to know?",
      timestamp: new Date(),
      securityStatus: 'passed',
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [threadId] = useState(`vera-thread-${Date.now()}`);
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  // Use the VERA agent hook
  const { sendMessage, isLoading, error } = useVERAAgent();

  // Handle initial message from parent (e.g., demo scenarios)
  useEffect(() => {
    if (initialMessage && !initialMessageSent && !isLoading) {
      setInitialMessageSent(true);
      handleSendWithContent(initialMessage);
    }
  }, [initialMessage, initialMessageSent, isLoading]);

  const handleSendWithContent = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendMessage(content, {
        workspaceId,
        enterpriseId,
        threadId,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        securityStatus: response.securityStatus,
        traceId: response.traceId,
        processingTimeMs: response.processingTimeMs,
        stepsLogged: response.stepsLogged,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('VERA agent error:', err);
      
      const fallbackIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: FALLBACK_RESPONSES[fallbackIndex] + "\n\n_(Note: Running in demo mode - live agent unavailable)_",
        timestamp: new Date(),
        securityStatus: 'passed',
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const content = input;
    setInput('');
    await handleSendWithContent(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SecurityBadge = ({ status }: { status: 'passed' | 'flagged' | 'blocked' }) => {
    switch (status) {
      case 'passed':
        return (
          <div className="flex items-center gap-1 text-emerald-600" title="Security check passed">
            <Shield className="w-3 h-3" />
            <span className="text-[10px]">Verified</span>
          </div>
        );
      case 'flagged':
        return (
          <div className="flex items-center gap-1 text-amber-600" title="Security warning">
            <ShieldAlert className="w-3 h-3" />
            <span className="text-[10px]">Flagged</span>
          </div>
        );
      case 'blocked':
        return (
          <div className="flex items-center gap-1 text-red-600" title="Security blocked">
            <ShieldX className="w-3 h-3" />
            <span className="text-[10px]">Blocked</span>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md flex items-center justify-center">
            <span className="text-xl font-bold text-gray-700">V</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">VERA</h3>
            <p className="text-xs text-muted-foreground">AI Governance Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.securityStatus === 'blocked'
                    ? 'bg-red-50 border border-red-200 text-foreground'
                    : message.securityStatus === 'flagged'
                      ? 'bg-amber-50 border border-amber-200 text-foreground'
                      : 'bg-muted text-foreground'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">VERA</span>
                  </div>
                  {message.securityStatus && (
                    <SecurityBadge status={message.securityStatus} />
                  )}
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              
              {/* Message footer with metadata */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
                <p className="text-[10px] opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-3">
                    {/* Processing time */}
                    {message.processingTimeMs && (
                      <div className="flex items-center gap-1 text-[10px] opacity-60" title="Processing time">
                        <Clock className="w-2.5 h-2.5" />
                        {message.processingTimeMs}ms
                      </div>
                    )}
                    
                    {/* Steps logged */}
                    {message.stepsLogged !== undefined && message.stepsLogged > 0 && (
                      <div className="flex items-center gap-1 text-[10px] opacity-60" title="Reasoning steps">
                        <Zap className="w-2.5 h-2.5" />
                        {message.stepsLogged} steps
                      </div>
                    )}
                    
                    {/* View Trace button */}
                    {message.traceId && onViewTrace && (
                      <button
                        onClick={() => onViewTrace(message.traceId!)}
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                        title="View full trace"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        Trace
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground ml-2">VERA is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-xs text-red-600">
                {error.message}
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask VERA about governance, policies, or compliance..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VERAChatWidget;
