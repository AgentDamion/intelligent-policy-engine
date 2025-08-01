import React, { useState, useEffect, useContext } from 'react';
import './AIAgentHub.css';
import { AgentContext } from '../../contexts/AgentContext';

const AIAgentHub = ({ onAgentInteraction, collapsed }) => {
  const { agents, status } = useContext(AgentContext);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentDetails, setAgentDetails] = useState({});
  const [workflowStatus, setWorkflowStatus] = useState({});
  const [agentMetrics, setAgentMetrics] = useState({});

  const agentConfigs = {
    context: {
      name: 'Context Agent',
      description: 'Analyzes user intent and urgency for intelligent routing',
      capabilities: ['Intent Analysis', 'Urgency Detection', 'Context Mapping'],
      icon: '🧠',
      color: 'var(--primary-blue)',
      status: 'active'
    },
    policy: {
      name: 'Policy Agent',
      description: 'Makes compliance decisions based on policies and risk assessment',
      capabilities: ['Policy Evaluation', 'Risk Assessment', 'Compliance Checking'],
      icon: '📋',
      color: 'var(--accent-green)',
      status: 'active'
    },
    negotiation: {
      name: 'Negotiation Agent',
      description: 'Handles multi-client policy conflicts intelligently',
      capabilities: ['Conflict Resolution', 'Compromise Solutions', 'Client Relations'],
      icon: '🤝',
      color: 'var(--accent-purple)',
      status: 'active'
    },
    audit: {
      name: 'Audit Agent',
      description: 'Comprehensive compliance audit trail system',
      capabilities: ['Audit Logging', 'Compliance Tracking', 'Report Generation'],
      icon: '📝',
      color: 'var(--accent-orange)',
      status: 'active'
    },
    'conflict-detection': {
      name: 'Conflict Detection Agent',
      description: 'Analyzes multiple policies for conflicts',
      capabilities: ['Policy Analysis', 'Conflict Identification', 'Resolution Suggestions'],
      icon: '⚖️',
      color: 'var(--accent-red)',
      status: 'active'
    },
    'pre-flight': {
      name: 'Pre-Flight Agent',
      description: 'Performs initial content checks before full processing',
      capabilities: ['Content Scanning', 'Risk Phrases', 'Real-time Processing'],
      icon: '✈️',
      color: 'var(--secondary-blue)',
      status: 'active'
    },
    'pattern-recognition': {
      name: 'Pattern Recognition Agent',
      description: 'Identifies patterns and anomalies in workflow execution',
      capabilities: ['Pattern Analysis', 'Anomaly Detection', 'Trend Identification'],
      icon: '🔍',
      color: 'var(--accent-purple)',
      status: 'active'
    }
  };

  useEffect(() => {
    // Initialize agent metrics
    const metrics = {};
    Object.keys(agents).forEach(agentName => {
      metrics[agentName] = {
        requestsProcessed: Math.floor(Math.random() * 1000) + 100,
        averageResponseTime: Math.floor(Math.random() * 500) + 50,
        successRate: Math.floor(Math.random() * 20) + 80,
        lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString()
      };
    });
    setAgentMetrics(metrics);

    // Initialize workflow status
    setWorkflowStatus({
      'agency-tool-submission': { status: 'idle', progress: 0 },
      'enterprise-policy-creation': { status: 'idle', progress: 0 },
      'multi-client-conflict-resolution': { status: 'idle', progress: 0 },
      'compliance-audit-workflow': { status: 'idle', progress: 0 }
    });
  }, []);

  const handleAgentClick = (agentName) => {
    setSelectedAgent(agentName);
    const config = agentConfigs[agentName];
    setAgentDetails({
      ...config,
      metrics: agentMetrics[agentName],
      currentStatus: agents[agentName]
    });
  };

  const handleAgentAction = (agentName, action) => {
    console.log(`🤖 Agent action: ${agentName} - ${action}`);
    onAgentInteraction(agentName, action);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--ai-active)';
      case 'processing': return 'var(--ai-processing)';
      case 'error': return 'var(--ai-error)';
      case 'inactive': return 'var(--ai-inactive)';
      default: return 'var(--ai-inactive)';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'var(--accent-green)';
    if (confidence >= 0.7) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  };

  if (collapsed) {
    return (
      <div className="ai-agent-hub collapsed">
        <div className="hub-header">
          <span className="hub-icon">🤖</span>
        </div>
        <div className="agent-list">
          {Object.keys(agents).map(agentName => (
            <button
              key={agentName}
              className={`agent-item ${selectedAgent === agentName ? 'selected' : ''}`}
              onClick={() => handleAgentClick(agentName)}
              title={agentConfigs[agentName]?.name}
            >
              <span className="agent-icon">{agentConfigs[agentName]?.icon}</span>
              <div 
                className="agent-status"
                style={{ backgroundColor: getStatusColor(agents[agentName]?.status) }}
              ></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-agent-hub">
      {/* Hub Header */}
      <div className="hub-header">
        <h3 className="hub-title">AI Agent Hub</h3>
        <div className="hub-status">
          <span className="status-dot active"></span>
          <span className="status-text">All Systems Active</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="agent-grid">
        {Object.keys(agents).map(agentName => {
          const config = agentConfigs[agentName];
          const agent = agents[agentName];
          
          return (
            <div
              key={agentName}
              className={`agent-card ${selectedAgent === agentName ? 'selected' : ''}`}
              onClick={() => handleAgentClick(agentName)}
            >
              <div className="agent-header">
                <span className="agent-icon" style={{ color: config.color }}>
                  {config.icon}
                </span>
                <div className="agent-info">
                  <h4 className="agent-name">{config.name}</h4>
                  <p className="agent-description">{config.description}</p>
                </div>
                <div 
                  className="agent-status-indicator"
                  style={{ backgroundColor: getStatusColor(agent.status) }}
                ></div>
              </div>
              
              <div className="agent-metrics">
                <div className="metric">
                  <span className="metric-label">Confidence</span>
                  <span 
                    className="metric-value"
                    style={{ color: getConfidenceColor(agent.confidence) }}
                  >
                    {Math.round(agent.confidence * 100)}%
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Requests</span>
                  <span className="metric-value">
                    {agentMetrics[agentName]?.requestsProcessed || 0}
                  </span>
                </div>
              </div>

              <div className="agent-actions">
                <button
                  className="action-btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agentName, 'activate');
                  }}
                >
                  Activate
                </button>
                <button
                  className="action-btn secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agentName, 'configure');
                  }}
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Details Panel */}
      {selectedAgent && (
        <div className="agent-details-panel">
          <div className="details-header">
            <h4 className="details-title">{agentDetails.name}</h4>
            <button 
              className="close-btn"
              onClick={() => setSelectedAgent(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            <div className="detail-section">
              <h5 className="section-title">Description</h5>
              <p className="section-content">{agentDetails.description}</p>
            </div>
            
            <div className="detail-section">
              <h5 className="section-title">Capabilities</h5>
              <div className="capabilities-list">
                {agentDetails.capabilities?.map((capability, index) => (
                  <span key={index} className="capability-tag">
                    {capability}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="detail-section">
              <h5 className="section-title">Performance Metrics</h5>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Requests Processed</span>
                  <span className="metric-value">
                    {agentDetails.metrics?.requestsProcessed || 0}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Response Time</span>
                  <span className="metric-value">
                    {agentDetails.metrics?.averageResponseTime || 0}ms
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Success Rate</span>
                  <span className="metric-value">
                    {agentDetails.metrics?.successRate || 0}%
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Current Confidence</span>
                  <span 
                    className="metric-value"
                    style={{ color: getConfidenceColor(agentDetails.currentStatus?.confidence) }}
                  >
                    {Math.round((agentDetails.currentStatus?.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h5 className="section-title">Recent Activity</h5>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">2 minutes ago</span>
                  <span className="activity-text">Processed policy evaluation request</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">5 minutes ago</span>
                  <span className="activity-text">Updated compliance status</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">10 minutes ago</span>
                  <span className="activity-text">Generated audit report</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Status */}
      <div className="workflow-status-section">
        <h4 className="section-title">Active Workflows</h4>
        <div className="workflow-list">
          {Object.entries(workflowStatus).map(([workflowName, status]) => (
            <div key={workflowName} className="workflow-item">
              <div className="workflow-info">
                <span className="workflow-name">{workflowName.replace(/-/g, ' ')}</span>
                <span className="workflow-status">{status.status}</span>
              </div>
              <div className="workflow-progress">
                <div 
                  className="progress-bar"
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAgentHub; 