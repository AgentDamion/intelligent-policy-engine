import React, { useState, useEffect } from 'react';
import { useContextStore } from '../stores/contextStore';
import { contextApi } from '../services/contextApi';
import PolicyConflictDetector from './PolicyConflictDetector';
import PolicyRefinementInterface from './PolicyRefinementInterface';
import PolicyReviewAndDeploy from './PolicyReviewAndDeploy';
import './AIPolicyBuilder.css';

// Policy Refinement Interface Component
const PolicyRefinementInterface = ({ policy, onRefine, onNext, onBack }) => {
  const [refinedPolicy, setRefinedPolicy] = useState(policy);
  const [isValidating, setIsValidating] = useState(false);

  const handleRefinement = (field, value) => {
    setRefinedPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValidation = async () => {
    setIsValidating(true);
    try {
      const validation = await contextApi.validateAIPolicy(refinedPolicy);
      if (validation.isValid) {
        onRefine(refinedPolicy);
        onNext();
      } else {
        // Handle validation errors
        console.error('Policy validation failed:', validation.errors);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="policy-refinement">
      <div className="refinement-header">
        <h2 className="refinement-title">Refine Your AI Policy</h2>
        <p className="refinement-subtitle">
          Review and customize the AI-generated policy before deployment
        </p>
      </div>

      <div className="refinement-content">
        {/* Policy Sections */}
        <div className="policy-sections">
          <div className="policy-section">
            <h3 className="section-title">Policy Overview</h3>
            <div className="form-group">
              <label className="form-label">Policy Name</label>
              <input
                type="text"
                value={refinedPolicy.name}
                onChange={(e) => handleRefinement('name', e.target.value)}
                className="form-input"
                placeholder="Enter policy name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={refinedPolicy.description}
                onChange={(e) => handleRefinement('description', e.target.value)}
                className="form-textarea"
                rows={3}
                placeholder="Describe the policy purpose and scope"
              />
            </div>
          </div>

          <div className="policy-section">
            <h3 className="section-title">AI Usage Rules</h3>
            <div className="rules-list">
              {refinedPolicy.rules?.map((rule, index) => (
                <div key={index} className="rule-item">
                  <div className="rule-header">
                    <span className="rule-number">{index + 1}</span>
                    <button
                      onClick={() => {
                        const newRules = refinedPolicy.rules.filter((_, i) => i !== index);
                        handleRefinement('rules', newRules);
                      }}
                      className="remove-rule-btn"
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...refinedPolicy.rules];
                      newRules[index] = e.target.value;
                      handleRefinement('rules', newRules);
                    }}
                    className="rule-textarea"
                    rows={2}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newRules = [...(refinedPolicy.rules || []), ''];
                  handleRefinement('rules', newRules);
                }}
                className="add-rule-btn"
              >
                + Add Rule
              </button>
            </div>
          </div>

          <div className="policy-section">
            <h3 className="section-title">Compliance Requirements</h3>
            <div className="compliance-grid">
              {refinedPolicy.compliance?.map((req, index) => (
                <div key={index} className="compliance-item">
                  <div className="compliance-header">
                    <span className="compliance-type">{req.type}</span>
                    <span className="compliance-priority">{req.priority}</span>
                  </div>
                  <p className="compliance-description">{req.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="policy-section">
            <h3 className="section-title">Approval Workflow</h3>
            <div className="workflow-settings">
              <div className="form-group">
                <label className="form-label">Required Approvers</label>
                <div className="approver-list">
                  {refinedPolicy.approvers?.map((approver, index) => (
                    <div key={index} className="approver-item">
                      <input
                        type="text"
                        value={approver}
                        onChange={(e) => {
                          const newApprovers = [...refinedPolicy.approvers];
                          newApprovers[index] = e.target.value;
                          handleRefinement('approvers', newApprovers);
                        }}
                        className="approver-input"
                        placeholder="approver@company.com"
                      />
                      <button
                        onClick={() => {
                          const newApprovers = refinedPolicy.approvers.filter((_, i) => i !== index);
                          handleRefinement('approvers', newApprovers);
                        }}
                        className="remove-approver-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newApprovers = [...(refinedPolicy.approvers || []), ''];
                      handleRefinement('approvers', newApprovers);
                    }}
                    className="add-approver-btn"
                  >
                    + Add Approver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="refinement-navigation">
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          <button
            onClick={handleValidation}
            disabled={isValidating}
            className="btn-primary"
          >
            {isValidating ? (
              <>
                <div className="loading-spinner-small"></div>
                Validating...
              </>
            ) : (
              'Continue to Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Policy Review and Deploy Component
const PolicyReviewAndDeploy = ({ policy, onDeploy, onBack }) => {
  const [deploymentSettings, setDeploymentSettings] = useState({
    autoDeploy: false,
    notifySeats: true,
    scheduleDeployment: false,
    deploymentDate: null
  });
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await onDeploy({ policy, settings: deploymentSettings });
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="policy-review">
      <div className="review-header">
        <h2 className="review-title">Review & Deploy Policy</h2>
        <p className="review-subtitle">
          Final review before deploying your AI policy across all seats
        </p>
      </div>

      <div className="review-content">
        {/* Policy Summary */}
        <div className="policy-summary">
          <h3 className="summary-title">Policy Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Name:</span>
              <span className="summary-value">{policy.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Type:</span>
              <span className="summary-value">{policy.type}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Risk Level:</span>
              <span className="summary-value">{policy.riskLevel}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rules:</span>
              <span className="summary-value">{policy.rules?.length || 0} rules</span>
            </div>
          </div>
        </div>

        {/* Deployment Settings */}
        <div className="deployment-settings">
          <h3 className="settings-title">Deployment Settings</h3>
          <div className="settings-grid">
            <label className="setting-item">
              <input
                type="checkbox"
                checked={deploymentSettings.autoDeploy}
                onChange={(e) => setDeploymentSettings({
                  ...deploymentSettings,
                  autoDeploy: e.target.checked
                })}
              />
              <span>Auto-deploy to all seats</span>
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={deploymentSettings.notifySeats}
                onChange={(e) => setDeploymentSettings({
                  ...deploymentSettings,
                  notifySeats: e.target.checked
                })}
              />
              <span>Notify seat administrators</span>
            </label>
            <label className="setting-item">
              <input
                type="checkbox"
                checked={deploymentSettings.scheduleDeployment}
                onChange={(e) => setDeploymentSettings({
                  ...deploymentSettings,
                  scheduleDeployment: e.target.checked
                })}
              />
              <span>Schedule deployment for later</span>
            </label>
          </div>
        </div>

        {/* Conflict Detection */}
        <div className="conflict-detection">
          <PolicyConflictDetector
            newPolicy={policy}
            existingPolicies={[]} // This would be loaded from context
          />
        </div>

        {/* Navigation */}
        <div className="review-navigation">
          <button onClick={onBack} className="btn-secondary">
            ← Back to Refinement
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="btn-primary"
          >
            {isDeploying ? (
              <>
                <div className="loading-spinner-small"></div>
                Deploying...
              </>
            ) : (
              'Deploy Policy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main AI Policy Builder Component
export const AIPolicyBuilder = () => {
  const { currentContext } = useContextStore();
  const [buildStep, setBuildStep] = useState('intent');
  const [policyIntent, setPolicyIntent] = useState({
    useCase: '',
    regulation: '',
    riskLevel: '',
    customRequirements: ''
  });
  const [generatedPolicy, setGeneratedPolicy] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const useCaseTemplates = [
    {
      id: 'social_media',
      title: 'Social Media Content',
      description: 'AI-generated social posts, captions, and community management',
      commonRules: ['Human review required', 'Medical claims prohibited', 'Disclosure requirements']
    },
    {
      id: 'content_generation',
      title: 'Marketing Content',
      description: 'Blog posts, articles, email campaigns, and educational materials',
      commonRules: ['MLR approval required', 'Source citation mandatory', 'Fact checking protocol']
    },
    {
      id: 'image_creation',
      title: 'Visual Content',
      description: 'AI-generated images, graphics, and visual designs',
      commonRules: ['No medical imagery', 'Brand compliance check', 'Copyright verification']
    },
    {
      id: 'custom',
      title: 'Custom Use Case',
      description: 'Define your own specific AI use case and requirements',
      commonRules: []
    }
  ];

  const handleGeneratePolicy = async () => {
    setIsGenerating(true);
    try {
      const response = await contextApi.generatePolicyWithAI({
        useCase: policyIntent.useCase,
        regulation: policyIntent.regulation,
        riskLevel: policyIntent.riskLevel,
        customRequirements: policyIntent.customRequirements,
        enterpriseContext: currentContext
      });
      setGeneratedPolicy(response.policy);
      setBuildStep('refinement');
    } catch (error) {
      console.error('Policy generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeployPolicy = async (deploymentData) => {
    try {
      // Submit policy for approval
      const approvalResult = await contextApi.submitPolicyForApproval(
        deploymentData.policy.id,
        {
          approvers: deploymentData.policy.approvers,
          deploymentSettings: deploymentData.settings
        }
      );

      // Handle deployment based on approval workflow
      if (approvalResult.requiresApproval) {
        // Show approval pending message
        console.log('Policy submitted for approval');
      } else {
        // Auto-deploy if no approval required
        console.log('Policy deployed successfully');
      }
    } catch (error) {
      console.error('Policy deployment failed:', error);
    }
  };

  return (
    <div className="ai-policy-builder">
      {/* Step 1: Define Intent */}
      {buildStep === 'intent' && (
        <div className="intent-step">
          <div className="intent-header">
            <div className="intent-icon">🤖</div>
            <h1 className="intent-title">AI Policy Builder</h1>
            <p className="intent-subtitle">
              Tell us about your AI use case and we'll generate a compliant policy
            </p>
          </div>

          {/* Use Case Selection */}
          <div className="use-case-selection">
            <label className="section-label">
              What type of AI usage do you need to govern?
            </label>
            <div className="use-case-grid">
              {useCaseTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setPolicyIntent({...policyIntent, useCase: template.id})}
                  className={`use-case-card ${
                    policyIntent.useCase === template.id ? 'selected' : ''
                  }`}
                >
                  <h3 className="use-case-title">{template.title}</h3>
                  <p className="use-case-description">{template.description}</p>
                  <div className="use-case-rules">
                    {template.commonRules.map(rule => (
                      <span key={rule} className="rule-tag">
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Framework */}
          <div className="regulatory-selection">
            <label className="section-label">
              Which regulatory frameworks apply?
            </label>
            <div className="regulatory-grid">
              {['FDA', 'EMA', 'GDPR', 'CCPA', 'HIPAA', 'SOX', 'Custom'].map(reg => (
                <label key={reg} className="regulatory-item">
                  <input
                    type="checkbox"
                    checked={policyIntent.regulation.includes(reg)}
                    onChange={(e) => {
                      const regs = policyIntent.regulation.split(',').filter(r => r);
                      if (e.target.checked) {
                        regs.push(reg);
                      } else {
                        const index = regs.indexOf(reg);
                        if (index > -1) regs.splice(index, 1);
                      }
                      setPolicyIntent({...policyIntent, regulation: regs.join(',')});
                    }}
                    className="regulatory-checkbox"
                  />
                  <span className="regulatory-label">{reg}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Level */}
          <div className="risk-selection">
            <label className="section-label">
              What's the risk level for this AI usage?
            </label>
            <div className="risk-grid">
              {[
                { value: 'low', label: 'Low Risk', desc: 'Internal tools, non-public content' },
                { value: 'medium', label: 'Medium Risk', desc: 'External content, marketing materials' },
                { value: 'high', label: 'High Risk', desc: 'Medical claims, regulatory submissions' }
              ].map(risk => (
                <div
                  key={risk.value}
                  onClick={() => setPolicyIntent({...policyIntent, riskLevel: risk.value})}
                  className={`risk-card ${
                    policyIntent.riskLevel === risk.value ? 'selected' : ''
                  }`}
                >
                  <h4 className="risk-label">{risk.label}</h4>
                  <p className="risk-description">{risk.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Requirements */}
          <div className="custom-requirements">
            <label className="section-label">
              Any specific requirements or constraints?
            </label>
            <textarea
              value={policyIntent.customRequirements}
              onChange={(e) => setPolicyIntent({...policyIntent, customRequirements: e.target.value})}
              placeholder="e.g., 'All image content must include medical disclaimers', 'Content requires legal review for specific brands', 'Integration with existing MLR workflow required'"
              className="requirements-textarea"
              rows={4}
            />
          </div>

          <button
            onClick={handleGeneratePolicy}
            disabled={!policyIntent.useCase || !policyIntent.regulation || !policyIntent.riskLevel || isGenerating}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                Generating AI Policy...
              </>
            ) : (
              <>
                <span className="generate-icon">🤖</span>
                Generate AI Policy
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Refinement */}
      {buildStep === 'refinement' && generatedPolicy && (
        <PolicyRefinementInterface 
          policy={generatedPolicy}
          onRefine={setGeneratedPolicy}
          onNext={() => setBuildStep('review')}
          onBack={() => setBuildStep('intent')}
        />
      )}

      {/* Step 3: Review & Deploy */}
      {buildStep === 'review' && generatedPolicy && (
        <PolicyReviewAndDeploy 
          policy={generatedPolicy}
          onDeploy={handleDeployPolicy}
          onBack={() => setBuildStep('refinement')}
        />
      )}
    </div>
  );
};

export default AIPolicyBuilder; 