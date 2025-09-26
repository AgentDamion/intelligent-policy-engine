import React, { useState } from 'react';
import LiveProofStreamPanel from './LiveProofStreamPanel';

const LiveProofStreamDemo = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [demoMode, setDemoMode] = useState('static');

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleDemoModeChange = (mode) => {
    setDemoMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Proof Stream Panel Demo
          </h1>
          <p className="text-gray-600">
            Real-time audit event stream with live updates and auto-scrolling
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Panel Visibility
              </label>
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

            {/* Demo Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDemoModeChange('static')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'static'
                      ? 'bg-brand-indigo text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Static
                </button>
                <button
                  onClick={() => handleDemoModeChange('live')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'live'
                      ? 'bg-brand-indigo text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Live Updates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Main Application Area</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-brand-indigo/10 rounded-lg border border-brand-indigo/30">
              <h3 className="font-medium text-brand-indigo mb-2">📊 Dashboard Overview</h3>
              <p className="text-brand-indigo text-sm">
                This is the main application area where users would normally see their dashboard, 
                analytics, or other content. The Live Proof Stream Panel appears as a fixed sidebar 
                on the right side of the screen.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">🔍 Live Proof Features</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Real-time audit event streaming</li>
                <li>• Auto-scrolling with new events</li>
                <li>• Event icons and timestamps</li>
                <li>• Connection status indicator</li>
                <li>• "View All" navigation</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-900 mb-2">🎯 Design Specifications</h3>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• 320px fixed right sidebar</li>
                <li>• Rounded corners and subtle shadow</li>
                <li>• "See Live Proof" header with arrow</li>
                <li>• Real-time events with icons and descriptions</li>
                <li>• Auto-scroll for new events</li>
                <li>• "View All >" link at bottom</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <h3 className="font-medium text-yellow-900 mb-2">💡 How to Test</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Toggle the panel visibility using the control above</li>
            <li>• The panel shows mock audit events with realistic timestamps</li>
            <li>• Events include "Tool Approved", "Conflict detected", and "Audit Completed"</li>
            <li>• Each event has an icon, timestamp, and description</li>
            <li>• The panel connects to the existing WebSocket service</li>
            <li>• Real governance events from the server will appear automatically</li>
          </ul>
        </div>
      </div>

      {/* Live Proof Stream Panel */}
      <LiveProofStreamPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
};

export default LiveProofStreamDemo; 