// File: ui/components/LiveGovernanceStream.jsx

import React, { useState, useRef, useEffect } from 'react';

const LiveGovernanceStream = ({ 
  events = [], 
  height = '400px',
  showMore = false,
  onToggleShowMore = null 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newEvents, setNewEvents] = useState(new Set());
  const streamEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new events arrive
  const scrollToBottom = () => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [events]);

  // Track new events for highlighting
  useEffect(() => {
    if (events.length > 0) {
      const latestEventId = events[events.length - 1]?.id;
      if (latestEventId) {
        setNewEvents(prev => new Set([...prev, latestEventId]));
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setNewEvents(prev => {
            const updated = new Set(prev);
            updated.delete(latestEventId);
            return updated;
          });
        }, 3000);
      }
    }
  }, [events]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'approved':
        return '✅';
      case 'conflict':
        return '⚠️';
      case 'audit':
        return '📄';
      case 'analysis':
        return '🧠';
      case 'sync':
        return '🔁';
      case 'rejected':
        return '❌';
      default:
        return '📋';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'approved':
        return 'border-green-200 bg-green-50';
      case 'conflict':
        return 'border-yellow-200 bg-yellow-50';
      case 'audit':
        return 'border-blue-200 bg-blue-50';
      case 'analysis':
        return 'border-purple-200 bg-purple-50';
      case 'sync':
        return 'border-brand-indigo bg-brand-indigo/10';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getEventBadgeColor = (type) => {
    switch (type) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'conflict':
        return 'bg-yellow-100 text-yellow-800';
      case 'audit':
        return 'bg-blue-100 text-blue-800';
      case 'analysis':
        return 'bg-purple-100 text-purple-800';
      case 'sync':
        return 'bg-brand-indigo/10 text-brand-indigo';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onToggleShowMore) {
      onToggleShowMore(!isExpanded);
    }
  };

  const containerHeight = showMore && !isExpanded ? '200px' : height;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-sm font-semibold text-gray-900">Live Governance Stream</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{events.length} events</span>
          {showMore && (
            <button
              onClick={handleToggleExpand}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
      </div>

      {/* Events Container */}
      <div 
        ref={containerRef}
        className="overflow-y-auto"
        style={{ height: containerHeight }}
      >
        <div className="p-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📋</div>
              <p className="text-sm text-gray-500">No governance events yet</p>
              <p className="text-xs text-gray-400 mt-1">Meta-Loop will appear here when active</p>
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id || index}
                className={`
                  border rounded-lg p-3 transition-all duration-300 ease-in-out
                  ${getEventColor(event.type)}
                  ${newEvents.has(event.id) ? 'animate-pulse ring-2 ring-yellow-300 ring-opacity-50' : ''}
                  hover:shadow-md hover:scale-[1.02] transform
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                <div className="flex items-start space-x-3">
                  {/* Event Icon */}
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Meta-Loop Badge */}
                    {event.agent && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventBadgeColor(event.type)}`}>
                          <span className="w-1 h-1 bg-current rounded-full mr-1"></span>
                          by Meta-Loop
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Scroll anchor */}
        <div ref={streamEndRef} />
      </div>

      {/* Footer */}
      {events.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Real-time updates from Meta-Loop</span>
            <span className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGovernanceStream; 