import React, { useState, useEffect, useContext } from 'react';
import './UnifiedPlatform.css';
import AdaptiveNavigation from './navigation/AdaptiveNavigation';
import AIAgentHub from './agents/AIAgentHub';
import ContextAwareDashboard from './ContextAwareDashboard';
import AgencyOnboardingPortal from './AgencyOnboardingPortal';
import PolicyDistributionDashboard from './PolicyDistributionDashboard';
import HumanOverrideDemo from './HumanOverrideDemo';
import LiveGovernanceStream from './LiveGovernanceStream';
import NotificationCenter from './NotificationCenter';
import { UserContext } from '../contexts/UserContext';
import { AgentContext } from '../contexts/AgentContext';
import { WorkflowContext } from '../contexts/WorkflowContext';

const UnifiedPlatform = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [userRole, setUserRole] = useState('enterprise');
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [aiAgentStatus, setAiAgentStatus] = useState('active');
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');

  // Context providers
  const userContext = {
    role: userRole,
    setRole: setUserRole,
    workflow: currentWorkflow,
    setWorkflow: setCurrentWorkflow
  };

  const agentContext = {
    status: aiAgentStatus,
    setStatus: setAiAgentStatus,
    agents: {
      context: { status: 'active', confidence: 0.95 },
      policy: { status: 'active', confidence: 0.88 },
      negotiation: { status: 'active', confidence: 0.92 },
      audit: { status: 'active', confidence: 0.97 },
      'conflict-detection': { status: 'active', confidence: 0.89 },
      'pre-flight': { status: 'active', confidence: 0.94 },
      'pattern-recognition': { status: 'active', confidence: 0.91 }
    }
  };

  const workflowContext = {
    current: currentWorkflow,
    setCurrent: setCurrentWorkflow,
    history: [],
    addToHistory: (workflow) => {
      // Implementation for workflow history
    }
  };

  useEffect(() => {
    // Initialize platform
    console.log('🚀 Initializing Unified Platform');
    
    // Set up real-time notifications
    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    };

    return () => eventSource.close();
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    console.log(`🔄 Switching to view: ${view}`);
  };

  const handleAgentInteraction = (agentName, action) => {
    console.log(`🤖 Agent interaction: ${agentName} - ${action}`);
    // Handle agent interactions
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ContextAwareDashboard />;
      case 'agency-onboarding':
        return <AgencyOnboardingPortal />;
      case 'policy-distribution':
        return <PolicyDistributionDashboard />;
      case 'human-override':
        return <HumanOverrideDemo />;
      case 'governance-stream':
        return <LiveGovernanceStream />;
      case 'ai-agents':
        return <AIAgentHub />;
      default:
        return <ContextAwareDashboard />;
    }
  };

  return (
    <UserContext.Provider value={userContext}>
      <AgentContext.Provider value={agentContext}>
        <WorkflowContext.Provider value={workflowContext}>
          <div className={`unified-platform ${theme} ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Header */}
            <header className="platform-header">
              <div className="header-left">
                <button 
                  className="sidebar-toggle"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <span className="hamburger"></span>
                </button>
                <div className="logo">
                  <img src="/logo-hummingbird.png" alt="aicomplyr.io" />
                  <span className="logo-text">aicomplyr.io</span>
                </div>
              </div>
              
              <div className="header-center">
                <div className="ai-status-indicator">
                  <div className={`status-dot ${aiAgentStatus}`}></div>
                  <span>AI Agents Active</span>
                </div>
              </div>
              
              <div className="header-right">
                <button 
                  className="theme-toggle"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <NotificationCenter notifications={notifications} />
                <div className="user-menu">
                  <img src="/avatar.png" alt="User" className="user-avatar" />
                  <span className="user-name">Enterprise Admin</span>
                </div>
              </div>
            </header>

            {/* Main Layout */}
            <div className="platform-main">
              {/* Sidebar Navigation */}
              <aside className={`platform-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <AdaptiveNavigation 
                  userRole={userRole}
                  activeView={activeView}
                  onViewChange={handleViewChange}
                  collapsed={sidebarCollapsed}
                />
              </aside>

              {/* Main Content Area */}
              <main className="platform-content">
                <div className="content-header">
                  <h1 className="page-title">
                    {activeView === 'dashboard' && 'Intelligence Dashboard'}
                    {activeView === 'agency-onboarding' && 'Agency Onboarding'}
                    {activeView === 'policy-distribution' && 'Policy Distribution'}
                    {activeView === 'human-override' && 'Human Override System'}
                    {activeView === 'governance-stream' && 'Live Governance Stream'}
                    {activeView === 'ai-agents' && 'AI Agent Hub'}
                  </h1>
                  
                  {currentWorkflow && (
                    <div className="workflow-indicator">
                      <span className="workflow-label">Active Workflow:</span>
                      <span className="workflow-name">{currentWorkflow.name}</span>
                      <div className="workflow-progress">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${currentWorkflow.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="content-body">
                  {renderMainContent()}
                </div>
              </main>

              {/* AI Agent Panel */}
              <aside className="ai-agent-panel">
                <AIAgentHub 
                  onAgentInteraction={handleAgentInteraction}
                  collapsed={sidebarCollapsed}
                />
              </aside>
            </div>

            {/* Floating AI Assistant */}
            <div className="floating-ai-assistant">
              <button className="ai-assistant-toggle">
                <span className="ai-icon">🤖</span>
                <span className="ai-label">AI Assistant</span>
              </button>
            </div>
          </div>
        </WorkflowContext.Provider>
      </AgentContext.Provider>
    </UserContext.Provider>
  );
};

export default UnifiedPlatform; 