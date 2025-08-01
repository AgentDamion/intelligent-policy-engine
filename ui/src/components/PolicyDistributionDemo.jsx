import React, { useState } from 'react';
import PolicyDistributionDashboard from './PolicyDistributionDashboard';
import './PolicyDistributionDemo.css';

const PolicyDistributionDemo = () => {
  const [demoMode, setDemoMode] = useState('enterprise');
  const [showInstructions, setShowInstructions] = useState(true);

  const demoInstructions = {
    enterprise: {
      title: "Enterprise Admin View",
      description: "As a Pharma Enterprise Admin, you can:",
      features: [
        "Distribute AI policies to multiple agencies",
        "Track compliance across all agencies",
        "Monitor policy conflicts and resolutions",
        "View real-time sync status dashboard"
      ]
    },
    agency: {
      title: "Agency View", 
      description: "As an Agency Admin, you can:",
      features: [
        "View all policies from multiple pharma clients",
        "Track compliance requirements",
        "Identify and resolve policy conflicts",
        "Acknowledge policy distributions"
      ]
    }
  };

  const handleDemoAction = (action) => {
    switch (action) {
      case 'distribute_policy':
        alert('Demo: Policy distributed to 3 agencies\n- Digital Marketing Agency A\n- Creative Agency B\n- Media Agency C');
        break;
      case 'detect_conflicts':
        alert('Demo: 2 new conflicts detected\n- Data Privacy Policy conflicts\n- FDA Compliance Policy conflicts');
        break;
      case 'resolve_conflict':
        alert('Demo: Conflict resolved\n- Resolution notes added\n- Status updated to resolved');
        break;
      case 'acknowledge_distribution':
        alert('Demo: Policy distribution acknowledged\n- Agency notified\n- Compliance tracking initiated');
        break;
      default:
        break;
    }
  };

  return (
    <div className="policy-distribution-demo">
      <div className="demo-header">
        <h1>Policy Distribution & Sync System Demo</h1>
        <p>Experience the comprehensive policy management system for Pharma enterprises and their agencies</p>
        
        <div className="demo-controls">
          <button 
            className={`demo-mode-btn ${demoMode === 'enterprise' ? 'active' : ''}`}
            onClick={() => setDemoMode('enterprise')}
          >
            🏢 Enterprise Admin
          </button>
          <button 
            className={`demo-mode-btn ${demoMode === 'agency' ? 'active' : ''}`}
            onClick={() => setDemoMode('agency')}
          >
            🎯 Agency Admin
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="demo-instructions">
          <div className="instructions-header">
            <h2>{demoInstructions[demoMode].title}</h2>
            <button 
              className="close-instructions"
              onClick={() => setShowInstructions(false)}
            >
              ×
            </button>
          </div>
          <p>{demoInstructions[demoMode].description}</p>
          <ul>
            {demoInstructions[demoMode].features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <div className="demo-actions">
            {demoMode === 'enterprise' && (
              <>
                <button 
                  className="demo-action-btn"
                  onClick={() => handleDemoAction('distribute_policy')}
                >
                  📤 Distribute Policy
                </button>
                <button 
                  className="demo-action-btn"
                  onClick={() => handleDemoAction('detect_conflicts')}
                >
                  🔍 Detect Conflicts
                </button>
              </>
            )}
            {demoMode === 'agency' && (
              <>
                <button 
                  className="demo-action-btn"
                  onClick={() => handleDemoAction('acknowledge_distribution')}
                >
                  ✅ Acknowledge Distribution
                </button>
                <button 
                  className="demo-action-btn"
                  onClick={() => handleDemoAction('resolve_conflict')}
                >
                  🔧 Resolve Conflict
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="demo-content">
        <PolicyDistributionDashboard />
      </div>

      <div className="demo-features">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-time Policy Sync</h3>
            <p>Instant policy distribution and synchronization across all agencies with conflict detection</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Compliance Tracking</h3>
            <p>Comprehensive compliance monitoring with automated scoring and violation tracking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Conflict Resolution</h3>
            <p>AI-powered conflict detection and resolution workflow for contradicting policies</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Distribution</h3>
            <p>Enterprise-grade security with role-based access control and audit trails</p>
          </div>
        </div>
      </div>

      <div className="demo-workflow">
        <h2>Workflow Overview</h2>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h3>Policy Creation</h3>
            <p>Enterprise creates AI policies with compliance requirements</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h3>Distribution</h3>
            <p>Policies are distributed to relevant agencies automatically</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h3>Conflict Detection</h3>
            <p>System detects conflicts between policies from different clients</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <h3>Compliance Monitoring</h3>
            <p>Real-time tracking of agency compliance with policy requirements</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">5</div>
            <h3>Resolution</h3>
            <p>Conflicts are resolved and compliance is maintained</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDistributionDemo; 