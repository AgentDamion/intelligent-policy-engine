import React, { useState, useEffect } from 'react';
import './AdaptiveNavigation.css';

const AdaptiveNavigation = ({ userRole, activeView, onViewChange, collapsed }) => {
  const [navigationConfig, setNavigationConfig] = useState({});
  const [quickActions, setQuickActions] = useState([]);
  const [recentWorkflows, setRecentWorkflows] = useState([]);

  // Navigation configurations based on user role
  const navigationConfigs = {
    enterprise: {
      primary: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: null },
        { id: 'agency-management', label: 'Agency Management', icon: '🏢', badge: '3' },
        { id: 'policy-center', label: 'Policy Center', icon: '📋', badge: null },
        { id: 'compliance-hub', label: 'Compliance Hub', icon: '🛡️', badge: '12' },
        { id: 'ai-agents', label: 'AI Agents', icon: '🤖', badge: '7' }
      ],
      secondary: [
        { id: 'audit-trails', label: 'Audit Trails', icon: '📝', badge: null },
        { id: 'reports', label: 'Reports', icon: '📈', badge: '5' },
        { id: 'settings', label: 'Settings', icon: '⚙️', badge: null }
      ],
      aiAssistant: 'Compliance Commander',
      quickActions: [
        { id: 'invite-agency', label: 'Invite Agency', icon: '➕', action: 'invite' },
        { id: 'create-policy', label: 'Create Policy', icon: '📄', action: 'create' },
        { id: 'run-audit', label: 'Run Audit', icon: '🔍', action: 'audit' }
      ]
    },
    agency: {
      primary: [
        { id: 'multi-client-dashboard', label: 'Multi-Client Dashboard', icon: '📊', badge: null },
        { id: 'tool-submissions', label: 'Tool Submissions', icon: '🛠️', badge: '2' },
        { id: 'policy-center', label: 'Policy Center', icon: '📋', badge: null },
        { id: 'compliance-status', label: 'Compliance Status', icon: '✅', badge: '8' }
      ],
      secondary: [
        { id: 'client-relationships', label: 'Client Relationships', icon: '🤝', badge: null },
        { id: 'conflict-resolution', label: 'Conflict Resolution', icon: '⚖️', badge: '1' },
        { id: 'reports', label: 'Reports', icon: '📈', badge: null }
      ],
      aiAssistant: 'Approval Assistant',
      quickActions: [
        { id: 'submit-tool', label: 'Submit Tool', icon: '🛠️', action: 'submit' },
        { id: 'check-compliance', label: 'Check Compliance', icon: '✅', action: 'check' },
        { id: 'resolve-conflict', label: 'Resolve Conflict', icon: '⚖️', action: 'resolve' }
      ]
    }
  };

  useEffect(() => {
    const config = navigationConfigs[userRole] || navigationConfigs.enterprise;
    setNavigationConfig(config);
    
    // Set up quick actions based on role
    setQuickActions(config.quickActions || []);
    
    // Mock recent workflows
    setRecentWorkflows([
      { id: 'workflow-1', name: 'Agency Tool Review', status: 'completed', timestamp: '2 hours ago' },
      { id: 'workflow-2', name: 'Policy Distribution', status: 'in-progress', timestamp: '4 hours ago' },
      { id: 'workflow-3', name: 'Compliance Audit', status: 'pending', timestamp: '1 day ago' }
    ]);
  }, [userRole]);

  const handleNavigationClick = (viewId) => {
    onViewChange(viewId);
  };

  const handleQuickAction = (action) => {
    console.log(`🚀 Quick action: ${action}`);
    // Handle quick actions
  };

  const handleWorkflowClick = (workflow) => {
    console.log(`🔄 Opening workflow: ${workflow.name}`);
    // Handle workflow navigation
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--accent-green)';
      case 'in-progress': return 'var(--accent-orange)';
      case 'pending': return 'var(--gray-500)';
      default: return 'var(--gray-500)';
    }
  };

  if (collapsed) {
    return (
      <div className="adaptive-navigation collapsed">
        <div className="nav-section">
          <div className="section-header">
            <span className="ai-assistant-icon">🤖</span>
          </div>
          <nav className="nav-items">
            {navigationConfig.primary?.slice(0, 5).map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => handleNavigationClick(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="adaptive-navigation">
      {/* AI Assistant Section */}
      <div className="nav-section ai-assistant-section">
        <div className="section-header">
          <h3 className="section-title">AI Assistant</h3>
          <span className="ai-status active">●</span>
        </div>
        <div className="ai-assistant-info">
          <div className="ai-avatar">🤖</div>
          <div className="ai-details">
            <h4 className="ai-name">{navigationConfig.aiAssistant}</h4>
            <p className="ai-status-text">Active & Ready</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="nav-section">
        <div className="section-header">
          <h3 className="section-title">Navigation</h3>
        </div>
        <nav className="nav-items">
          {navigationConfig.primary?.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => handleNavigationClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Actions */}
      <div className="nav-section">
        <div className="section-header">
          <h3 className="section-title">Quick Actions</h3>
        </div>
        <div className="quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action.action)}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Workflows */}
      <div className="nav-section">
        <div className="section-header">
          <h3 className="section-title">Recent Workflows</h3>
        </div>
        <div className="recent-workflows">
          {recentWorkflows.map((workflow) => (
            <button
              key={workflow.id}
              className="workflow-item"
              onClick={() => handleWorkflowClick(workflow)}
            >
              <div className="workflow-info">
                <span className="workflow-name">{workflow.name}</span>
                <span className="workflow-time">{workflow.timestamp}</span>
              </div>
              <div 
                className="workflow-status"
                style={{ backgroundColor: getStatusColor(workflow.status) }}
              ></div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="nav-section">
        <div className="section-header">
          <h3 className="section-title">Tools</h3>
        </div>
        <nav className="nav-items">
          {navigationConfig.secondary?.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => handleNavigationClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* User Context */}
      <div className="nav-section user-context">
        <div className="section-header">
          <h3 className="section-title">Context</h3>
        </div>
        <div className="context-info">
          <div className="context-item">
            <span className="context-label">Role:</span>
            <span className="context-value">{userRole}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Active Agents:</span>
            <span className="context-value">7/7</span>
          </div>
          <div className="context-item">
            <span className="context-label">SLA Status:</span>
            <span className="context-value success">All Green</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveNavigation; 