import React, { useState, useEffect } from 'react';
import { useDemoStore } from '../demo/demo-store';
import { useDemoLandingStore } from '../demo-landing/DemoLandingStore';
import './EnhancedOnboarding.css';

// Enhanced onboarding store with demo context
export const useEnhancedOnboardingStore = create((set, get) => ({
  // Existing onboarding state
  userType: null,
  currentStep: 1,
  onboardingProgress: {
    profileComplete: false,
    firstPolicyCreated: false,
    firstAgencyInvited: false,
    firstSubmissionMade: false,
    dashboardViewed: false
  },

  // Demo context integration
  demoContext: null,
  onboardingMode: 'standard', // 'standard', 'demo-handoff', 'express-setup'
  prefilledData: null,
  roiContext: null,
  signupData: null,

  // Initialize with demo context
  initializeWithDemoContext: () => {
    const contextData = localStorage.getItem('aicomplyr-onboarding-context');
    
    if (contextData) {
      const { demoContext, prefilledData, roiContext, recommendedPath, signupData } = JSON.parse(contextData);
      
      set({
        demoContext,
        onboardingMode: recommendedPath === 'express-setup' ? 'express-setup' : 'demo-handoff',
        userType: prefilledData.industryType === 'pharmaceutical' ? 'enterprise' : 'agency',
        prefilledData,
        roiContext,
        signupData,
        onboardingProgress: {
          ...get().onboardingProgress,
          demoCompleted: true,
          roiCalculated: !!roiContext
        }
      });

      // Clear context after loading
      localStorage.removeItem('aicomplyr-onboarding-context');
    }
  },

  // Generate personalized onboarding flow
  generatePersonalizedFlow: () => {
    const { demoContext, onboardingMode, userType } = get();
    
    if (onboardingMode === 'express-setup') {
      return generateExpressFlow(demoContext, userType);
    } else if (onboardingMode === 'demo-handoff') {
      return generateDemoHandoffFlow(demoContext, userType);
    } else {
      return generateStandardFlow(userType);
    }
  }
}));

// Generate different flow types based on demo context
const generateExpressFlow = (demoContext, userType) => {
  return [
    {
      id: 'express-confirm',
      title: 'Confirm Setup',
      component: <ConfirmExpressSetup />,
      estimatedTime: '1 min'
    },
    {
      id: 'quick-team',
      title: 'Add Your Team',
      component: <QuickTeamImport />,
      estimatedTime: '2 min'
    },
    {
      id: 'launch',
      title: 'Launch Platform',
      component: <LaunchConfirmation />,
      estimatedTime: '1 min'
    }
  ];
};

const generateDemoHandoffFlow = (demoContext, userType) => {
  const baseFlow = userType === 'enterprise' ? [
    {
      id: 'personalized-welcome',
      title: 'Welcome Back',
      component: <PersonalizedWelcome />,
      estimatedTime: '1 min'
    },
    {
      id: 'company-setup',
      title: 'Company Setup',
      component: <PersonalizedCompanySetup />,
      estimatedTime: '3 min'
    },
    {
      id: 'policy-creation',
      title: 'Create First Policy',
      component: <DemoInformedPolicyCreation />,
      estimatedTime: '4 min'
    },
    {
      id: 'agency-invites',
      title: 'Invite Agencies',
      component: <PersonalizedAgencyInvites />,
      estimatedTime: '3 min'
    }
  ] : [
    {
      id: 'agency-welcome',
      title: 'Welcome to Client Workspace',
      component: <AgencyDemoHandoffWelcome />,
      estimatedTime: '1 min'
    },
    {
      id: 'tool-submission',
      title: 'Submit Your Tools',
      component: <AcceleratedToolSubmission />,
      estimatedTime: '4 min'
    }
  ];

  return baseFlow;
};

const generateStandardFlow = (userType) => {
  // Return standard onboarding flow
  return userType === 'enterprise' ? [
    {
      id: 'welcome',
      title: 'Welcome to AICOMPLYR',
      component: <EnterpriseWelcomeStep />,
      estimatedTime: '2 min'
    },
    {
      id: 'company-setup',
      title: 'Company Setup',
      component: <CompanyProfileStep />,
      estimatedTime: '3 min'
    },
    {
      id: 'first-policy',
      title: 'Create First Policy',
      component: <FirstPolicyWizard />,
      estimatedTime: '5 min'
    },
    {
      id: 'invite-agencies',
      title: 'Invite Agency Partners',
      component: <AgencyInvitationWizard />,
      estimatedTime: '3 min'
    },
    {
      id: 'dashboard-tour',
      title: 'Your Command Center',
      component: <DashboardOverviewTour />,
      estimatedTime: '4 min'
    }
  ] : [
    {
      id: 'welcome',
      title: 'Welcome to Your Client Workspace',
      component: <AgencyWelcomeStep />,
      estimatedTime: '2 min'
    },
    {
      id: 'requirements',
      title: 'Client Requirements Overview',
      component: <ClientRequirementsStep />,
      estimatedTime: '3 min'
    },
    {
      id: 'submit-tools',
      title: 'Submit Your AI Tools',
      component: <ToolSubmissionWizard />,
      estimatedTime: '5 min'
    },
    {
      id: 'workflow-integration',
      title: 'Integrate with Your Workflow',
      component: <WorkflowIntegrationStep />,
      estimatedTime: '4 min'
    }
  ];
};

// Demo handoff onboarding component
export const DemoHandoffOnboarding = () => {
  const { 
    demoContext, 
    roiContext, 
    prefilledData, 
    onboardingMode,
    initializeWithDemoContext,
    generatePersonalizedFlow
  } = useEnhancedOnboardingStore();

  const [personalizedSteps, setPersonalizedSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    initializeWithDemoContext();
    setPersonalizedSteps(generatePersonalizedFlow());
  }, []);

  if (!demoContext) {
    // Fallback to standard onboarding
    return <SmartOnboarding />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo Context Header */}
      <div className="bg-green-50 border-b border-green-200 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <span className="text-green-900 font-medium">
                Demo Completed! 
              </span>
              <span className="text-green-700 ml-2">
                You explored {demoContext.featuresExplored.length} features in {Math.round(demoContext.timeSpent / 60000)} minutes.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Reminder */}
      {roiContext && (
        <div className="bg-blue-50 border-b border-blue-200 py-4">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <span className="text-blue-900 font-medium">
                  Your Potential ROI: ${roiContext.netROI.toLocaleString()} annually
                </span>
                <span className="text-blue-700 ml-2">
                  ({roiContext.roiPercentage.toFixed(0)}% return)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Onboarding Flow */}
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Let's Set Up Your AICOMPLYR Platform
          </h1>
          <p className="text-lg text-gray-600">
            {onboardingMode === 'express-setup' 
              ? 'Fast-track setup based on your demo exploration'
              : 'Personalized setup using your demo preferences'
            }
          </p>
        </div>

        <PersonalizedOnboardingFlow 
          steps={personalizedSteps}
          demoContext={demoContext}
          prefilledData={prefilledData}
          roiContext={roiContext}
          currentStep={currentStep}
          onStepComplete={(stepId) => {
            if (currentStep < personalizedSteps.length) {
              setCurrentStep(currentStep + 1);
            }
          }}
        />
      </div>
    </div>
  );
};

// Personalized step components with demo context
const PersonalizedCompanySetup = ({ prefilledData, demoContext }) => {
  const [companyData, setCompanyData] = useState({
    name: prefilledData?.signupData?.company || '',
    industry: prefilledData?.industryType || 'pharmaceutical',
    size: prefilledData?.companySize || 'large',
    expectedAgencies: prefilledData?.expectedAgencies || 8,
    primaryUseCase: prefilledData?.primaryUseCase || 'content-governance'
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 mt-1">💡</span>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Pre-filled from your demo exploration
            </p>
            <p className="text-sm text-blue-700 mt-1">
              You explored the {demoContext.scenarioExplored} scenario. We've pre-configured settings to match.
            </p>
          </div>
        </div>
      </div>

      {/* Pre-filled form fields with demo context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={companyData.name}
            onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry Type
          </label>
          <select
            value={companyData.industry}
            onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pharmaceutical">Pharmaceutical</option>
            <option value="biotech">Biotech</option>
            <option value="medical-device">Medical Device</option>
            <option value="consumer-health">Consumer Health</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Agency Partners
          </label>
          <input
            type="number"
            value={companyData.expectedAgencies}
            onChange={(e) => setCompanyData({...companyData, expectedAgencies: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Based on your demo, we estimate {prefilledData?.expectedAgencies} partners
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Use Case
          </label>
          <select
            value={companyData.primaryUseCase}
            onChange={(e) => setCompanyData({...companyData, primaryUseCase: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="content-governance">Content Governance</option>
            <option value="compliance-monitoring">Compliance Monitoring</option>
            <option value="agency-management">Agency Management</option>
            <option value="general-compliance">General Compliance</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => {/* Handle completion */}}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Continue Setup
      </button>
    </div>
  );
};

// Express setup for high-intent prospects
const ExpressSetupFlow = ({ demoContext, roiContext, prefilledData }) => {
  const [setupProgress, setSetupProgress] = useState(0);
  const totalSteps = 3;

  const expressSteps = [
    {
      title: 'Confirm Your Setup',
      component: <ConfirmExpressSetup prefilledData={prefilledData} demoContext={demoContext} />
    },
    {
      title: 'Import Your Team',
      component: <QuickTeamImport expectedSize={prefilledData?.expectedAgencies * 3} />
    },
    {
      title: 'Launch Platform',
      component: <LaunchConfirmation roiContext={roiContext} />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Express Setup Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚡</span>
          <h2 className="text-xl font-semibold text-green-900">
            Express Setup
          </h2>
        </div>
        <p className="text-green-700">
          Based on your {Math.round(demoContext.timeSpent / 60000)}-minute demo exploration and {demoContext.conversionIntent} conversion intent, 
          we're fast-tracking your setup.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${((setupProgress + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {expressSteps[setupProgress].title}
        </h3>
        {expressSteps[setupProgress].component}
      </div>
    </div>
  );
};

// Express setup components
const ConfirmExpressSetup = ({ prefilledData, demoContext }) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">Setup Summary</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-blue-700">Company Size:</span>
          <div className="font-medium">{prefilledData?.companySize}</div>
        </div>
        <div>
          <span className="text-blue-700">Agency Partners:</span>
          <div className="font-medium">{prefilledData?.expectedAgencies}</div>
        </div>
        <div>
          <span className="text-blue-700">Primary Use Case:</span>
          <div className="font-medium">{prefilledData?.primaryUseCase}</div>
        </div>
        <div>
          <span className="text-blue-700">Demo Scenario:</span>
          <div className="font-medium">{demoContext.scenarioExplored}</div>
        </div>
      </div>
    </div>
    
    <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
      Confirm and Continue
    </button>
  </div>
);

const QuickTeamImport = ({ expectedSize }) => (
  <div className="space-y-6">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="font-medium text-yellow-900 mb-2">Quick Team Setup</h4>
      <p className="text-yellow-700 text-sm">
        We'll create {expectedSize} user seats based on your demo exploration. You can adjust this later.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{Math.round(expectedSize * 0.3)}</div>
        <div className="text-sm text-gray-600">Admin Users</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{Math.round(expectedSize * 0.5)}</div>
        <div className="text-sm text-gray-600">Agency Users</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{Math.round(expectedSize * 0.2)}</div>
        <div className="text-sm text-gray-600">Reviewers</div>
      </div>
    </div>
    
    <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
      Import Team Structure
    </button>
  </div>
);

const LaunchConfirmation = ({ roiContext }) => (
  <div className="space-y-6">
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <span className="text-4xl mb-4 block">🎉</span>
      <h4 className="text-xl font-semibold text-green-900 mb-2">Platform Ready!</h4>
      <p className="text-green-700">
        Your AICOMPLYR platform is configured and ready to use.
      </p>
    </div>
    
    {roiContext && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Your Potential ROI</h4>
        <div className="text-2xl font-bold text-blue-600">
          ${roiContext.netROI.toLocaleString()} annually
        </div>
        <p className="text-blue-700 text-sm">
          {roiContext.roiPercentage.toFixed(0)}% ROI • {roiContext.paybackMonths} month payback
        </p>
      </div>
    )}
    
    <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
      Launch Platform
    </button>
  </div>
);

// Personalized onboarding flow component
const PersonalizedOnboardingFlow = ({ 
  steps, 
  demoContext, 
  prefilledData, 
  roiContext, 
  currentStep, 
  onStepComplete 
}) => {
  const currentStepData = steps[currentStep - 1];
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
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
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">
              {currentStepData.valueDemo || 'Personalized setup based on your demo'}
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
            onComplete: (data) => onStepComplete(currentStepData.id, data),
            demoContext,
            prefilledData,
            roiContext
          })}
        </div>
      </div>
    </div>
  );
};

// Main enhanced onboarding component
export const EnhancedOnboarding = () => {
  const [hasDemoContext, setHasDemoContext] = useState(false);

  useEffect(() => {
    const contextData = localStorage.getItem('aicomplyr-onboarding-context');
    setHasDemoContext(!!contextData);
  }, []);

  if (hasDemoContext) {
    return <DemoHandoffOnboarding />;
  } else {
    return <SmartOnboarding />;
  }
}; 