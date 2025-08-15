// File: ui/src/components/MetaLoopStatusRing.jsx

import React, { useState, useEffect, useRef } from 'react';
import webSocketService from '../services/websocket';
import MetaLoopIcons from './MetaLoopIcons';
import './MetaLoopStatusRing.css';

const MetaLoopStatusRing = ({ 
  size = 'medium',
  showTooltip = true,
  className = '',
  onStatusChange = () => {},
  useSvgIcons = true
}) => {
  const [status, setStatus] = useState('idle');
  const [isConnected, setIsConnected] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Status configurations with exact colors and animations
  const statusConfig = {
    idle: {
      color: '#6B7280', // Gray
      backgroundColor: 'transparent',
      borderColor: '#6B7280',
      borderWidth: 2,
      icon: null,
      animation: 'none',
      tooltip: 'Idle - Monitoring system',
      description: 'System is idle and monitoring'
    },
    thinking: {
      color: '#3B82F6', // Blue
      backgroundColor: 'transparent',
      borderColor: '#3B82F6',
      borderWidth: 2,
      icon: null,
      animation: 'rotate',
      tooltip: 'Thinking - Processing request',
      description: 'AI is processing your request'
    },
    success: {
      color: '#87788E', // Teal
      backgroundColor: '#87788E',
      borderColor: '#87788E',
      borderWidth: 2,
      icon: '✓',
      animation: 'pulse',
      tooltip: 'Success - Request completed',
      description: 'Request completed successfully'
    },
    alert: {
      color: '#CEA889', // Orange/Sky
      backgroundColor: '#CEA889',
      borderColor: '#CEA889',
      borderWidth: 2,
      icon: '!',
      animation: 'flash',
      tooltip: 'Alert - Attention required',
      description: 'Human attention required'
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { diameter: 40, strokeWidth: 2, fontSize: '12px' },
    medium: { diameter: 60, strokeWidth: 3, fontSize: '14px' },
    large: { diameter: 80, strokeWidth: 4, fontSize: '16px' }
  };

  const config = sizeConfig[size];
  const currentStatus = statusConfig[status];

  // Connect to WebSocket for real-time status updates
  useEffect(() => {
    console.log('🔌 Connecting MetaLoopStatusRing to WebSocket...');
    
    webSocketService.connect().then(() => {
      console.log('✅ MetaLoopStatusRing WebSocket connected');
      setIsConnected(true);
      
      // Subscribe to agent updates
      webSocketService.subscribeToAgents();
      
      // Listen for agent status updates
      webSocketService.on('agent_status_update', (data) => {
        console.log('📨 Received agent status update:', data);
        
        // Determine overall status based on agent states
        const agents = Object.values(data);
        const activeAgents = agents.filter(agent => agent.status === 'active').length;
        const processingAgents = agents.filter(agent => agent.status === 'processing').length;
        const alertAgents = agents.filter(agent => agent.status === 'alert').length;
        const successAgents = agents.filter(agent => agent.status === 'success').length;
        
        let overallStatus = 'idle';
        if (alertAgents > 0) overallStatus = 'alert';
        else if (successAgents > 0) overallStatus = 'success';
        else if (processingAgents > 0) overallStatus = 'thinking';
        else if (activeAgents > 0) overallStatus = 'thinking';
        
        setStatus(overallStatus);
        onStatusChange(overallStatus);
      });
      
      // Listen for connection status
      webSocketService.on('connected', (connected) => {
        setIsConnected(connected);
        if (!connected) {
          setStatus('idle');
        }
      });
      
    }).catch(error => {
      console.error('❌ MetaLoopStatusRing WebSocket connection failed:', error);
      setIsConnected(false);
      setStatus('idle');
    });
    
    return () => {
      // Cleanup listeners when component unmounts
      webSocketService.off('agent_status_update');
      webSocketService.off('connected');
    };
  }, [onStatusChange]);

  // Animate the status ring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = config.diameter / 2;
    const centerY = config.diameter / 2;
    const radius = (config.diameter - config.strokeWidth * 2) / 2;

    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Clear canvas
      ctx.clearRect(0, 0, config.diameter, config.diameter);

      // Draw base ring
      ctx.strokeStyle = currentStatus.borderColor;
      ctx.lineWidth = currentStatus.borderWidth;
      ctx.fillStyle = currentStatus.backgroundColor;
      
      // Draw different ring styles based on status
      if (status === 'idle') {
        drawIdleRing(ctx, centerX, centerY, radius);
      } else if (status === 'thinking') {
        drawThinkingRing(ctx, centerX, centerY, radius, elapsed);
      } else if (status === 'success') {
        drawSuccessRing(ctx, centerX, centerY, radius, elapsed);
      } else if (status === 'alert') {
        drawAlertRing(ctx, centerX, centerY, radius, elapsed);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, config, currentStatus]);

  // Animation functions for different states
  const drawIdleRing = (ctx, centerX, centerY, radius) => {
    // Simple gray circle outline
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawThinkingRing = (ctx, centerX, centerY, radius, elapsed) => {
    // Blue dotted circle with rotation animation
    const rotationSpeed = 0.002; // Rotation speed
    const rotation = elapsed * rotationSpeed;
    const dotCount = 8;
    const dotSize = 3;
    
    ctx.strokeStyle = currentStatus.color;
    ctx.lineWidth = currentStatus.borderWidth;
    
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * 2 * Math.PI + rotation;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawSuccessRing = (ctx, centerX, centerY, radius, elapsed) => {
    // Teal circle with checkmark
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw checkmark
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.3, centerY);
    ctx.lineTo(centerX - radius * 0.1, centerY + radius * 0.2);
    ctx.lineTo(centerX + radius * 0.3, centerY - radius * 0.2);
    ctx.stroke();
  };

  const drawAlertRing = (ctx, centerX, centerY, radius, elapsed) => {
    // Orange circle with exclamation mark and flash animation
    const flashIntensity = Math.sin(elapsed * 0.01) * 0.3 + 0.7;
    
    ctx.globalAlpha = flashIntensity;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw exclamation mark
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius * 0.3);
    ctx.lineTo(centerX, centerY + radius * 0.1);
    ctx.stroke();
    
    // Draw dot
    ctx.beginPath();
    ctx.arc(centerX, centerY + radius * 0.25, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalAlpha = 1;
  };

  return (
    <div className={`metaloop-status-ring group ${status} ${className}`}>
      {useSvgIcons ? (
        // SVG Icon Version
        <div className="relative">
          {React.createElement(MetaLoopIcons[status], {
            size: config.diameter,
            className: 'drop-shadow-sm'
          })}
          
          {/* Connection Status Indicator */}
          <div className="absolute -bottom-1 -right-1">
            <div 
              className={`connection-indicator w-3 h-3 rounded-full border-2 border-white ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>
        </div>
      ) : (
        // Canvas Version (Original)
        <>
          <canvas
            ref={canvasRef}
            width={config.diameter}
            height={config.diameter}
            className="drop-shadow-sm"
          />
          
          {/* Connection Status Indicator */}
          <div className="absolute -bottom-1 -right-1">
            <div 
              className={`connection-indicator w-3 h-3 rounded-full border-2 border-white ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>
        </>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg pointer-events-none whitespace-nowrap z-50">
          <div className="font-medium">{currentStatus.tooltip}</div>
          <div className="text-gray-300 mt-1">{currentStatus.description}</div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default MetaLoopStatusRing; 