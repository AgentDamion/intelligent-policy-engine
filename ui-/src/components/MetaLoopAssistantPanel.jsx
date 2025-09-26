// File: ui/src/components/MetaLoopAssistantPanel.jsx

import React, { useState, useEffect } from 'react';
import './MetaLoopAssistantPanel.css';

const MetaLoopAssistantPanel = ({ isOpen, onClose, className = '' }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your MetaLoop assistant. I can help you with compliance workflows, policy management, and real-time monitoring. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString(),
      status: 'success'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const connectToWebSocket = async () => {
      try {
        // Import WebSocket service dynamically
        const webSocketService = await import('../services/websocket');
        const ws = webSocketService.default;
        
        await ws.connect();
        setIsConnected(true);
        
        // Listen for MetaLoop AI updates
        ws.on('metaloop_response', (data) => {
          console.log('📨 MetaLoop AI Response:', data);
          handleMetaLoopResponse(data);
        });
        
        ws.on('connected', (connected) => {
          setIsConnected(connected);
        });
        
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };
    
    connectToWebSocket();
  }, []);

  const handleMetaLoopResponse = (data) => {
    const assistantMessage = {
      id: Date.now(),
      type: 'assistant',
      content: data.response,
      timestamp: new Date().toLocaleTimeString(),
      status: data.success ? 'success' : 'error',
      actions: data.actions || [],
      suggestions: data.suggestions || [],
      insights: data.insights || []
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send to real MetaLoop AI service
      const response = await fetch('/api/metaloop/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          message: message,
          context: {
            userId: localStorage.getItem('userId') || 'demo-user',
            organizationId: localStorage.getItem('organizationId') || 'demo-org',
            userRole: localStorage.getItem('userRole') || 'user',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const assistantMessage = {
          id: Date.now(),
          type: 'assistant',
          content: result.response,
          timestamp: new Date().toLocaleTimeString(),
          status: 'success',
          actions: result.actions || [],
          suggestions: result.suggestions || [],
          insights: result.insights || [],
          learning: result.learning || {}
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Show learning insights if available
        if (result.learning && result.learning.pattern_recognized) {
          setTimeout(() => {
            const learningMessage = {
              id: Date.now() + 1,
              type: 'assistant',
              content: `🎉 I just learned from this interaction! I'm now ${Math.round(result.learning.confidence_improvement * 100)}% better at understanding your needs.`,
              timestamp: new Date().toLocaleTimeString(),
              status: 'learning'
            };
            setMessages(prev => [...prev, learningMessage]);
          }, 1000);
        }
        
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ MetaLoop AI Error:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'assistant',
        content: 'I apologize, but I encountered an issue processing your request. Please try again or contact support.',
        timestamp: new Date().toLocaleTimeString(),
        status: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Main Assistant Panel */}
      <div 
        className={`metaloop-assistant-panel ${isOpen ? 'open' : 'closed'} ${className} hidden md:block`}
        style={{
          position: 'fixed',
          left: 0,
          top: '64px',
          height: 'calc(100vh - 64px)',
          width: '320px',
          zIndex: 30,
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '0 16px 16px 0',
          transition: 'transform 0.3s ease-in-out',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          padding: '24px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">ML</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">MetaLoop Assistant</h3>
              <p className="text-sm text-slate-500">
                {isConnected ? 'AI co-pilot connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close assistant"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : message.status === 'learning'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-slate-700'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                
                {/* Show actions if available */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.actions.map((action, index) => (
                      <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        ⚡ {action.message}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show suggestions if available */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-slate-600">💡 Suggestions:</p>
                    {message.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-xs text-slate-600">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-slate-700 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-slate-500">MetaLoop thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Ask me anything..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || !isConnected || isTyping}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {/* Connection Status */}
          {!isConnected && (
            <div className="mt-2 text-xs text-orange-600 flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
              Connecting to MetaLoop AI...
            </div>
          )}
        </div>
      </div>

      {/* Assistant Toggle Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => onClose()} // Toggle to open
          className="fixed left-2 bottom-2 z-40 w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
          title="Need help?"
        >
          <span className="text-white text-lg font-bold">ML</span>
          <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400 animate-pulse'
          }`}></div>
        </button>
      )}
    </>
  );
};

export default MetaLoopAssistantPanel; 