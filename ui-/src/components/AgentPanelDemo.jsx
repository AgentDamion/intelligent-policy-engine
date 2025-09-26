// File: ui/components/AgentPanelDemo.jsx

import React, { useState } from 'react';
import { AgentPanel } from './AgentPanel';

const AgentPanelDemo = () => {
  const [currentUser, setCurrentUser] = useState({
    type: 'enterprise',
    name: 'Sarah Johnson',
    company: 'Pfizer Marketing'
  });

  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState(null);

  const demoScenarios = [
    {
      title: 'Enterprise User - Policy Creation',
      description: 'Create AI usage policies with Compliance Commander',
      userType: 'enterprise',
      message: 'Help me create a comprehensive AI policy for social media content',
      color: 'blue'
    },
    {
      title: 'Enterprise User - Compliance Analysis',
      description: 'Analyze compliance across agency partners',
      userType: 'enterprise',
      message: 'Analyze our current compliance status and identify areas for improvement',
      color: 'blue'
    },
    {
      title: 'Enterprise User - Seat Optimization',
      description: 'Get AI recommendations for agency seat management',
      userType: 'enterprise',
      message: 'Help me optimize our agency seat allocation',
      color: 'blue'
    },
    {
      title: 'Agency User - Tool Submission',
      description: 'Submit AI tools for approval with Approval Assistant',
      userType: 'agency_seat',
      message: 'Help me submit a new AI tool for client approval',
      color: 'green'
    },
    {
      title: 'Agency User - Requirements Check',
      description: 'Understand client compliance requirements',
      userType: 'agency_seat',
      message: 'What are the current client requirements for AI tool submissions?',
      color: 'green'
    }
  ];

  const handleScenarioClick = (scenario) => {
    setCurrentUser({ ...currentUser, type: scenario.userType });
    setInitialMessage(scenario.message);
    setIsAgentPanelOpen(true);
  };

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
              <h1 className="text-xl font-semibold text-gray-900">AgentPanel Demo</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Conversational AI Assistant</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Scenarios */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Scenarios</h2>
              <p className="text-sm text-gray-600 mb-4">
                Test the AgentPanel with different user types and scenarios:
              </p>
              <div className="space-y-4">
                {demoScenarios.map((scenario, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{scenario.title}</h3>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                      <div 
                        className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                          scenario.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => handleScenarioClick(scenario)}
                      className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                        scenario.color === 'blue'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      Try This Scenario
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Context-aware AI personalities (Enterprise vs Agency)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Slide-in panel with minimize/maximize functionality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Real-time status updates to MetaLoopStatus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Action execution with UI integration hooks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Intelligent conversation flow with suggestions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Message history and typing indicators</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Role-based capabilities and expertise areas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">1. Open the AgentPanel</h3>
                  <p className="text-sm text-gray-600">Click any "Try This Scenario" button to open the conversational AI assistant with a pre-configured scenario.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">2. Interact with AI</h3>
                  <p className="text-sm text-gray-600">Type messages, click suggestions, or execute actions. The AI will respond based on your user type and context.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">3. Execute Actions</h3>
                  <p className="text-sm text-gray-600">Click action buttons to trigger real UI updates and see the AI assistant execute tasks on your behalf.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">4. Minimize Panel</h3>
                  <p className="text-sm text-gray-600">Use the minimize button to keep the panel open while working on other tasks.</p>
                </div>
              </div>
            </div>

            {/* AI Personalities */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Personalities</h2>
              <div className="space-y-4">
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h4 className="font-medium text-blue-900">Compliance Commander</h4>
                      <p className="text-sm text-blue-700">Enterprise AI Assistant</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800">
                    Specialized in policy creation, compliance analysis, seat optimization, and multi-agency governance.
                  </p>
                </div>
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🤝</span>
                    <div>
                      <h4 className="font-medium text-green-900">Approval Assistant</h4>
                      <p className="text-sm text-green-700">Agency AI Assistant</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800">
                    Focused on tool submissions, client requirements, approval processes, and compliance documentation.
                  </p>
                </div>
              </div>
            </div>

            {/* Integration Points */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Points</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">MetaLoopStatus status updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Policy builder workflows</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Seat management optimization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Compliance dashboard integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Custom event dispatching</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AgentPanel */}
      <AgentPanel
        isOpen={isAgentPanelOpen}
        onClose={() => setIsAgentPanelOpen(false)}
        initialMessage={initialMessage}
        context={{ userType: currentUser.type }}
        currentUser={currentUser}
      />
    </div>
  );
};

export default AgentPanelDemo; 