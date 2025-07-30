// File: ui/components/EnhancedDashboard.jsx

import React, { useState, useEffect } from 'react';
import { MetaLoopStatus } from './MetaLoopStatus';
import DashboardShell from './DashboardShell';
import DashboardContent from './DashboardContent';

// Enhanced Context Store with Agent Status
export const useAgentStatusStore = (() => {
  let store = null;
  
  return () => {
    if (!store) {
      store = {
        agentStatus: 'idle',
        agentActivity: [],
        isMonitoring: false,

        updateAgentStatus: (status, agent, action) => {
          store.agentStatus = status;
          store.agentActivity = [
            ...store.agentActivity.slice(-9), // Keep last 10 activities
            {
              id: Date.now(),
              timestamp: new Date(),
              agent,
              action,
              status
            }
          ];
        },

        startMonitoring: () => {
          store.isMonitoring = true;
        },

        stopMonitoring: () => {
          store.isMonitoring = false;
        }
      };
    }
    
    return store;
  };
})();

// Integration with existing Dashboard
export const EnhancedDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [agentStatus, setAgentStatus] = useState('idle');
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showGovernanceStream, setShowGovernanceStream] = useState(false);

  // Listen for custom events from MetaLoopStatus
  useEffect(() => {
    const handleOpenAgentPanel = () => {
      setShowAgentPanel(true);
    };

    const handleOpenGovernanceStream = () => {
      setShowGovernanceStream(true);
    };

    window.addEventListener('openAgentPanel', handleOpenAgentPanel);
    window.addEventListener('openGovernanceStream', handleOpenGovernanceStream);

    return () => {
      window.removeEventListener('openAgentPanel', handleOpenAgentPanel);
      window.removeEventListener('openGovernanceStream', handleOpenGovernanceStream);
    };
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleStatusChange = (status) => {
    setAgentStatus(status);
    console.log('Agent status changed:', status);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Existing Dashboard Layout */}
      <DashboardShell
        pageTitle={activeSection === 'dashboard' ? 'Dashboard' : activeSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        onSectionChange={handleSectionChange}
      >
        <DashboardContent activeSection={activeSection} />
      </DashboardShell>

      {/* AI Status Integration in Header */}
      <div className="fixed top-4 right-20 z-40">
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-200">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ 
              backgroundColor: {
                idle: '#10b981',
                processing: '#f59e0b', 
                active: '#3b82f6',
                alert: '#ef4444'
              }[agentStatus]
            }}
          />
          <span className="text-xs text-gray-600 font-medium">
            AI {agentStatus === 'idle' ? 'Ready' : agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Meta-Loop Status Overlay */}
      <MetaLoopStatus 
        position="top-right"
        size="medium"
        onStatusChange={handleStatusChange}
      />

      {/* Agent Panel (if opened from MetaLoopStatus) */}
      {showAgentPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="w-full md:w-1/3 bg-white shadow-2xl border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">AI Agent Panel</h3>
                <button
                  onClick={() => setShowAgentPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600">AI Agent panel content would go here...</p>
            </div>
          </div>
        </div>
      )}

      {/* Governance Stream (if opened from MetaLoopStatus) */}
      {showGovernanceStream && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="w-full md:w-1/2 bg-white shadow-2xl border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Governance Stream</h3>
                <button
                  onClick={() => setShowGovernanceStream(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600">Governance stream content would go here...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Backend API integration for agent status
export const agentStatusAPI = {
  getCurrentStatus: async (contextId) => {
    try {
      const response = await fetch(`/api/agents/status/${contextId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    } catch (error) {
      console.error('Error getting agent status:', error);
      return { status: 'idle', activity: [] };
    }
  },

  triggerAgentAction: async (action, contextId) => {
    try {
      const response = await fetch('/api/agents/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          contextId,
          timestamp: new Date().toISOString()
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error triggering agent action:', error);
      return { success: false, error: 'Failed to trigger action' };
    }
  },

  getAgentActivity: async (contextId, limit = 10) => {
    try {
      const response = await fetch(`/api/agents/activity/${contextId}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    } catch (error) {
      console.error('Error getting agent activity:', error);
      return { activity: [] };
    }
  }
};

export default EnhancedDashboard; 