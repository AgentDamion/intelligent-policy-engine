import React, { useState, useEffect } from 'react';
import designSystem, { getColor, getTypography, getComponent } from '../design-system';
import MetaLoopLogo from './MetaLoopLogo';
import AicomplyrLogo from './AicomplyrLogo';
import './ResponsiveLogos.css';

const DesignSystemDashboard = () => {
  const [complianceMetrics, setComplianceMetrics] = useState({
    totalPolicies: 127,
    activeWorkflows: 8,
    pendingReviews: 3,
    complianceScore: 94.2
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'policy_update',
      title: 'FDA Policy Update Applied',
      description: 'Updated 3 compliance policies based on latest FDA guidance',
      status: 'completed',
      timestamp: '2 hours ago',
      agent: 'Policy Agent'
    },
    {
      id: 2,
      type: 'tool_approval',
      title: 'Diabetes Campaign Tool Approved',
      description: 'Auto-approved after compliance check (Risk: Low)',
      status: 'success',
      timestamp: '4 hours ago',
      agent: 'Audit Agent'
    },
    {
      id: 3,
      type: 'manual_review',
      title: 'Manual Review Required',
      description: 'New AI tool flagged for human review',
      status: 'warning',
      timestamp: '6 hours ago',
      agent: 'Context Agent'
    }
  ]);

  const [activeWorkflows, setActiveWorkflows] = useState([
    {
      id: 1,
      name: 'Q4 Compliance Audit',
      progress: 75,
      status: 'in_progress',
      agents: ['Audit Agent', 'Policy Agent'],
      dueDate: 'Dec 15, 2024'
    },
    {
      id: 2,
      name: 'FDA Policy Integration',
      progress: 90,
      status: 'near_completion',
      agents: ['Policy Agent'],
      dueDate: 'Dec 10, 2024'
    },
    {
      id: 3,
      name: 'Tool Submission Review',
      progress: 30,
      status: 'in_progress',
      agents: ['Context Agent', 'Audit Agent'],
      dueDate: 'Dec 12, 2024'
    }
  ]);

  const [aiAgents, setAiAgents] = useState([
    {
      name: 'Context Agent',
      status: 'active',
      confidence: 0.95,
      lastActivity: '2 min ago',
      tasks: 3
    },
    {
      name: 'Policy Agent',
      status: 'active',
      confidence: 0.88,
      lastActivity: '5 min ago',
      tasks: 2
    },
    {
      name: 'Audit Agent',
      status: 'active',
      confidence: 0.97,
      lastActivity: '1 min ago',
      tasks: 4
    },
    {
      name: 'Negotiation Agent',
      status: 'idle',
      confidence: 0.92,
      lastActivity: '15 min ago',
      tasks: 0
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return getColor('accent.success');
      case 'warning':
      case 'manual_review':
        return getColor('accent.warning');
      case 'error':
        return getColor('accent.error');
      case 'in_progress':
      case 'near_completion':
        return getColor('accent.info');
      default:
        return getColor('neutral.mediumGray');
    }
  };

  const getAgentStatusColor = (status) => {
    switch (status) {
      case 'active':
        return getColor('accent.success');
      case 'idle':
        return getColor('neutral.mediumGray');
      case 'warning':
        return getColor('accent.warning');
      default:
        return getColor('neutral.mediumGray');
    }
  };

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return getColor('accent.info');
      case 'near_completion':
        return getColor('accent.success');
      case 'pending':
        return getColor('accent.warning');
      default:
        return getColor('neutral.mediumGray');
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: getColor('neutral.offWhite'),
        fontFamily: getTypography('fontFamilies.primary')
      }}
    >
      <div 
        className="max-w-screen-2xl mx-auto px-8"
        style={{ padding: designSystem.layouts.container.padding }}
      >
        {/* Metrics Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="bg-white rounded-2xl shadow-meta p-6 transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium text-slate-500"
                    style={{ color: getColor('neutral.mediumGray') }}
                  >
                    Total Policies
                  </p>
                  <p 
                    className="text-2xl font-bold text-slate-800"
                    style={{ color: getColor('neutral.darkGray') }}
                  >
                    {complianceMetrics.totalPolicies}
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: getColor('secondary.seafoam') }}
                >
                  <span className="text-lg">📋</span>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-2xl shadow-meta p-6 transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium text-slate-500"
                    style={{ color: getColor('neutral.mediumGray') }}
                  >
                    Active Workflows
                  </p>
                  <p 
                    className="text-2xl font-bold text-slate-800"
                    style={{ color: getColor('neutral.darkGray') }}
                  >
                    {complianceMetrics.activeWorkflows}
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: getColor('secondary.mint') }}
                >
                  <span className="text-lg">🔄</span>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-2xl shadow-meta p-6 transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium text-slate-500"
                    style={{ color: getColor('neutral.mediumGray') }}
                  >
                    Pending Reviews
                  </p>
                  <p 
                    className="text-2xl font-bold text-slate-800"
                    style={{ color: getColor('accent.warning') }}
                  >
                    {complianceMetrics.pendingReviews}
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: getColor('secondary.lightTeal') }}
                >
                  <span className="text-lg">⏰</span>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-2xl shadow-meta p-6 transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium text-slate-500"
                    style={{ color: getColor('neutral.mediumGray') }}
                  >
                    Compliance Score
                  </p>
                  <p 
                    className="text-2xl font-bold text-slate-800"
                    style={{ color: getColor('accent.success') }}
                  >
                    {complianceMetrics.complianceScore}%
                  </p>
                </div>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: getColor('primary.teal') }}
                >
                  <span className="text-lg text-white">✓</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activities & AI Agents */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activities */}
            <div 
              className="bg-white rounded-2xl shadow-meta p-6"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-lg font-semibold text-slate-700"
                  style={{ 
                    fontSize: getTypography('fontSizes.xl'),
                    color: getColor('neutral.darkGray')
                  }}
                >
                  Recent Activities
                </h2>
                <button 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  style={{ color: getColor('primary.teal') }}
                >
                  View all →
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-gray-50"
                    style={{ border: `1px solid ${getColor('neutral.lightGray')}` }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mt-2"
                      style={{ backgroundColor: getStatusColor(activity.status) }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 
                          className="font-medium text-slate-800"
                          style={{ color: getColor('neutral.darkGray') }}
                        >
                          {activity.title}
                        </h3>
                        <span 
                          className="text-xs text-slate-500"
                          style={{ color: getColor('neutral.mediumGray') }}
                        >
                          {activity.timestamp}
                        </span>
                      </div>
                      <p 
                        className="text-sm mb-2 text-slate-600"
                        style={{ color: getColor('neutral.mediumGray') }}
                      >
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700"
                          style={{
                            background: getComponent('badges.default.background'),
                            color: getComponent('badges.default.color'),
                            padding: getComponent('badges.default.padding'),
                            borderRadius: getComponent('badges.default.borderRadius'),
                            fontSize: getComponent('badges.default.fontSize'),
                            fontWeight: getComponent('badges.default.fontWeight')
                          }}
                        >
                          {activity.agent}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Agents Status */}
            <div 
              className="bg-white rounded-2xl shadow-meta p-6"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <h2 
                className="text-lg font-semibold mb-6 text-slate-700"
                style={{ 
                  fontSize: getTypography('fontSizes.xl'),
                  color: getColor('neutral.darkGray')
                }}
              >
                AI Agents Status
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiAgents.map((agent) => (
                  <div 
                    key={agent.name}
                    className="p-4 rounded-xl border transition-all duration-200 hover:transform hover:-translate-y-1"
                    style={{
                      background: getColor('neutral.white'),
                      border: getComponent('cards.default.border'),
                      borderRadius: getComponent('cards.default.borderRadius')
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 
                        className="font-medium text-slate-800"
                        style={{ color: getColor('neutral.darkGray') }}
                      >
                        {agent.name}
                      </h3>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getAgentStatusColor(agent.status) }}
                      ></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>Confidence:</span>
                        <span className="text-slate-800" style={{ color: getColor('neutral.darkGray') }}>{(agent.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>Active Tasks:</span>
                        <span className="text-slate-800" style={{ color: getColor('neutral.darkGray') }}>{agent.tasks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>Last Activity:</span>
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>{agent.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Active Workflows & Quick Actions */}
          <div className="space-y-8">
            {/* Active Workflows */}
            <div 
              className="bg-white rounded-2xl shadow-meta p-6"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <h2 
                className="text-lg font-semibold mb-6 text-slate-700"
                style={{ 
                  fontSize: getTypography('fontSizes.xl'),
                  color: getColor('neutral.darkGray')
                }}
              >
                Active Workflows
              </h2>
              
              <div className="space-y-4">
                {activeWorkflows.map((workflow) => (
                  <div 
                    key={workflow.id}
                    className="p-4 rounded-xl border transition-all duration-200 hover:transform hover:-translate-y-1"
                    style={{
                      background: getColor('neutral.white'),
                      border: getComponent('cards.default.border'),
                      borderRadius: getComponent('cards.default.borderRadius')
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 
                        className="font-medium text-slate-800"
                        style={{ color: getColor('neutral.darkGray') }}
                      >
                        {workflow.name}
                      </h3>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getWorkflowStatusColor(workflow.status) }}
                      ></div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>Progress</span>
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>{workflow.progress}%</span>
                      </div>
                      <div 
                        className="w-full rounded"
                        style={{
                          height: designSystem.specialElements.progressBars.height,
                          background: designSystem.specialElements.progressBars.background,
                          borderRadius: designSystem.specialElements.progressBars.borderRadius
                        }}
                      >
                        <div 
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${workflow.progress}%`,
                            background: designSystem.specialElements.progressBars.fillColor,
                            borderRadius: designSystem.specialElements.progressBars.borderRadius
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>Due:</span>
                        <span className="text-slate-800" style={{ color: getColor('neutral.darkGray') }}>{workflow.dueDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500" style={{ color: getColor('neutral.mediumGray') }}>Agents:</span>
                        <span className="text-slate-800" style={{ color: getColor('neutral.darkGray') }}>{workflow.agents.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div 
              className="bg-white rounded-2xl shadow-meta p-6"
              style={{
                border: getComponent('cards.default.border'),
                boxShadow: getComponent('cards.default.boxShadow')
              }}
            >
              <h2 
                className="text-lg font-semibold mb-6 text-slate-700"
                style={{ 
                  fontSize: getTypography('fontSizes.xl'),
                  color: getColor('neutral.darkGray')
                }}
              >
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <button 
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:transform hover:-translate-y-1 flex items-center justify-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
                  style={{
                    background: getComponent('buttons.primary.background'),
                    color: getComponent('buttons.primary.color'),
                    borderRadius: getComponent('buttons.primary.borderRadius'),
                    fontSize: getComponent('buttons.primary.fontSize'),
                    fontWeight: getComponent('buttons.primary.fontWeight')
                  }}
                >
                  <span>📋</span>
                  <span>Create New Policy</span>
                </button>
                
                <button 
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:transform hover:-translate-y-1 flex items-center justify-center space-x-2 bg-green-600 text-white hover:bg-green-700"
                  style={{
                    background: getComponent('buttons.secondary.background'),
                    color: getComponent('buttons.secondary.color'),
                    border: getComponent('buttons.secondary.border'),
                    borderRadius: getComponent('buttons.secondary.borderRadius')
                  }}
                >
                  <span>🔍</span>
                  <span>Run Compliance Audit</span>
                </button>
                
                <button 
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:transform hover:-translate-y-1 flex items-center justify-center space-x-2 bg-gray-600 text-white hover:bg-gray-700"
                  style={{
                    background: getComponent('buttons.secondary.background'),
                    color: getComponent('buttons.secondary.color'),
                    border: getComponent('buttons.secondary.border'),
                    borderRadius: getComponent('buttons.secondary.borderRadius')
                  }}
                >
                  <span>📊</span>
                  <span>Generate Report</span>
                </button>
                
                <button 
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:transform hover:-translate-y-1 flex items-center justify-center space-x-2 bg-orange-600 text-white hover:bg-orange-700"
                  style={{
                    background: getComponent('buttons.danger.background'),
                    color: getComponent('buttons.danger.color'),
                    borderRadius: getComponent('buttons.danger.borderRadius')
                  }}
                >
                  <span>⚠</span>
                  <span>Review Alerts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemDashboard; 