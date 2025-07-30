import React, { useState, useEffect } from 'react';
import { useContextStore } from '../stores/contextStore';
import './ContextAwareDashboard.css';

// Enterprise Components
const EnterpriseCommandCenter = ({ context, onNavigate }) => {
  const { dashboardData, isLoading, error } = useContextStore();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading enterprise dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <span className="error-icon">⚠️</span>
        <h3>Failed to load dashboard</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const data = dashboardData?.enterprise || {};

  return (
    <div className="enterprise-command-center">
      <div className="dashboard-header">
        <h1>🏢 Enterprise Command Center</h1>
        <p className="subtitle">Managing {context.name} - {context.role}</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card policy-management">
          <div className="card-header">
            <h3>📋 Policy Management</h3>
            <span className="card-badge">Active</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.activePolicies || 0}</span>
              <span className="metric-label">Active Policies</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.complianceRate || '0%'}</span>
              <span className="metric-label">Compliance Rate</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('policy-management')}
            >
              Manage Policies
            </button>
          </div>
        </div>

        <div className="dashboard-card seat-management">
          <div className="card-header">
            <h3>👥 Seat Management</h3>
            <span className="card-badge">Admin</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.totalSeats || 0}</span>
              <span className="metric-label">Total Seats</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.activeUsers || 0}</span>
              <span className="metric-label">Active Users</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('seat-management')}
            >
              Manage Seats
            </button>
          </div>
        </div>

        <div className="dashboard-card audit-center">
          <div className="card-header">
            <h3>🔍 Audit Center</h3>
            <span className="card-badge">Live</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.auditEvents || 0}</span>
              <span className="metric-label">Audit Events</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.pendingReviews || 0}</span>
              <span className="metric-label">Pending Reviews</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('audit-center')}
            >
              View Audits
            </button>
          </div>
        </div>

        <div className="dashboard-card analytics">
          <div className="card-header">
            <h3>📊 Analytics</h3>
            <span className="card-badge">Real-time</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.complianceSavings || '$0'}</span>
              <span className="metric-label">Compliance Savings</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.efficiencyGain || '0%'}</span>
              <span className="metric-label">Efficiency Gain</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('analytics')}
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Agency Components
const AgencyWorkflowHub = ({ context, onNavigate }) => {
  const { dashboardData, isLoading, error } = useContextStore();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading agency dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <span className="error-icon">⚠️</span>
        <h3>Failed to load dashboard</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const data = dashboardData?.agency || {};

  return (
    <div className="agency-workflow-hub">
      <div className="dashboard-header">
        <h1>🏛️ Agency Workflow Hub</h1>
        <p className="subtitle">Working in {context.name} - {context.role}</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card submissions">
          <div className="card-header">
            <h3>📝 Submissions</h3>
            <span className="card-badge">Active</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.pendingSubmissions || 0}</span>
              <span className="metric-label">Pending</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.approvedToday || 0}</span>
              <span className="metric-label">Approved Today</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('submissions')}
            >
              View Submissions
            </button>
          </div>
        </div>

        <div className="dashboard-card client-compliance">
          <div className="card-header">
            <h3>👥 Client Compliance</h3>
            <span className="card-badge">Live</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.activeClients || 0}</span>
              <span className="metric-label">Active Clients</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.complianceRate || '0%'}</span>
              <span className="metric-label">Compliance Rate</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('client-compliance')}
            >
              Manage Clients
            </button>
          </div>
        </div>

        <div className="dashboard-card tool-management">
          <div className="card-header">
            <h3>🛠️ Tool Management</h3>
            <span className="card-badge">Available</span>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{data.approvedTools || 0}</span>
              <span className="metric-label">Approved Tools</span>
            </div>
            <div className="metric">
              <span className="metric-value">{data.pendingRequests || 0}</span>
              <span className="metric-label">Pending Requests</span>
            </div>
            <button 
              className="card-action-btn"
              onClick={() => onNavigate('tool-management')}
            >
              Manage Tools
            </button>
          </div>
        </div>

        <div className="dashboard-card workflow">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
            <span className="card-badge">Ready</span>
          </div>
          <div className="card-content">
            <div className="quick-actions">
              <button 
                className="quick-action-btn"
                onClick={() => onNavigate('new-submission')}
              >
                📝 New Submission
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => onNavigate('tool-request')}
              >
                🛠️ Request Tool
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => onNavigate('compliance-check')}
              >
                ✅ Compliance Check
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const ContextAwareDashboard = ({ 
  onNavigate, 
  className = '' 
}) => {
  const { 
    currentContext, 
    dashboardData, 
    isLoading, 
    error,
    loadDashboardData,
    refreshAll
  } = useContextStore();

  useEffect(() => {
    if (currentContext) {
      loadDashboardData();
    }
  }, [currentContext, loadDashboardData]);

  if (!currentContext) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (isLoading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading {currentContext.name} dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`context-aware-dashboard ${className}`}>
      {currentContext.type === 'enterprise' ? (
        <EnterpriseCommandCenter 
          context={currentContext} 
          onNavigate={onNavigate}
        />
      ) : (
        <AgencyWorkflowHub 
          context={currentContext} 
          onNavigate={onNavigate}
        />
      )}
      
      {/* Refresh button for manual updates */}
      <div className="dashboard-actions">
        <button 
          className="refresh-btn"
          onClick={refreshAll}
          disabled={isLoading}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default ContextAwareDashboard; 