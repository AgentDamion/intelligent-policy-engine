// File: ui/components/LiveGovernanceStreamDemo.jsx

import React, { useState } from 'react';
import LiveGovernanceStream from './LiveGovernanceStream';

const LiveGovernanceStreamDemo = () => {
  const [isStreamOpen, setIsStreamOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">🐦</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Live Governance Stream Demo</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Real-time Governance Events</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Governance Stream</h2>
              <p className="text-sm text-gray-600">
                Real-time governance events and compliance updates
              </p>
            </div>
            <button
              onClick={() => setIsStreamOpen(!isStreamOpen)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {isStreamOpen ? 'Close Stream' : 'Open Stream'}
            </button>
          </div>

          {/* WebSocket Status */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>WebSocket Status:</strong> The LiveGovernanceStream component will connect to the WebSocket 
              when opened and display real governance events from the server.
            </p>
          </div>

          {/* Live Governance Stream Component */}
          <LiveGovernanceStream 
            isOpen={isStreamOpen}
            onClose={() => setIsStreamOpen(false)}
            position="right"
          />
        </div>
      </div>
    </div>
  );
};

export default LiveGovernanceStreamDemo; 