import React, { useState, useEffect } from 'react';
import { useDemoStore, demoApiService, demoUtils } from './demo-store';
import { createDemoData } from './demo-data-generator';

// Demo Scenario Selector Component
const DemoScenarioSelector = ({ onScenarioChange }) => {
  const { demoData, currentScenario, switchDemoScenario } = useDemoStore();
  
  const handleScenarioChange = (scenarioId) => {
    switchDemoScenario(scenarioId);
    onScenarioChange?.(scenarioId);
  };
  
  return (
    <div className="demo-scenario-selector">
      <h3>Demo Scenarios</h3>
      <div className="scenario-grid">
        {demoData.pharmaCompanies.map(company => (
          <div
            key={company.id}
            className={`scenario-card ${currentScenario === company.id ? 'active' : ''}`}
            onClick={() => handleScenarioChange(company.id)}
          >
            <div className="scenario-header">
              <h4>{company.name}</h4>
              <span className={`risk-badge risk-${company.riskLevel}`}>
                {company.riskLevel}
              </span>
            </div>
            <div className="scenario-metrics">
              <div className="metric">
                <span className="metric-label">Compliance</span>
                <span className="metric-value">{company.complianceScore}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Agencies</span>
                <span className="metric-value">{company.agencyPartners}</span>
              </div>
              <div className="metric">
                <span className="metric-label">AI Spend</span>
                <span className="metric-value">${(company.monthlyAISpend / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Demo Analytics Dashboard Component
const DemoAnalyticsDashboard = () => {
  const { getDemoAnalytics, demoData } = useDemoStore();
  const analytics = getDemoAnalytics();
  
  if (!analytics) return <div>Loading demo analytics...</div>;
  
  return (
    <div className="demo-analytics-dashboard">
      <div className="analytics-header">
        <h2>Demo Analytics - {analytics.company.name}</h2>
        <p className="analytics-subtitle">Real-time compliance and performance metrics</p>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-card compliance">
          <h3>Compliance Score</h3>
          <div className="score-display">
            <span className="score-value">{analytics.compliance.score}%</span>
            <span className="score-trend">{analytics.compliance.trend}</span>
          </div>
          <div className="risk-indicator">
            Risk Level: <span className={`risk-${analytics.compliance.riskLevel}`}>
              {analytics.compliance.riskLevel}
            </span>
          </div>
        </div>
        
        <div className="analytics-card submissions">
          <h3>Content Submissions</h3>
          <div className="submission-stats">
            <div className="stat">
              <span className="stat-value">{analytics.submissions.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-value">{analytics.submissions.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat">
              <span className="stat-value">{analytics.submissions.approved}</span>
              <span className="stat-label">Approved</span>
            </div>
          </div>
        </div>
        
        <div className="analytics-card savings">
          <h3>Cost Savings</h3>
          <div className="savings-display">
            <span className="savings-amount">{analytics.savings.annual}</span>
            <span className="savings-period">Annual</span>
          </div>
          <p className="savings-breakdown">{analytics.savings.breakdown}</p>
        </div>
        
        <div className="analytics-card agencies">
          <h3>Agency Partners</h3>
          <div className="agency-list">
            {analytics.agencies.map(agency => (
              <div key={agency.id} className="agency-item">
                <span className="agency-name">{agency.name}</span>
                <span className="agency-score">{agency.complianceScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Activity Feed Component
const DemoActivityFeed = () => {
  const { demoInteractions, logDemoInteraction } = useDemoStore();
  
  const generateDemoActivity = () => {
    const activities = [
      {
        type: 'submission_created',
        title: 'New AI Content Submission',
        description: 'Ogilvy Health submitted social media campaign for review',
        icon: '📝'
      },
      {
        type: 'compliance_alert',
        title: 'Potential Compliance Issue Detected',
        description: 'AI-generated content flagged for medical claim review',
        icon: '⚠️'
      },
      {
        type: 'approval_completed',
        title: 'Content Approved',
        description: 'McCann Health medical education content approved',
        icon: '✅'
      },
      {
        type: 'policy_update',
        title: 'AI Policy Updated',
        description: 'Enhanced medical claim detection rules deployed',
        icon: '🔧'
      }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    logDemoInteraction('activity', randomActivity);
  };
  
  return (
    <div className="demo-activity-feed">
      <div className="feed-header">
        <h3>Demo Activity Feed</h3>
        <button 
          className="generate-activity-btn"
          onClick={generateDemoActivity}
        >
          Generate Activity
        </button>
      </div>
      
      <div className="activity-list">
        {demoInteractions
          .filter(interaction => interaction.type === 'activity')
          .slice(-5)
          .reverse()
          .map(interaction => (
            <div key={interaction.id} className="activity-item">
              <div className="activity-icon">{interaction.data.icon}</div>
              <div className="activity-content">
                <h4>{interaction.data.title}</h4>
                <p>{interaction.data.description}</p>
                <span className="activity-time">
                  {new Date(interaction.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Demo Content Generator Component
const DemoContentGenerator = () => {
  const [contentType, setContentType] = useState('social-media');
  const [generatedContent, setGeneratedContent] = useState(null);
  
  const generateContent = () => {
    const content = demoUtils.generateDemoContent(contentType);
    setGeneratedContent(content);
  };
  
  return (
    <div className="demo-content-generator">
      <h3>AI Content Generator</h3>
      
      <div className="content-type-selector">
        <label>Content Type:</label>
        <select 
          value={contentType} 
          onChange={(e) => setContentType(e.target.value)}
        >
          <option value="social-media">Social Media</option>
          <option value="medical-education">Medical Education</option>
          <option value="digital-campaign">Digital Campaign</option>
        </select>
      </div>
      
      <button 
        className="generate-content-btn"
        onClick={generateContent}
      >
        Generate Demo Content
      </button>
      
      {generatedContent && (
        <div className="generated-content">
          <h4>{generatedContent.title}</h4>
          <p>{generatedContent.description}</p>
          <div className="content-details">
            <div className="ai-tools">
              <strong>AI Tools Used:</strong> {generatedContent.aiTools.join(', ')}
            </div>
            <div className="compliance-score">
              <strong>Compliance Score:</strong> {generatedContent.complianceScore}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Demo Integration Component
const DemoIntegration = ({ onScenarioChange }) => {
  const { 
    demoMode, 
    generateDemoSession, 
    demoUser, 
    resetDemoSession,
    startDemoUpdates 
  } = useDemoStore();
  
  const [activeTab, setActiveTab] = useState('analytics');
  
  useEffect(() => {
    // Initialize demo session if not exists
    if (!demoUser) {
      generateDemoSession();
    }
    
    // Start demo updates
    const stopUpdates = startDemoUpdates();
    
    return () => stopUpdates();
  }, [demoUser, generateDemoSession, startDemoUpdates]);
  
  if (!demoMode) {
    return (
      <div className="demo-disabled">
        <h3>Demo Mode Disabled</h3>
        <p>Demo mode is currently disabled. Enable it to see demo scenarios.</p>
      </div>
    );
  }
  
  return (
    <div className="demo-integration">
      <div className="demo-header">
        <h2>🎯 AICOMPLYR Demo</h2>
        <p>Experience realistic pharma compliance scenarios</p>
        
        <div className="demo-controls">
          <button 
            className="reset-demo-btn"
            onClick={resetDemoSession}
          >
            Reset Demo
          </button>
        </div>
      </div>
      
      <DemoScenarioSelector onScenarioChange={onScenarioChange} />
      
      <div className="demo-tabs">
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity Feed
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content Generator
        </button>
      </div>
      
      <div className="demo-content">
        {activeTab === 'analytics' && <DemoAnalyticsDashboard />}
        {activeTab === 'activity' && <DemoActivityFeed />}
        {activeTab === 'content' && <DemoContentGenerator />}
      </div>
    </div>
  );
};

export default DemoIntegration; 