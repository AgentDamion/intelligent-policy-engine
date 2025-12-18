import React, { useState, useEffect, useRef } from 'react';
import webSocketService from '../services/websocket';
import './LiveProofStreamPanel.css';

const LiveProofStreamPanel = ({ isOpen = true, onClose = () => {}, className = '' }) => {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventsContainerRef = useRef(null);

  // Mock audit events for demonstration
  const mockEvents = [
    {
      id: '1',
      type: 'tool_approved',
      title: 'Tool Approved',
      description: 'GYE 1s simplified access toaternmine seria',
      timestamp: new Date(Date.now() - 1000).toISOString(),
      icon: '✅',
      severity: 'success'
    },
    {
      id: '2',
      type: 'conflict_detected',
      title: 'Conflict detected',
      description: 'Adioun distelvnugen post wonnernennnt',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      icon: '⚠️',
      severity: 'warning'
    },
    {
      id: '3',
      type: 'audit_completed',
      title: 'Audit Completed',
      description: 'Frisige guttite for GBT toitdings',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      icon: '📋',
      severity: 'info'
    }
  ];

  useEffect(() => {
    // Initialize with mock events
    setEvents(mockEvents);

    // Connect to WebSocket
    const handleConnected = (connected) => {
      setIsConnected(connected);
    };

    const handleAuditEvent = (eventData) => {
      const newEvent = {
        id: Date.now().toString(),
        type: eventData.type || 'audit_event',
        title: eventData.title || 'Audit Event',
        description: eventData.description || 'New audit event detected',
        timestamp: eventData.timestamp || new Date().toISOString(),
        icon: getEventIcon(eventData.type),
        severity: eventData.severity || 'info'
      };

      setEvents(prevEvents => {
        const updatedEvents = [newEvent, ...prevEvents.slice(0, 9)]; // Keep max 10 events
        return updatedEvents;
      });
    };

    // Subscribe to WebSocket events
    webSocketService.on('connected', handleConnected);
    webSocketService.on('audit_event', handleAuditEvent);
    webSocketService.on('governance_event', handleAuditEvent);

    // Connect if not already connected
    if (!webSocketService.isConnected()) {
      webSocketService.connect();
    }

    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('audit_event', handleAuditEvent);
      webSocketService.off('governance_event', handleAuditEvent);
    };
  }, []);

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = 0;
    }
  }, [events]);

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'tool_approved':
      case 'policy_decision':
        return '✅';
      case 'conflict_detected':
      case 'compliance_alert':
        return '⚠️';
      case 'audit_completed':
      case 'risk_assessment':
        return '📋';
      case 'agent_action':
        return '🤖';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now - eventTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return eventTime.toLocaleDateString();
    }
  };

  const handleViewAll = () => {
    // Navigate to full audit log view
    console.log('Navigate to full audit log');
  };

  return (
    <div
      className={`
        live-proof-stream-panel fixed right-0 top-0 h-full w-80 bg-white rounded-l-2xl shadow-xl border-l border-gray-200
        live-proof-panel-transition z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="live-proof-header p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="live-proof-icon w-8 h-8 bg-brand-indigo rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">See Live Proof</h2>
              <p className="text-sm text-gray-500">Real-time audit stream</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`live-proof-status-indicator w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">Live Proof stream ></span>
          </div>
        </div>
      </div>

      {/* Events Container */}
      <div className="live-proof-events-container flex-1 overflow-hidden">
        <div 
          ref={eventsContainerRef}
          className="live-proof-events-list h-full overflow-y-auto p-4 space-y-3"
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="live-proof-event-item bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="live-proof-event-icon w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-lg">{event.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </h3>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="live-proof-footer p-4 border-t border-gray-100">
        <button
          onClick={handleViewAll}
          className="live-proof-view-all-btn btn-primary w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span>View All</span>
          <span className="text-xs">></span>
        </button>
      </div>
    </div>
  );
};

export default LiveProofStreamPanel; 