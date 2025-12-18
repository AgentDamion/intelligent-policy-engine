// File: ui/components/MetaLoopStatus.jsx

import React, { useState, useEffect, useRef } from 'react';
import webSocketService from '../services/websocket';

export const MetaLoopStatus = ({ 
  position = 'top-right', 
  size = 'medium',
  showDetails = false,
  onStatusChange = () => {},
  className = ''
}) => {
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentActivity, setAgentActivity] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // AI Agent States
  const agentStates = {
    idle: {
      color: '#10b981', // green
      pulseSpeed: 2000,
      description: 'Monitoring compliance',
      icon: '🟢'
    },
    processing: {
      color: '#f59e0b', // amber  
      pulseSpeed: 1200,
      description: 'Analyzing policy requests',
      icon: '🟡'
    },
    active: {
      color: '#3b82f6', // blue
      pulseSpeed: 800,
      description: 'Making governance decisions', 
      icon: '🔵'
    },
    alert: {
      color: '#ef4444', // red
      pulseSpeed: 600,
      description: 'Requiring human attention',
      icon: '🔴'
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { diameter: 60, strokeWidth: 3, fontSize: '12px' },
    medium: { diameter: 80, strokeWidth: 4, fontSize: '14px' },
    large: { diameter: 100, strokeWidth: 5, fontSize: '16px' }
  };

  const config = sizeConfig[size];

  // Position configurations
  const positionStyles = {
    'top-right': 'fixed top-6 right-6 z-50',
    'top-left': 'fixed top-6 left-6 z-50', 
    'bottom-right': 'fixed bottom-6 right-6 z-50',
    'bottom-left': 'fixed bottom-6 left-6 z-50',
    'inline': 'relative'
  };

  // Connect to WebSocket for real agent status updates
  useEffect(() => {
    console.log('🔌 Connecting MetaLoopStatus to WebSocket...')
    
    webSocketService.connect().then(() => {
      console.log('✅ MetaLoopStatus WebSocket connected')
      
      // Subscribe to agent updates
      webSocketService.subscribeToAgents()
      
      // Listen for agent status updates
      webSocketService.on('agent_status_update', (data) => {
        console.log('📨 Received agent status update:', data)
        
        // Determine overall status based on agent states
        const agents = Object.values(data)
        const activeAgents = agents.filter(agent => agent.status === 'active').length
        const processingAgents = agents.filter(agent => agent.status === 'processing').length
        const alertAgents = agents.filter(agent => agent.status === 'alert').length
        
        let overallStatus = 'idle'
        if (alertAgents > 0) overallStatus = 'alert'
        else if (processingAgents > 0) overallStatus = 'processing'
        else if (activeAgents > 0) overallStatus = 'active'
        
        setAgentStatus(overallStatus)
        
        // Update agent activity
        const newActivity = {
          id: Date.now(),
          timestamp: new Date(),
          agent: 'MetaLoop System',
          action: `${activeAgents} active, ${processingAgents} processing agents`,
          status: overallStatus
        }
        
        setAgentActivity(prev => [...prev.slice(-4), newActivity])
        onStatusChange(overallStatus)
      })
      
      // Listen for connection status
      webSocketService.on('connected', (isConnected) => {
        if (!isConnected) {
          setAgentStatus('idle')
        }
      })
      
      // Listen for connection status
      webSocketService.on('connected', (isConnected) => {
        if (!isConnected) {
          setAgentStatus('idle')
        }
      })
      
    }).catch(error => {
      console.error('❌ MetaLoopStatus WebSocket connection failed:', error)
      setAgentStatus('idle')
    })
    
    return () => {
      // Cleanup listeners when component unmounts
      webSocketService.off('agent_status_update')
      webSocketService.off('connected')
    }
  }, [onStatusChange]);

  // Animate the polygonal ring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = config.diameter / 2;
    const centerY = config.diameter / 2;
    const radius = (config.diameter - config.strokeWidth * 2) / 2;

    let startTime = Date.now();
    const currentState = agentStates[agentStatus];

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % currentState.pulseSpeed) / currentState.pulseSpeed;

      // Clear canvas
      ctx.clearRect(0, 0, config.diameter, config.diameter);

      // Draw base ring
      ctx.strokeStyle = currentState.color + '40'; // 25% opacity
      ctx.lineWidth = config.strokeWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw animated segments based on status
      if (agentStatus === 'idle') {
        drawIdleAnimation(ctx, centerX, centerY, radius, progress);
      } else if (agentStatus === 'processing') {
        drawProcessingAnimation(ctx, centerX, centerY, radius, progress);
      } else if (agentStatus === 'active') {
        drawActiveAnimation(ctx, centerX, centerY, radius, progress);
      } else if (agentStatus === 'alert') {
        drawAlertAnimation(ctx, centerX, centerY, radius, progress);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [agentStatus, config]);

  // Animation functions for different states
  const drawIdleAnimation = (ctx, centerX, centerY, radius, progress) => {
    // Gentle pulse
    const pulseRadius = radius + Math.sin(progress * Math.PI * 2) * 3;
    const opacity = 0.6 + Math.sin(progress * Math.PI * 2) * 0.3;
    
    ctx.strokeStyle = agentStates.idle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = config.strokeWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawProcessingAnimation = (ctx, centerX, centerY, radius, progress) => {
    // Rotating segments
    const segments = 8;
    const segmentAngle = (2 * Math.PI) / segments;
    const rotationOffset = progress * 2 * Math.PI;

    ctx.strokeStyle = agentStates.processing.color;
    ctx.lineWidth = config.strokeWidth;
    
    for (let i = 0; i < segments; i++) {
      const opacity = Math.sin(progress * Math.PI * 2 + i * 0.5) * 0.5 + 0.5;
      ctx.globalAlpha = opacity;
      
      const startAngle = i * segmentAngle + rotationOffset;
      const endAngle = startAngle + segmentAngle * 0.6;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const drawActiveAnimation = (ctx, centerX, centerY, radius, progress) => {
    // Polygonal morphing
    const sides = 6;
    const morphFactor = Math.sin(progress * Math.PI * 2) * 0.2;
    
    ctx.strokeStyle = agentStates.active.color;
    ctx.lineWidth = config.strokeWidth;
    ctx.beginPath();
    
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
      const currentRadius = radius + Math.sin(angle * 3 + progress * Math.PI * 4) * morphFactor * radius;
      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawAlertAnimation = (ctx, centerX, centerY, radius, progress) => {
    // Urgent pulsing with flashing
    const pulseIntensity = Math.sin(progress * Math.PI * 4); // Faster pulse
    const flashOpacity = pulseIntensity > 0.5 ? 1 : 0.4;
    
    ctx.strokeStyle = agentStates.alert.color;
    ctx.globalAlpha = flashOpacity;
    ctx.lineWidth = config.strokeWidth + Math.abs(pulseIntensity) * 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner urgency ring
    ctx.globalAlpha = flashOpacity * 0.6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  };

  return (
    <div className={`${positionStyles[position]} ${className}`}>
      <div 
        className={`
          relative cursor-pointer transition-all duration-300 
          ${isExpanded ? 'scale-110' : 'scale-100'}
          hover:scale-105
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Main Status Ring */}
        <canvas
          ref={canvasRef}
          width={config.diameter}
          height={config.diameter}
          className="drop-shadow-lg"
        />
        
        {/* Center Status Indicator */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: config.fontSize }}
        >
          <div className="text-center">
            <div className="font-semibold text-gray-700">
              {agentStates[agentStatus].icon}
            </div>
            <div 
              className="text-xs font-medium mt-1"
              style={{ color: agentStates[agentStatus].color }}
            >
              AI
            </div>
          </div>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">AI Agent Status</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Current Status */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: agentStates[agentStatus].color }}
                />
                <span className="font-medium text-gray-900 capitalize">
                  {agentStatus}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {agentStates[agentStatus].description}
              </p>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm">Recent Activity</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {agentActivity.length === 0 ? (
                  <p className="text-xs text-gray-500">No recent activity</p>
                ) : (
                  agentActivity.slice(-4).reverse().map(activity => (
                    <div key={activity.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {activity.agent}
                        </span>
                        <span className="text-gray-500">
                          {activity.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{activity.action}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Open agent panel
                    window.dispatchEvent(new CustomEvent('openAgentPanel'));
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"
                >
                  Chat with AI
                </button>
                <button
                  onClick={() => {
                    // Open governance stream
                    window.dispatchEvent(new CustomEvent('openGovernanceStream'));
                  }}
                  className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded text-xs font-medium hover:bg-gray-100"
                >
                  View Activity
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaLoopStatus; 