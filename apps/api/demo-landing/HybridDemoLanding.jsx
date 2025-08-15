import React, { useState, useEffect } from 'react';
import { useDemoLandingStore, demoAnalytics } from './DemoLandingStore';
import './DemoLanding.css';

// Scenario Selection Step
const ScenarioSelectionStep = ({ scenarios, onSelect }) => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario.id);
    setTimeout(() => {
      onSelect(scenario.id);
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Experience AICOMPLYR in Action
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose a scenario that matches your business and see how AICOMPLYR transforms AI compliance
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
          <span className="text-blue-600 text-sm font-medium">
            🎯 Zero-Friction Demo Experience
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => handleScenarioSelect(scenario)}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
              selectedScenario === scenario.id
                ? 'border-blue-500 shadow-lg bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {scenario.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                {scenario.description}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm font-medium text-gray-900 mb-2">Key Metrics:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Agency Seats:</span>
                    <div className="font-semibold">{scenario.metrics.agencySeats}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Submissions:</span>
                    <div className="font-semibold">{scenario.metrics.monthlySubmissions}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Compliance Score:</span>
                    <div className="font-semibold">{scenario.metrics.complianceScore}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Level:</span>
                    <div className="font-semibold capitalize">{scenario.metrics.riskLevel}</div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <div className="font-medium mb-1">Perfect for:</div>
                <div>{scenario.perfectFor}</div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-medium text-green-900">
                  Potential Annual Savings:
                </div>
                <div className="text-lg font-bold text-green-600">
                  ${(scenario.estimatedROI / 1000).toFixed(0)}K
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Each scenario is based on real customer data and demonstrates actual ROI potential
        </p>
      </div>
    </div>
  );
};

// Smart ROI Calculator with context capture
const SmartROICalculator = ({ selectedScenario, onComplete }) => {
  const { captureProspectData, demoAnalytics } = useDemoLandingStore();
  const [inputs, setInputs] = useState({
    companySize: selectedScenario?.metrics.agencySeats > 30 ? 'enterprise' : 'large',
    agencyPartners: Math.round(selectedScenario?.metrics.agencySeats / 3) || 8,
    currentApprovalTime: 12,
    complianceIssues: 8,
    adminHoursPerWeek: 30
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [roiResult, setRoiResult] = useState(null);

  const calculateROI = async () => {
    setIsCalculating(true);
    
    // Enhanced ROI calculation using scenario data
    const baseROI = {
      timeSavings: (inputs.currentApprovalTime - 2) * inputs.agencyPartners * 4 * 1500, // $1500 per approval
      adminSavings: (inputs.adminHoursPerWeek - 8) * 52 * 75, // $75/hour
      incidentPrevention: inputs.complianceIssues * 0.8 * 15000 // $15K per incident
    };

    const totalSavings = Object.values(baseROI).reduce((sum, val) => sum + val, 0);
    const aicomplyrCost = inputs.agencyPartners * 3 * 75 * 12; // $75/seat/month

    const roiData = {
      ...baseROI,
      totalSavings,
      investment: aicomplyrCost,
      netROI: totalSavings - aicomplyrCost,
      roiPercentage: ((totalSavings - aicomplyrCost) / aicomplyrCost * 100),
      paybackMonths: Math.ceil(aicomplyrCost / (totalSavings / 12)),
      inputs
    };

    // Capture prospect data for onboarding
    captureProspectData({
      companySize: inputs.companySize,
      agencyPartners: inputs.agencyPartners,
      currentProcess: 'manual-approval',
      painPoints: ['slow-approvals', 'compliance-risk', 'admin-overhead']
    });

    // Track ROI calculation
    demoAnalytics.trackROICalculation(roiData);

    setTimeout(() => {
      setRoiResult(roiData);
      setIsCalculating(false);
    }, 2000);
  };

  const handleContinue = () => {
    onComplete(roiResult);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Calculate Your ROI with {selectedScenario?.title}
        </h2>
        <p className="text-lg text-gray-600">
          Based on {selectedScenario?.title}'s profile, let's estimate your potential savings
        </p>
      </div>

      {!roiResult ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agency Partners
              </label>
              <input
                type="number"
                value={inputs.agencyPartners}
                onChange={(e) => setInputs({...inputs, agencyPartners: parseInt(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedScenario?.title} manages {Math.round(selectedScenario?.metrics.agencySeats / 3)} partners
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Approval Time (days)
              </label>
              <input
                type="number"
                value={inputs.currentApprovalTime}
                onChange={(e) => setInputs({...inputs, currentApprovalTime: parseInt(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Industry average: 10-15 days
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compliance Issues per Year
              </label>
              <input
                type="number"
                value={inputs.complianceIssues}
                onChange={(e) => setInputs({...inputs, complianceIssues: parseInt(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Hours per Week
              </label>
              <input
                type="number"
                value={inputs.adminHoursPerWeek}
                onChange={(e) => setInputs({...inputs, adminHoursPerWeek: parseInt(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="5"
                max="60"
              />
            </div>
          </div>

          <button
            onClick={calculateROI}
            disabled={isCalculating}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Calculating Your ROI...
              </div>
            ) : (
              'Calculate My ROI'
            )}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Your Potential Annual Savings
            </h3>
            <div className="text-4xl font-bold text-green-600 mb-4">
              ${roiResult.netROI.toLocaleString()}
            </div>
            <p className="text-green-700">
              {roiResult.roiPercentage.toFixed(0)}% ROI • {roiResult.paybackMonths} month payback
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Time Savings</div>
              <div className="text-lg font-bold text-blue-600">
                ${roiResult.timeSavings.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Admin Savings</div>
              <div className="text-lg font-bold text-green-600">
                ${roiResult.adminSavings.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Risk Prevention</div>
              <div className="text-lg font-bold text-purple-600">
                ${roiResult.incidentPrevention.toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to Interactive Demo
          </button>
        </div>
      )}
    </div>
  );
};

// Guided demo exploration with feature tracking
const GuidedDemoExploration = ({ scenario, roiData, onComplete }) => {
  const { trackFeatureExploration } = useDemoLandingStore();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [completedFeatures, setCompletedFeatures] = useState([]);

  const demoFeatures = [
    {
      id: 'seat-management',
      title: 'Agency Seat Management',
      description: 'See how you\'d manage all your agency partners in one place',
      component: <SeatManagementDemo scenario={scenario} />,
      estimatedTime: '2 min'
    },
    {
      id: 'policy-builder',
      title: 'AI Policy Builder',
      description: 'Generate compliant policies in 60 seconds',
      component: <PolicyBuilderDemo scenario={scenario} />,
      estimatedTime: '2 min'
    },
    {
      id: 'compliance-dashboard',
      title: 'Compliance Dashboard',
      description: 'Real-time monitoring across all partners',
      component: <ComplianceDashboardDemo scenario={scenario} />,
      estimatedTime: '1 min'
    }
  ];

  const handleFeatureComplete = (featureId) => {
    trackFeatureExploration(featureId);
    setCompletedFeatures([...completedFeatures, featureId]);
    
    if (currentFeature < demoFeatures.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {/* Demo Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Interactive Demo: {scenario}
          </h2>
          <div className="text-sm text-gray-500">
            Feature {currentFeature + 1} of {demoFeatures.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentFeature + 1) / demoFeatures.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ROI Reminder */}
      {roiData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <span className="font-semibold text-green-900">
                Your Potential: ${roiData.netROI.toLocaleString()} annual savings
              </span>
              <span className="text-green-700 ml-2">
                ({roiData.roiPercentage.toFixed(0)}% ROI)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current Feature Demo */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {demoFeatures[currentFeature].title}
          </h3>
          <p className="text-gray-600">
            {demoFeatures[currentFeature].description}
          </p>
        </div>

        {demoFeatures[currentFeature].component}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => currentFeature > 0 && setCurrentFeature(currentFeature - 1)}
            disabled={currentFeature === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          
          <button
            onClick={() => handleFeatureComplete(demoFeatures[currentFeature].id)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentFeature === demoFeatures.length - 1 ? 'Complete Demo' : 'Next Feature'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo feature components
const SeatManagementDemo = ({ scenario }) => (
  <div className="bg-gray-50 rounded-lg p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">Active Agencies</div>
        <div className="text-2xl font-bold text-blue-600">12</div>
        <div className="text-xs text-gray-500">Managing content</div>
      </div>
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">Total Seats</div>
        <div className="text-2xl font-bold text-green-600">36</div>
        <div className="text-xs text-gray-500">Active users</div>
      </div>
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">This Month</div>
        <div className="text-2xl font-bold text-purple-600">247</div>
        <div className="text-xs text-gray-500">Submissions</div>
      </div>
    </div>
  </div>
);

const PolicyBuilderDemo = ({ scenario }) => (
  <div className="bg-gray-50 rounded-lg p-6">
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">AI Policy Generator</div>
        <div className="text-lg font-semibold text-blue-600">Social Media Compliance Policy</div>
        <div className="text-xs text-gray-500 mt-1">Generated in 60 seconds</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-sm font-medium text-green-900">Key Rules Generated:</div>
        <ul className="text-sm text-green-800 mt-2 space-y-1">
          <li>• All AI-generated content must be reviewed</li>
          <li>• Medical claims require additional verification</li>
          <li>• Data privacy requirements must be followed</li>
        </ul>
      </div>
    </div>
  </div>
);

const ComplianceDashboardDemo = ({ scenario }) => (
  <div className="bg-gray-50 rounded-lg p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">Overall Compliance</div>
        <div className="text-2xl font-bold text-green-600">94%</div>
        <div className="text-xs text-gray-500">+15% this month</div>
      </div>
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">Risk Incidents</div>
        <div className="text-2xl font-bold text-red-600">0</div>
        <div className="text-xs text-gray-500">This month</div>
      </div>
    </div>
  </div>
);

// Qualified signup form with demo context
const QualifiedSignupForm = ({ demoContext, roiData, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    agencyPartners: demoContext.prospectData?.agencyPartners || '',
    primaryChallenge: '',
    timeframe: 'immediate'
  });

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-gray-600">
          Based on your demo exploration, you could save ${roiData?.netROI.toLocaleString()} annually
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="email"
            placeholder="Business Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="Company"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            placeholder="Job Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          onClick={() => onSubmit(formData)}
          className="w-full mt-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start My Free Trial
        </button>
      </div>
    </div>
  );
};

// Main hybrid demo landing component
export const HybridDemoLanding = () => {
  const { 
    demoData, 
    startDemoSession, 
    trackFeatureExploration, 
    captureROIData,
    generateOnboardingContext,
    demoAnalytics
  } = useDemoLandingStore();
  
  const [currentStep, setCurrentStep] = useState('scenario-selection');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [showSignupForm, setShowSignupForm] = useState(false);

  const scenarios = demoData.pharmaCompanies.map(company => ({
    id: company.id,
    title: company.name,
    industry: company.industry,
    description: `${company.agencyPartners} agency partners, $${Math.round(company.monthlyAISpend/1000)}K monthly AI spend`,
    metrics: {
      agencySeats: company.agencyPartners * 3,
      monthlySubmissions: Math.round(company.monthlyAISpend / 1000),
      complianceScore: company.complianceScore,
      riskLevel: company.riskLevel
    },
    perfectFor: company.industry === 'Consumer Health' ? 
      'Consumer health brands with digital-first marketing' :
      'Enterprise pharma companies with complex agency ecosystems',
    estimatedROI: company.monthlyAISpend * 0.6 // 60% potential savings
  }));

  const handleScenarioSelect = (scenarioId) => {
    setSelectedScenario(scenarioId);
    startDemoSession(scenarioId);
    demoAnalytics.trackDemoStart(scenarioId);
    setCurrentStep('roi-calculation');
  };

  const handleROIComplete = (calculatedROI) => {
    setRoiData(calculatedROI);
    captureROIData(calculatedROI);
    setCurrentStep('demo-exploration');
  };

  const handleDemoComplete = () => {
    setCurrentStep('qualified-signup');
    setShowSignupForm(true);
  };

  const handleSignupSubmit = (signupData) => {
    const onboardingContext = generateOnboardingContext();
    
    // Store context for onboarding handoff
    localStorage.setItem('aicomplyr-onboarding-context', JSON.stringify({
      ...onboardingContext,
      signupData
    }));
    
    // Track signup conversion
    demoAnalytics.trackSignupConversion(onboardingContext.demoContext, signupData);
    
    // Redirect to onboarding with context
    window.location.href = '/onboarding?context=demo-handoff';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Step-based demo flow */}
      {currentStep === 'scenario-selection' && (
        <ScenarioSelectionStep
          scenarios={scenarios}
          onSelect={handleScenarioSelect}
        />
      )}

      {currentStep === 'roi-calculation' && (
        <SmartROICalculator
          selectedScenario={scenarios.find(s => s.id === selectedScenario)}
          onComplete={handleROIComplete}
        />
      )}

      {currentStep === 'demo-exploration' && (
        <GuidedDemoExploration
          scenario={selectedScenario}
          roiData={roiData}
          onComplete={handleDemoComplete}
        />
      )}

      {currentStep === 'qualified-signup' && (
        <QualifiedSignupForm
          demoContext={useDemoLandingStore.getState().demoSession}
          roiData={roiData}
          onSubmit={handleSignupSubmit}
        />
      )}
    </div>
  );
}; 