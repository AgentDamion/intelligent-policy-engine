// File: ui/components/EnhancedDashboardWithAgent.jsx

import React, { useState, useEffect } from 'react';
import { AgentPanel } from './AgentPanel';

// Global event handling for AgentPanel
export const useAgentPanelEvents = () => {
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  const [agentPanelContext, setAgentPanelContext] = useState(null);
  const [initialMessage, setInitialMessage] = useState(null);

  useEffect(() => {
    const handleOpenAgentPanel = (event) => {
      setAgentPanelContext(event.detail?.context || null);
      setInitialMessage(event.detail?.message || null);
      setIsAgentPanelOpen(true);
    };

    window.addEventListener('openAgentPanel', handleOpenAgentPanel);
    return () => window.removeEventListener('openAgentPanel', handleOpenAgentPanel);
  }, []);

  const openAgentPanel = (message = null, context = null) => {
    setInitialMessage(message);
    setAgentPanelContext(context);
    setIsAgentPanelOpen(true);
  };

  return {
    isAgentPanelOpen,
    setIsAgentPanelOpen,
    agentPanelContext,
    initialMessage,
    openAgentPanel
  };
};

// Enhanced Dashboard with AgentPanel integration
export const EnhancedDashboardWithAgent = () => {
  const { isAgentPanelOpen, setIsAgentPanelOpen, agentPanelContext, initialMessage } = useAgentPanelEvents();
  const [currentUser] = useState({
    type: 'enterprise', // or 'agency_seat'
    name: 'Sarah Johnson',
    company: 'Pfizer Marketing'
  });

  // Listen for MetaLoopStatus events
  useEffect(() => {
    const handleAgentStatusChange = (event) => {
      console.log('Agent status changed:', event.detail);
    };

    window.addEventListener('agentStatusChange', handleAgentStatusChange);
    return () => window.removeEventListener('agentStatusChange', handleAgentStatusChange);
  }, []);

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
              <h1 className="text-xl font-semibold text-gray-900">AICOMPLYR Governance Console</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">AI Assistant Ready</span>
              </div>
              
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAgentPanel', {
                  detail: { message: 'Help me with governance tasks' }
                }))}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                🤖 Ask AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Governance Dashboard
            </h1>
            <p className="text-gray-600">
              Manage compliance across your agency ecosystem with AI-powered assistance
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🛡️</span>
                </div>
                <h3 className="font-semibold text-gray-900">Ask AI Assistant</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Get instant help with policies, compliance, and governance decisions
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAgentPanel', {
                  detail: { message: 'Help me create a new AI policy' }
                }))}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Ask AI to Create Policy
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900">Compliance Analysis</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Get AI insights on your current compliance status and recommendations
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAgentPanel', {
                  detail: { message: 'Analyze our current compliance status' }
                }))}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Get Compliance Analysis
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-lg">⚙️</span>
                </div>
                <h3 className="font-semibold text-gray-900">Seat Optimization</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                AI recommendations for optimal agency seat allocation and management
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAgentPanel', {
                  detail: { message: 'Help me optimize our agency seat allocation' }
                }))}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Optimize Seats
              </button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Compliance Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Overall Score</span>
                  <span className="font-semibold text-green-600">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Violations</span>
                  <span className="font-semibold text-orange-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Compliant Partners</span>
                  <span className="font-semibold text-blue-600">8/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Recommendations</span>
                  <span className="font-semibold text-purple-600">5 pending</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Ogilvy policy update approved</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">McCann tool submission pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Havas compliance review needed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">AI suggested seat optimization</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agency Partners Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Agency Partners</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Ogilvy Health', status: 'compliant', score: 98, color: 'green' },
                { name: 'McCann Health', status: 'pending', score: 85, color: 'yellow' },
                { name: 'Havas Health', status: 'review', score: 72, color: 'orange' },
                { name: 'Publicis Health', status: 'compliant', score: 96, color: 'green' }
              ].map((agency, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{agency.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agency.color === 'green' ? 'bg-green-100 text-green-800' :
                      agency.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {agency.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compliance Score</span>
                    <span className="font-semibold text-gray-900">{agency.score}%</span>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAgentPanel', {
                      detail: { message: `Analyze ${agency.name} compliance status` }
                    }))}
                    className="w-full mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                  >
                    Ask AI to Analyze
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AgentPanel */}
      <AgentPanel
        isOpen={isAgentPanelOpen}
        onClose={() => setIsAgentPanelOpen(false)}
        initialMessage={initialMessage}
        context={agentPanelContext}
        currentUser={currentUser}
      />
    </div>
  );
};

export default EnhancedDashboardWithAgent; 