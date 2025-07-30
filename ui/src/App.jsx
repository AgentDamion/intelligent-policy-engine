// src/App.jsx
import React, { useState } from 'react';
import AgentPanelDemo from './components/AgentPanelDemo';
import LiveGovernanceStreamDemo from './components/LiveGovernanceStreamDemo';
import MetaLoopStatusDemo from './components/MetaLoopStatusDemo';
import EnhancedDashboardWithAgent from './components/EnhancedDashboardWithAgent';

function App() {
  const [activeDemo, setActiveDemo] = useState('agent-panel');

  const demos = [
    { id: 'agent-panel', name: 'Agent Panel', component: AgentPanelDemo },
    { id: 'live-governance', name: 'Live Governance', component: LiveGovernanceStreamDemo },
    { id: 'meta-loop', name: 'MetaLoop Status', component: MetaLoopStatusDemo },
    { id: 'enhanced-dashboard', name: 'Enhanced Dashboard', component: EnhancedDashboardWithAgent },
  ];

  const ActiveComponent = demos.find(demo => demo.id === activeDemo)?.component || AgentPanelDemo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">🐦</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AICOMPLYR.io</h1>
            </div>
            
            {/* Demo Navigation */}
            <div className="flex space-x-2">
              {demos.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveDemo(demo.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeDemo === demo.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {demo.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default App;