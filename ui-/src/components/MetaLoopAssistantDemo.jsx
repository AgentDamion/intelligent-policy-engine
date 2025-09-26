// File: ui/src/components/MetaLoopAssistantDemo.jsx

import React, { useState, useEffect } from 'react';
import MetaLoopAssistantPanel from './MetaLoopAssistantPanel';

const MetaLoopAssistantDemo = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [demoMode, setDemoMode] = useState('default');
  const [simulatedEvents, setSimulatedEvents] = useState([]);

  // Simulate live proof stream events
  useEffect(() => {
    const eventTypes = [
      { title: 'Tool Approved - GYE 1s simplified access toaternmine seria', type: 'audit_event' },
      { title: 'Conflict detected - 0m - Adioun distelvnugen post wonnernennnt', type: 'audit_event' },
      { title: 'Audit Completed - 30m - Frisige guttite for GBT toitdings', type: 'audit_event' },
      { title: 'FDA Social Media Policy Updated', type: 'governance_event' },
      { title: 'Compliance Check Completed', type: 'governance_event' }
    ];

    const simulateEvent = () => {
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const newEvent = {
        id: Date.now(),
        ...randomEvent,
        timestamp: new Date()
      };
      
      setSimulatedEvents(prev => [newEvent, ...prev.slice(0, 4)]);
    };

    // Simulate events every 10-15 seconds
    const interval = setInterval(simulateEvent, Math.random() * 5000 + 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleDemoModeChange = (mode) => {
    setDemoMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            MetaLoop Assistant Panel Demo
          </h1>
          <p className="text-gray-600">
            Enhanced conversation with demo data, role selection, and live proof stream integration
          </p>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Panel Controls
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={handleTogglePanel}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isPanelOpen
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isPanelOpen ? 'Hide Panel' : 'Show Panel'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demo Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDemoModeChange('default')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'default'
                      ? 'bg-brand-indigo text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => handleDemoModeChange('mobile')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'mobile'
                      ? 'bg-brand-indigo text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Demo Features */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Demo Features</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-brand-indigo/10 rounded-lg border border-brand-indigo/30">
                  <h3 className="font-medium text-brand-indigo mb-2">💬 Demo Conversation</h3>
                  <ul className="text-brand-indigo text-sm space-y-1">
                    <li>• Initial greeting from MetaLoop</li>
                    <li>• User role selection (Pharma Compliance)</li>
                    <li>• Personalized guidance and recommendations</li>
                    <li>• Realistic timestamps and conversation flow</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">🔗 Live Proof Stream Integration</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Real-time audit event notifications</li>
                    <li>• Governance event detection</li>
                    <li>• Event message styling with blue highlights</li>
                    <li>• Automatic event simulation every 10-15 seconds</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-900 mb-2">🤖 Interactive Features</h3>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>• Message input with send functionality</li>
                    <li>• Typing indicators and animations</li>
                    <li>• WebSocket connection status</li>
                    <li>• Demo response simulation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">💭 Conversation Flow</h2>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-brand-indigo flex items-center justify-center text-white text-sm font-bold">
                    M
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Initial greeting and role inquiry</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">User selects "Pharma Compliance" role</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-brand-indigo flex items-center justify-center text-white text-sm font-bold">
                    M
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Personalized guidance with specific features</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">User asks about FDA social media compliance</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-brand-indigo flex items-center justify-center text-white text-sm font-bold">
                    M
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Detailed response with live proof stream connection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Events Simulation */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Live Events Simulation</h2>
              
              <div className="space-y-3">
                {simulatedEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-sm">
                        {event.type === 'audit_event' ? '🔍' : '⚖️'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {event.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {simulatedEvents.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">Waiting for live events...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Technical Details</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-900 mb-1">WebSocket Integration</h3>
                  <p className="text-xs text-yellow-700">
                    Real-time connection to audit events and governance updates
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-1">Event Message Styling</h3>
                  <p className="text-xs text-green-700">
                    Special blue styling for live proof stream notifications
                  </p>
                </div>

                <div className="p-3 bg-brand-indigo/10 rounded-lg border border-brand-indigo/30">
                  <h3 className="font-medium text-brand-indigo mb-1">Demo Response Simulation</h3>
                  <p className="text-xs text-brand-indigo">
                    Random responses from predefined pharma compliance scenarios
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MetaLoop Assistant Panel */}
      <div className={demoMode === 'mobile' ? 'max-w-sm mx-auto' : ''}>
        <MetaLoopAssistantPanel 
          isOpen={isPanelOpen} 
          onClose={() => setIsPanelOpen(false)}
          className={demoMode === 'mobile' ? 'w-full' : ''}
        />
      </div>
    </div>
  );
};

export default MetaLoopAssistantDemo; 