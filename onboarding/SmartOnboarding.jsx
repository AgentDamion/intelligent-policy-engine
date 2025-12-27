import React, { useState, useEffect } from 'react';
import { useDemoStore } from '../demo/demo-store';
import { createDemoData } from '../demo/demo-data-generator';
import './SmartOnboarding.css';

// Import FrameworkSelector - adjust path as needed
// import FrameworkSelector from '../apps/platform/src/components/workspace/FrameworkSelector';

// User Type Selection Component
const UserTypeSelection = ({ onSelect, demoData }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSelect = (type) => {
    setSelectedType(type);
    setTimeout(() => {
      onSelect(type);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AICOMPLYR
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Let's customize your experience based on your role
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
          <span className="text-blue-600 text-sm font-medium">
            🎯 Intelligent Onboarding
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Enterprise Option */}
        <div
          onClick={() => handleSelect('enterprise')}
          className={`border-2 rounded-xl p-8 cursor-pointer transition-all duration-300 ${
            selectedType === 'enterprise' 
              ? 'border-blue-500 shadow-lg bg-blue-50' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🏢</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Pharmaceutical Company
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Govern AI usage across agency partners and ensure regulatory compliance
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 text-left mb-6">
              <div className="text-sm font-semibold text-blue-900 mb-3">You'll be able to:</div>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  Create and distribute AI policies
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  Manage agency partner workspaces
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  Monitor compliance in real-time
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  Generate regulatory reports
                </li>
              </ul>
            </div>

            {/* Demo Preview */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-xs font-medium text-blue-600 mb-2">DEMO PREVIEW</div>
              <div className="text-sm text-gray-700">
                See how <strong>Pfizer</strong> manages {demoData.pharmaCompanies[0].agencyPartners} agency partners
                with {demoData.pharmaCompanies[0].complianceScore}% compliance
              </div>
            </div>
          </div>
        </div>

        {/* Agency Option */}
        <div
          onClick={() => handleSelect('agency')}
          className={`border-2 rounded-xl p-8 cursor-pointer transition-all duration-300 ${
            selectedType === 'agency' 
              ? 'border-green-500 shadow-lg bg-green-50' 
              : 'border-gray-200 hover:border-green-300 hover:shadow-md'
          }`}
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎨</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Agency Partner
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Use AI tools compliantly for pharmaceutical clients
            </p>
            
            <div className="bg-green-50 rounded-lg p-6 text-left mb-6">
              <div className="text-sm font-semibold text-green-900 mb-3">You'll be able to:</div>
              <ul className="text-sm text-green-800 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Submit AI tools for client approval
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Track compliance requirements
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Streamline approval workflows
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Demonstrate compliance capabilities
                </li>
              </ul>
            </div>

            {/* Demo Preview */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-xs font-medium text-green-600 mb-2">DEMO PREVIEW</div>
              <div className="text-sm text-gray-700">
                See how <strong>Ogilvy Health</strong> submits {demoData.agencyScenarios[0].monthlySubmissions} 
                AI-powered campaigns with {demoData.agencyScenarios[0].complianceScore}% approval rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Metrics Preview */}
      <div className="mt-12 bg-white rounded-xl p-8 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Real Results from AICOMPLYR Users
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">80%</div>
            <div className="text-sm text-gray-600">Faster Approvals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
            <div className="text-sm text-gray-600">Risk Reduction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">$127K</div>
            <div className="text-sm text-gray-600">Annual Savings</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onboarding Flow Component
const OnboardingFlow = ({ steps, currentStep, onStepComplete, progress }) => {
  const [stepData, setStepData] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);

  const handleStepComplete = (stepId, data) => {
    setIsCompleting(true);
    setStepData(prev => ({ ...prev, [stepId]: data }));
    
    setTimeout(() => {
      onStepComplete(stepId, data);
      setIsCompleting(false);
    }, 1000);
  };

  const currentStepData = steps[currentStep - 1];
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStepData.title}
                </h2>
                <p className="text-gray-600">
                  {currentStepData.valueDemo}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Estimated time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentStepData.estimatedTime}
                </div>
              </div>
            </div>

            <div className="min-h-[400px]">
              {React.cloneElement(currentStepData.component, {
                onComplete: (data) => handleStepComplete(currentStepData.id, data),
                stepData: stepData[currentStepData.id],
                isCompleting
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enterprise Welcome Step
const EnterpriseWelcomeStep = ({ onComplete }) => {
  const { demoData } = useDemoStore();
  const pfizer = demoData.pharmaCompanies.find(c => c.id === 'pfizer-marketing');

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎯</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Your Enterprise Command Center
        </h3>
        <p className="text-lg text-gray-600 mb-8">
          You're about to experience how leading pharmaceutical companies manage AI compliance
        </p>
      </div>

      {/* Demo Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          See AICOMPLYR in Action
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">{pfizer.agencyPartners}</div>
            <div className="text-sm text-gray-600">Agency Partners</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">{pfizer.complianceScore}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 mb-1">${(pfizer.monthlyAISpend / 1000).toFixed(0)}k</div>
            <div className="text-sm text-gray-600">Monthly AI Spend</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete({ welcomeViewed: true })}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Start Your Setup
      </button>
    </div>
  );
};

// Company Profile Step
const CompanyProfileStep = ({ onComplete }) => {
  const [companyData, setCompanyData] = useState({
    name: '',
    industry: 'pharmaceutical',
    employees: '',
    agencyPartners: ''
  });

  const industries = [
    { value: 'pharmaceutical', label: 'Pharmaceutical', icon: '💊' },
    { value: 'biotech', label: 'Biotechnology', icon: '🧬' },
    { value: 'medical-devices', label: 'Medical Devices', icon: '🏥' },
    { value: 'consumer-health', label: 'Consumer Health', icon: '🛡️' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Tell us about your company
        </h3>
        <p className="text-gray-600">
          We'll customize your experience based on your industry and scale
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={companyData.name}
            onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <div className="grid grid-cols-2 gap-3">
            {industries.map(industry => (
              <div
                key={industry.value}
                onClick={() => setCompanyData(prev => ({ ...prev, industry: industry.value }))}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  companyData.industry === industry.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{industry.icon}</div>
                  <div className="text-sm font-medium">{industry.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Employees
            </label>
            <input
              type="number"
              value={companyData.employees}
              onChange={(e) => setCompanyData(prev => ({ ...prev, employees: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agency Partners
            </label>
            <input
              type="number"
              value={companyData.agencyPartners}
              onChange={(e) => setCompanyData(prev => ({ ...prev, agencyPartners: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 8"
            />
          </div>
        </div>

        <button
          onClick={() => onComplete(companyData)}
          disabled={!companyData.name}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue Setup
        </button>
      </div>
    </div>
  );
};

// First Policy Wizard
const FirstPolicyWizard = ({ onComplete }) => {
  const [policyData, setPolicyData] = useState({
    name: '',
    type: 'social-media',
    description: ''
  });

  const policyTypes = [
    { value: 'social-media', label: 'Social Media', icon: '📱' },
    { value: 'medical-education', label: 'Medical Education', icon: '📚' },
    { value: 'digital-campaign', label: 'Digital Campaign', icon: '🎯' },
    { value: 'data-privacy', label: 'Data Privacy', icon: '🔒' }
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPolicy, setGeneratedPolicy] = useState(null);

  const generatePolicy = async () => {
    setIsGenerating(true);
    // Simulate AI policy generation
    setTimeout(() => {
      setGeneratedPolicy({
        name: `${policyData.name} AI Policy`,
        content: `This policy outlines the requirements and procedures for ${policyData.type} compliance using AI tools...`,
        rules: [
          'All AI-generated content must be reviewed before publication',
          'Medical claims require additional verification',
          'Data privacy requirements must be followed',
          'Regular compliance audits are mandatory'
        ],
        status: 'draft',
        generatedAt: new Date().toISOString()
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Create Your First AI Policy
        </h3>
        <p className="text-gray-600">
          Our AI will generate a comprehensive policy based on your requirements
        </p>
      </div>

      {!generatedPolicy ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Name
            </label>
            <input
              type="text"
              value={policyData.name}
              onChange={(e) => setPolicyData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Social Media AI Guidelines"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {policyTypes.map(type => (
                <div
                  key={type.value}
                  onClick={() => setPolicyData(prev => ({ ...prev, type: type.value }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    policyData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={policyData.description}
              onChange={(e) => setPolicyData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your policy requirements..."
            />
          </div>

          <button
            onClick={generatePolicy}
            disabled={!policyData.name || isGenerating}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Policy...' : 'Generate AI Policy'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">✅</span>
              <h4 className="text-lg font-semibold text-green-900">Policy Generated Successfully!</h4>
            </div>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">{generatedPolicy.name}</h5>
                <p className="text-sm text-gray-600">{generatedPolicy.content}</p>
              </div>
              <div>
                <h6 className="font-medium text-gray-900 mb-2">Key Rules:</h6>
                <ul className="text-sm text-gray-600 space-y-1">
                  {generatedPolicy.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => onComplete(generatedPolicy)}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Continue to Agency Setup
          </button>
        </div>
      )}
    </div>
  );
};

// Agency Invitation Wizard
const AgencyInvitationWizard = ({ onComplete }) => {
  const [invitations, setInvitations] = useState([]);
  const [newAgency, setNewAgency] = useState({
    name: '',
    email: '',
    role: 'creative'
  });

  const addAgency = () => {
    if (newAgency.name && newAgency.email) {
      setInvitations(prev => [...prev, { ...newAgency, id: Date.now() }]);
      setNewAgency({ name: '', email: '', role: 'creative' });
    }
  };

  const removeAgency = (id) => {
    setInvitations(prev => prev.filter(agency => agency.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Invite Your Agency Partners
        </h3>
        <p className="text-gray-600">
          Each agency will get their own workspace with your compliance requirements
        </p>
      </div>

      <div className="space-y-6">
        {/* Add Agency Form */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Add Agency Partner</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Agency Name"
              value={newAgency.name}
              onChange={(e) => setNewAgency(prev => ({ ...prev, name: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newAgency.email}
              onChange={(e) => setNewAgency(prev => ({ ...prev, email: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newAgency.role}
              onChange={(e) => setNewAgency(prev => ({ ...prev, role: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="creative">Creative Agency</option>
              <option value="medical">Medical Communications</option>
              <option value="digital">Digital Agency</option>
              <option value="pr">PR Agency</option>
            </select>
          </div>
          <button
            onClick={addAgency}
            disabled={!newAgency.name || !newAgency.email}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Agency
          </button>
        </div>

        {/* Agency List */}
        {invitations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Agencies to Invite ({invitations.length})</h4>
            <div className="space-y-3">
              {invitations.map(agency => (
                <div key={agency.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                  <div>
                    <div className="font-medium text-gray-900">{agency.name}</div>
                    <div className="text-sm text-gray-600">{agency.email}</div>
                    <div className="text-xs text-blue-600 capitalize">{agency.role} Agency</div>
                  </div>
                  <button
                    onClick={() => removeAgency(agency.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onComplete({ invitations })}
          disabled={invitations.length === 0}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {invitations.length === 0 ? 'Add at least one agency' : `Send ${invitations.length} Invitation${invitations.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};

// Dashboard Overview Tour
const DashboardOverviewTour = ({ onComplete }) => {
  const { demoData } = useDemoStore();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: 'Real-time Compliance Monitoring',
      description: 'Track compliance scores across all agency partners',
      icon: '📊',
      metric: '94%',
      label: 'Overall Compliance'
    },
    {
      title: 'Agency Partner Management',
      description: 'Manage workspaces and permissions for each partner',
      icon: '👥',
      metric: '12',
      label: 'Active Agencies'
    },
    {
      title: 'AI Policy Distribution',
      description: 'Automatically distribute policies to all partners',
      icon: '📋',
      metric: '5',
      label: 'Active Policies'
    },
    {
      title: 'Risk Incident Tracking',
      description: 'Monitor and resolve compliance issues quickly',
      icon: '⚠️',
      metric: '0',
      label: 'Open Issues'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Your Enterprise Command Center
        </h3>
        <p className="text-gray-600">
          Here's what you'll be able to monitor and manage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg border-2 transition-all ${
              index === currentFeature
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-4">{feature.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{feature.metric}</div>
              <div className="text-sm text-gray-600">{feature.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Ready to Get Started?</h4>
        <p className="text-gray-600 mb-6">
          Your setup is complete! You can now start managing AI compliance across your agency partners.
        </p>
        <button
          onClick={() => onComplete({ dashboardViewed: true })}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Launch Dashboard
        </button>
      </div>
    </div>
  );
};

// Main Smart Onboarding Component
export const SmartOnboarding = () => {
  const [userType, setUserType] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingProgress, setOnboardingProgress] = useState({
    profileComplete: false,
    firstPolicyCreated: false,
    firstAgencyInvited: false,
    firstSubmissionMade: false,
    dashboardViewed: false
  });

  const { demoData } = useDemoStore();

  // Adaptive onboarding based on user type
  const enterpriseOnboarding = [
    {
      id: 'welcome',
      title: 'Welcome to AICOMPLYR',
      component: <EnterpriseWelcomeStep />,
      valueDemo: 'See how Pfizer manages 12 agency partners',
      estimatedTime: '2 min'
    },
    {
      id: 'quick-setup',
      title: 'Quick Company Setup',
      component: <CompanyProfileStep />,
      valueDemo: 'Auto-configure based on your industry',
      estimatedTime: '3 min'
    },
    {
      id: 'regulatory-frameworks',
      title: 'Configure Regulatory Frameworks',
      component: <RegulatoryFrameworkStep workspaceId="current-workspace" />,
      valueDemo: 'Select frameworks that apply to your operations',
      estimatedTime: '3 min'
    },
    {
      id: 'first-policy',
      title: 'Create Your First Policy',
      component: <FirstPolicyWizard />,
      valueDemo: 'AI generates policy in 60 seconds',
      estimatedTime: '5 min'
    },
    {
      id: 'invite-agencies',
      title: 'Invite Agency Partners',
      component: <AgencyInvitationWizard />,
      valueDemo: 'Each agency gets their own workspace',
      estimatedTime: '3 min'
    },
    {
      id: 'dashboard-tour',
      title: 'Your Command Center',
      component: <DashboardOverviewTour />,
      valueDemo: 'Real-time compliance across all partners',
      estimatedTime: '4 min'
    }
  ];

  const agencyOnboarding = [
    {
      id: 'welcome',
      title: 'Welcome to Your Client Workspace',
      component: <EnterpriseWelcomeStep />, // Reuse for now
      valueDemo: 'See how agencies submit AI tools for approval',
      estimatedTime: '2 min'
    },
    {
      id: 'understand-requirements',
      title: 'Client Requirements Overview',
      component: <CompanyProfileStep />, // Reuse for now
      valueDemo: 'Clear compliance requirements, no guesswork',
      estimatedTime: '3 min'
    },
    {
      id: 'submit-tools',
      title: 'Submit Your AI Tools',
      component: <FirstPolicyWizard />, // Reuse for now
      valueDemo: 'Streamlined approval process',
      estimatedTime: '5 min'
    },
    {
      id: 'workflow-integration',
      title: 'Integrate with Your Workflow',
      component: <DashboardOverviewTour />, // Reuse for now
      valueDemo: 'Fits into existing creative processes',
      estimatedTime: '4 min'
    }
  ];

  const handleStepComplete = (stepId, data) => {
    setOnboardingProgress(prev => ({
      ...prev,
      [stepId]: true
    }));
    
    if (currentStep < (userType === 'enterprise' ? enterpriseOnboarding.length : agencyOnboarding.length)) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Onboarding complete
      console.log('Onboarding completed:', { userType, progress: onboardingProgress, data });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* User Type Detection */}
      {!userType && (
        <UserTypeSelection 
          onSelect={setUserType}
          demoData={demoData}
        />
      )}

      {/* Adaptive Onboarding Flow */}
      {userType && (
        <OnboardingFlow
          steps={userType === 'enterprise' ? enterpriseOnboarding : agencyOnboarding}
          currentStep={currentStep}
          onStepComplete={handleStepComplete}
          progress={onboardingProgress}
        />
      )}
    </div>
  );
}; 