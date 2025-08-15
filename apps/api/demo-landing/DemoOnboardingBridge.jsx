// File: demo-landing/DemoOnboardingBridge.jsx

import React, { useEffect, useState } from 'react';
import { useDemoLandingStore } from './DemoLandingStore';

// Enhanced onboarding store with demo context
export const useEnhancedOnboardingStore = (() => {
  let store = null;
  
  return () => {
    if (!store) {
      store = {
        // Demo context integration
        demoContext: null,
        onboardingMode: 'standard', // 'standard', 'demo-handoff', 'express-setup'
        prefilledData: {},
        roiContext: null,
        signupData: null,

        // Initialize with demo context
        initializeWithDemoContext: () => {
          const contextData = localStorage.getItem('aicomplyr-onboarding-context');
          
          if (contextData) {
            const { demoContext, prefilledData, roiContext, recommendedPath, signupData } = JSON.parse(contextData);
            
            store.demoContext = demoContext;
            store.onboardingMode = recommendedPath === 'express-setup' ? 'express-setup' : 'demo-handoff';
            store.prefilledData = prefilledData;
            store.roiContext = roiContext;
            store.signupData = signupData;

            // Clear context after loading
            localStorage.removeItem('aicomplyr-onboarding-context');
            
            return true;
          }
          return false;
        },

        // Generate personalized onboarding flow
        generatePersonalizedFlow: () => {
          const { demoContext, onboardingMode } = store;
          
          if (onboardingMode === 'express-setup') {
            return generateExpressFlow(demoContext);
          } else if (onboardingMode === 'demo-handoff') {
            return generateDemoHandoffFlow(demoContext);
          } else {
            return generateStandardFlow();
          }
        }
      };
    }
    
    return store;
  };
})();

// Generate different flow types based on demo context
const generateExpressFlow = (demoContext) => {
  return [
    {
      id: 'express-confirm',
      title: 'Confirm Setup',
      component: 'ConfirmExpressSetup',
      estimatedTime: '1 min'
    },
    {
      id: 'quick-team',
      title: 'Add Your Team',
      component: 'QuickTeamImport',
      estimatedTime: '2 min'
    },
    {
      id: 'launch',
      title: 'Launch Platform',
      component: 'LaunchConfirmation',
      estimatedTime: '1 min'
    }
  ];
};

const generateDemoHandoffFlow = (demoContext) => {
  return [
    {
      id: 'personalized-welcome',
      title: 'Welcome Back',
      component: 'PersonalizedWelcome',
      estimatedTime: '1 min'
    },
    {
      id: 'company-setup',
      title: 'Company Setup',
      component: 'PersonalizedCompanySetup',
      estimatedTime: '3 min'
    },
    {
      id: 'policy-creation',
      title: 'Create First Policy',
      component: 'DemoInformedPolicyCreation',
      estimatedTime: '4 min'
    },
    {
      id: 'agency-invites',
      title: 'Invite Agencies',
      component: 'PersonalizedAgencyInvites',
      estimatedTime: '3 min'
    }
  ];
};

const generateStandardFlow = () => {
  return [
    {
      id: 'welcome',
      title: 'Welcome',
      component: 'Welcome',
      estimatedTime: '1 min'
    },
    {
      id: 'company-setup',
      title: 'Company Setup',
      component: 'CompanySetup',
      estimatedTime: '3 min'
    },
    {
      id: 'policy-creation',
      title: 'Create First Policy',
      component: 'PolicyCreation',
      estimatedTime: '4 min'
    },
    {
      id: 'agency-invites',
      title: 'Invite Agencies',
      component: 'AgencyInvites',
      estimatedTime: '3 min'
    }
  ];
};

// Demo handoff onboarding component
export const DemoHandoffOnboarding = () => {
  const { demoContext, roiContext, prefilledData, onboardingMode } = useEnhancedOnboardingStore();
  const [personalizedSteps, setPersonalizedSteps] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const hasContext = useEnhancedOnboardingStore().initializeWithDemoContext();
    if (hasContext) {
      setPersonalizedSteps(useEnhancedOnboardingStore().generatePersonalizedFlow());
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    // Fallback to standard onboarding
    return <div>Loading onboarding...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo Context Header */}
      <div className="bg-green-50 border-b border-green-200 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
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
              <span className="text-blue-600">📈</span>
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
        />
      </div>
    </div>
  );
};

// Personalized step components with demo context
const PersonalizedCompanySetup = ({ prefilledData, demoContext }) => {
  const [companyData, setCompanyData] = useState({
    name: prefilledData.signupData?.company || '',
    industry: prefilledData.industryType || 'pharmaceutical',
    size: prefilledData.companySize || 'large',
    expectedAgencies: prefilledData.expectedAgencies || 8,
    primaryUseCase: prefilledData.primaryUseCase || 'content-governance'
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
            className="w-full p-3 border border-gray-300 rounded-lg"
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
            className="w-full p-3 border border-gray-300 rounded-lg"
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
            className="w-full p-3 border border-gray-300 rounded-lg"
            min="1"
            max="50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Based on your demo, we estimate {prefilledData.expectedAgencies} partners
          </p>
        </div>
      </div>
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
      component: <QuickTeamImport expectedSize={prefilledData.expectedAgencies * 3} />
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
          <span className="text-green-600">⚡</span>
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

// Placeholder components for express setup
const ConfirmExpressSetup = ({ prefilledData, demoContext }) => (
  <div className="space-y-4">
    <p className="text-gray-600">
      We've pre-configured your setup based on your demo exploration of the {demoContext.scenarioExplored} scenario.
    </p>
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">Your Configuration:</h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• Company Type: {prefilledData.companySize}</li>
        <li>• Expected Agencies: {prefilledData.expectedAgencies}</li>
        <li>• Primary Use Case: {prefilledData.primaryUseCase}</li>
        <li>• Estimated ROI: ${demoContext.calculatedROI?.netROI?.toLocaleString()}</li>
      </ul>
    </div>
  </div>
);

const QuickTeamImport = ({ expectedSize }) => (
  <div className="space-y-4">
    <p className="text-gray-600">
      We'll help you quickly import your team of approximately {expectedSize} users.
    </p>
    <div className="bg-green-50 rounded-lg p-4">
      <p className="text-sm text-green-800">
        Team import will be available after platform launch.
      </p>
    </div>
  </div>
);

const LaunchConfirmation = ({ roiContext }) => (
  <div className="space-y-4">
    <p className="text-gray-600">
      Your AICOMPLYR platform is ready to launch!
    </p>
    {roiContext && (
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Your Potential Impact:</h4>
        <p className="text-sm text-green-800">
          Annual savings: ${roiContext.netROI.toLocaleString()} ({roiContext.roiPercentage.toFixed(0)}% ROI)
        </p>
      </div>
    )}
  </div>
);

// Main personalized onboarding flow component
const PersonalizedOnboardingFlow = ({ steps, demoContext, prefilledData, roiContext }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleStepComplete = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      console.log('Onboarding completed with demo context');
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-sm text-gray-500">
          {currentStepData.estimatedTime}
        </span>
      </div>

      {/* Current step content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {currentStepData.title}
        </h3>
        
        {currentStepData.component === 'PersonalizedCompanySetup' && (
          <PersonalizedCompanySetup 
            prefilledData={prefilledData} 
            demoContext={demoContext} 
          />
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          
          <button
            onClick={handleStepComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoHandoffOnboarding; 