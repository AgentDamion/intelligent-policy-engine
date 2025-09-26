// File: ui/components/AgentPanel.jsx

import React, { useState, useEffect, useRef } from 'react';

export const AgentPanel = ({ 
  isOpen = false, 
  onClose = () => {},
  initialMessage = null,
  context = null,
  currentUser = null
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // AI Agent personalities based on user context
  const agentPersonalities = {
    enterprise: {
      name: 'Compliance Commander',
      avatar: '🛡️',
      color: 'blue',
      greeting: 'I\'m your AI governance specialist. I can help you manage policies, analyze compliance across your agency partners, and ensure regulatory adherence.',
      capabilities: [
        'Create and review AI usage policies',
        'Analyze agency partner compliance',
        'Recommend optimal seat allocations',
        'Generate comprehensive audit reports',
        'Monitor regulatory changes',
        'Draft policy updates'
      ],
      expertise: [
        'FDA compliance requirements',
        'Multi-agency governance',
        'Risk assessment and mitigation',
        'Regulatory change management'
      ]
    },
    agency_seat: {
      name: 'Approval Assistant',
      avatar: '🤝',
      color: 'green',
      greeting: 'I\'m your compliance guide. I can help you understand client requirements, prepare tool submissions, and navigate approval processes efficiently.',
      capabilities: [
        'Explain client compliance requirements',
        'Draft tool submission requests',
        'Check approval status and timelines',
        'Suggest compliance best practices',
        'Analyze rejection feedback',
        'Optimize submission quality'
      ],
      expertise: [
        'Tool submission optimization',
        'Client requirement interpretation',
        'Approval process navigation',
        'Compliance documentation'
      ]
    }
  };

  // Determine current agent based on user context
  useEffect(() => {
    const userType = currentUser?.type || context?.userType || 'enterprise';
    setCurrentAgent(agentPersonalities[userType] || agentPersonalities.enterprise);
  }, [currentUser, context]);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0 && currentAgent) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'agent',
        content: `Hello! ${currentAgent.greeting}`,
        timestamp: new Date(),
        suggestions: [
          'Help me create a policy',
          'Check compliance status', 
          'Explain requirements',
          'Show analytics',
          'What can you do?'
        ]
      };

      setMessages([welcomeMessage]);

      // If there's an initial message, process it
      if (initialMessage) {
        setTimeout(() => {
          handleSendMessage(initialMessage, false);
        }, 1000);
      }
    }
  }, [isOpen, currentAgent, initialMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (message = inputValue, addToMessages = true) => {
    if (!message.trim()) return;

    // Update MetaLoopStatus to show AI is processing
    window.dispatchEvent(new CustomEvent('agentStatusChange', {
      detail: { status: 'processing', agent: currentAgent.name, action: 'Analyzing request' }
    }));

    // Add user message
    if (addToMessages) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate AI processing with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Generate contextual AI response
      const response = await generateAIResponse(message, {
        agent: currentAgent,
        context: context,
        conversationHistory: messages.slice(-5),
        userType: currentUser?.type
      });

      setIsTyping(false);
      
      const agentMessage = {
        id: Date.now(),
        type: 'agent',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions || [],
        suggestions: response.suggestions || [],
        attachments: response.attachments || []
      };

      setMessages(prev => [...prev, agentMessage]);

      // Update MetaLoopStatus back to idle
      window.dispatchEvent(new CustomEvent('agentStatusChange', {
        detail: { status: 'idle', agent: currentAgent.name, action: 'Ready to help' }
      }));

    } catch (error) {
      console.error('Agent chat error:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now(),
        type: 'agent',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);

      // Update MetaLoopStatus to alert
      window.dispatchEvent(new CustomEvent('agentStatusChange', {
        detail: { status: 'alert', agent: currentAgent.name, action: 'Error occurred' }
      }));
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };

  const executeAction = async (action) => {
    // Update MetaLoopStatus to show active execution
    window.dispatchEvent(new CustomEvent('agentStatusChange', {
      detail: { status: 'active', agent: currentAgent.name, action: `Executing ${action.type}` }
    }));

    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add confirmation message
      const confirmationMessage = {
        id: Date.now(),
        type: 'agent',
        content: `✅ ${action.label} completed successfully!`,
        timestamp: new Date(),
        isSuccess: true
      };
      setMessages(prev => [...prev, confirmationMessage]);
      
      // Trigger UI updates if needed
      if (action.triggerEvent) {
        window.dispatchEvent(new CustomEvent(action.triggerEvent, { detail: action.data }));
      }

    } catch (error) {
      console.error('Action execution error:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'agent',
        content: `❌ Failed to ${action.label.toLowerCase()}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    // Update MetaLoopStatus back to idle
    window.dispatchEvent(new CustomEvent('agentStatusChange', {
      detail: { status: 'idle', agent: currentAgent.name, action: 'Ready to help' }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop (only visible when not minimized) */}
      {!isMinimized && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-25 pointer-events-auto"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div className={`
        relative bg-white shadow-2xl border-l border-gray-200 flex flex-col pointer-events-auto transition-all duration-300
        ${isMinimized 
          ? 'w-80 h-16 rounded-tl-lg' 
          : 'w-96 max-h-screen'
        }
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b border-gray-200 transition-all duration-300
          ${currentAgent?.color === 'blue' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gradient-to-r from-green-500 to-teal-600'
          } text-white
        `}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentAgent?.avatar}</div>
            <div>
              <h3 className="font-semibold">{currentAgent?.name}</h3>
              <p className="text-xs opacity-90">
                {currentUser?.type === 'enterprise' ? 'Enterprise AI Assistant' : 'Agency AI Assistant'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-gray-200 p-1 transition-colors"
            >
              {isMinimized ? '⤢' : '⤡'}
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-1 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages (hidden when minimized) */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                      ${message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : currentAgent?.color === 'blue'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }
                    `}>
                      {message.type === 'user' ? '👤' : '🤖'}
                    </div>

                    {/* Message Content */}
                    <div className={`
                      px-4 py-3 rounded-lg shadow-sm
                      ${message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : message.isSuccess
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-white text-gray-800 border border-gray-200'
                      }
                    `}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Agent Actions */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => executeAction(action)}
                              className={`
                                flex items-center gap-2 w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors
                                ${currentAgent?.color === 'blue'
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }
                              `}
                            >
                              ⚡ {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded text-xs hover:bg-gray-200 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded border text-xs"
                            >
                              📎 <span>{attachment.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs mt-2 opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${currentAgent?.color === 'blue'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                      }
                    `}>
                      🤖
                    </div>
                    <div className="bg-white text-gray-800 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={`Ask ${currentAgent?.name} anything...`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2
                    ${currentAgent?.color === 'blue'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                    }
                  `}
                >
                  📤
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleSuggestionClick('Show my capabilities')}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
                >
                  What can you do?
                </button>
                <button
                  onClick={() => handleSuggestionClick('Show current status')}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
                >
                  Current status
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// AI Response Generator (simulated intelligent responses)
const generateAIResponse = async (message, context) => {
  const { agent, userType, conversationHistory } = context;
  const lowerMessage = message.toLowerCase();

  // Capability inquiry
  if (lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities') || lowerMessage.includes('help')) {
    return {
      content: `I'm specialized in AI governance for ${userType === 'enterprise' ? 'enterprise compliance management' : 'agency partnership coordination'}. Here's what I can help you with:

${agent.capabilities.map(cap => `• ${cap}`).join('\n')}

I also have deep expertise in:
${agent.expertise.map(exp => `• ${exp}`).join('\n')}

What would you like to start with?`,
      suggestions: ['Create a policy', 'Check compliance', 'Analyze trends', 'Generate report']
    };
  }

  // Policy creation
  if (lowerMessage.includes('policy') || lowerMessage.includes('create policy')) {
    return {
      content: "I can help you create a comprehensive AI usage policy. What type of AI usage do you need to govern?",
      suggestions: ['Social media content', 'Marketing materials', 'Image generation', 'Content writing', 'Custom use case'],
      actions: [
        {
          type: 'create_policy',
          label: 'Start Policy Builder',
          triggerEvent: 'openPolicyBuilder',
          data: { assisted: true }
        }
      ]
    };
  }

  // Compliance checking
  if (lowerMessage.includes('compliance') || lowerMessage.includes('status')) {
    return {
      content: `Based on current data analysis:

**Compliance Overview:**
• Overall compliance score: 94%
• Active policy violations: 2 (low priority)
• Agency partners in compliance: 8/10
• Recent improvement: +3% this month

**Areas needing attention:**
• Novartis content review backlog
• Updated FDA guidelines implementation

Would you like me to generate a detailed compliance report?`,
      actions: [
        {
          type: 'generate_report',
          label: 'Generate Detailed Report',
          triggerEvent: 'generateComplianceReport'
        },
        {
          type: 'view_violations',
          label: 'View Policy Violations',
          triggerEvent: 'openViolationsPanel'
        }
      ],
      suggestions: ['Fix violations', 'Analyze trends', 'Compare partners', 'Update policies']
    };
  }

  // Seat management for enterprise users
  if (userType === 'enterprise' && (lowerMessage.includes('seat') || lowerMessage.includes('agency') || lowerMessage.includes('partner'))) {
    return {
      content: `I can help optimize your agency seat management:

**Current Allocation:**
• Active seats: 24/30 available
• Agency partners: 8 active
• Utilization rate: 80%

**Recommendations:**
• Consider upgrading to accommodate McCann Health expansion
• Reallocate 2 unused seats from Ogilvy to new partner
• Review seat permissions for better compliance alignment`,
      actions: [
        {
          type: 'optimize_seats',
          label: 'Optimize Seat Allocation',
          triggerEvent: 'openSeatOptimizer'
        },
        {
          type: 'invite_agency',
          label: 'Invite New Agency',
          triggerEvent: 'openAgencyInvite'
        }
      ]
    };
  }

  // Tool submission for agency users
  if (userType === 'agency_seat' && (lowerMessage.includes('submit') || lowerMessage.includes('tool') || lowerMessage.includes('approval'))) {
    return {
      content: `I can help you prepare and submit AI tool requests:

**Quick Submission Tips:**
• Include detailed use case description
• Provide data handling documentation
• Specify compliance safeguards
• Add sample outputs for review

**Current Client Requirements:**
• Medical claim restrictions apply
• Brand guideline compliance required
• Human review mandatory for public content

Ready to submit a tool for approval?`,
      actions: [
        {
          type: 'submit_tool',
          label: 'Start Tool Submission',
          triggerEvent: 'openToolSubmission'
        },
        {
          type: 'check_requirements',
          label: 'Review Client Requirements',
          triggerEvent: 'openRequirements'
        }
      ]
    };
  }

  // Default response
  return {
    content: `I understand you're asking about "${message}". As your ${agent.name}, I can help you with governance, compliance, and policy management. Could you provide more specific details about what you'd like to accomplish?`,
    suggestions: ['Create policy', 'Check compliance', 'Analyze data', 'Get recommendations']
  };
};

export default AgentPanel; 