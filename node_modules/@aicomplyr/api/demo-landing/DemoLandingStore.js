import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDemoData } from '../demo/demo-data-generator';

// Smart conversion intent calculation
const calculateConversionIntent = (featuresExplored, timeSpent) => {
  const highValueFeatures = ['seat-management', 'policy-builder', 'compliance-dashboard', 'roi-calculator'];
  const exploredHighValue = featuresExplored.filter(f => highValueFeatures.includes(f)).length;
  
  if (timeSpent > 600000 && exploredHighValue >= 2) return 'high'; // 10+ minutes, 2+ high-value features
  if (timeSpent > 300000 && exploredHighValue >= 1) return 'medium'; // 5+ minutes, 1+ high-value feature
  return 'low';
};

// Derive use case from explored features
const deriveUseCaseFromFeatures = (featuresExplored) => {
  if (featuresExplored.includes('policy-builder')) return 'content-governance';
  if (featuresExplored.includes('compliance-dashboard')) return 'compliance-monitoring';
  if (featuresExplored.includes('seat-management')) return 'agency-management';
  return 'general-compliance';
};

// Enhanced demo store with context capture
export const useDemoLandingStore = create()(
  persist(
    (set, get) => ({
      // Demo data
      demoData: createDemoData(),
      
      // Demo exploration tracking
      demoSession: {
        sessionId: null,
        selectedScenario: null,
        timeSpent: 0,
        featuresExplored: [],
        calculatedROI: null,
        prospectData: {},
        conversionIntent: 'unknown', // 'high', 'medium', 'low'
        startTime: null
      },

      // Context capture methods
      startDemoSession: (scenarioId) => {
        const sessionId = `demo-${Date.now()}`;
        const startTime = Date.now();
        
        set({
          demoSession: {
            sessionId,
            selectedScenario: scenarioId,
            timeSpent: 0,
            featuresExplored: [],
            calculatedROI: null,
            prospectData: {},
            conversionIntent: 'unknown',
            startTime
          }
        });
        
        // Track demo start
        console.log('Demo Started', {
          sessionId,
          scenario: scenarioId,
          timestamp: new Date().toISOString()
        });
        
        return sessionId;
      },

      trackFeatureExploration: (feature) => {
        const session = get().demoSession;
        if (!session.startTime) return;
        
        const updatedFeatures = [...session.featuresExplored, feature];
        const timeSpent = Date.now() - session.startTime;
        
        set({
          demoSession: {
            ...session,
            featuresExplored: updatedFeatures,
            timeSpent,
            conversionIntent: calculateConversionIntent(updatedFeatures, timeSpent)
          }
        });
      },

      captureROIData: (roiData) => {
        const session = get().demoSession;
        set({
          demoSession: {
            ...session,
            calculatedROI: roiData,
            conversionIntent: roiData.roiPercentage > 200 ? 'high' : 'medium'
          }
        });
      },

      captureProspectData: (prospectData) => {
        const session = get().demoSession;
        set({
          demoSession: {
            ...session,
            prospectData: {
              ...session.prospectData,
              ...prospectData
            }
          }
        });
      },

      // Generate onboarding context from demo session
      generateOnboardingContext: () => {
        const session = get().demoSession;
        const scenario = get().demoData.pharmaCompanies.find(c => c.id === session.selectedScenario);
        
        return {
          demoContext: {
            completedDemo: true,
            scenarioExplored: session.selectedScenario,
            timeSpent: session.timeSpent,
            featuresExplored: session.featuresExplored,
            conversionIntent: session.conversionIntent
          },
          prefilledData: {
            companySize: session.prospectData.companySize || (scenario?.employees > 50000 ? 'enterprise' : 'large'),
            industryType: scenario?.industry || 'pharmaceutical',
            expectedAgencies: session.prospectData.agencyPartners || scenario?.agencyPartners,
            primaryUseCase: deriveUseCaseFromFeatures(session.featuresExplored),
            budgetRange: session.calculatedROI?.investment || 'to-be-determined'
          },
          roiContext: session.calculatedROI,
          recommendedPath: session.conversionIntent === 'high' ? 'express-setup' : 'guided-setup'
        };
      },

      // Reset demo session
      resetDemoSession: () => {
        set({
          demoSession: {
            sessionId: null,
            selectedScenario: null,
            timeSpent: 0,
            featuresExplored: [],
            calculatedROI: null,
            prospectData: {},
            conversionIntent: 'unknown',
            startTime: null
          }
        });
      }
    }),
    {
      name: 'aicomplyr-demo-landing-store',
      partialize: (state) => ({
        demoSession: state.demoSession
      })
    }
  )
);

// Demo API service for backend integration
export const demoApiService = {
  // Start demo session
  startDemoSession: async (scenarioId, prospectData = {}) => {
    try {
      const response = await fetch('/api/demo/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, prospectData })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to start demo session:', error);
      return { success: false, error: error.message };
    }
  },

  // Track feature exploration
  trackFeatureExploration: async (sessionId, feature, timeSpent) => {
    try {
      const response = await fetch('/api/demo/track-feature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, feature, timeSpent })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to track feature exploration:', error);
      return { success: false, error: error.message };
    }
  },

  // Calculate ROI
  calculateROI: async (roiData) => {
    try {
      const response = await fetch('/api/demo/calculate-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roiData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to calculate ROI:', error);
      return { success: false, error: error.message };
    }
  },

  // Complete demo session
  completeDemoSession: async (sessionId, finalData) => {
    try {
      const response = await fetch('/api/demo/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, finalData })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to complete demo session:', error);
      return { success: false, error: error.message };
    }
  },

  // Start onboarding with context
  startOnboardingWithContext: async (onboardingContext) => {
    try {
      const response = await fetch('/api/onboarding/start-with-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingContext)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to start onboarding with context:', error);
      return { success: false, error: error.message };
    }
  }
};

// Analytics tracking
export const demoAnalytics = {
  track: (event, data) => {
    console.log('Demo Analytics:', event, data);
    // Integrate with your analytics platform here
  },

  trackDemoStart: (scenarioId) => {
    demoAnalytics.track('Demo Started', {
      scenario: scenarioId,
      timestamp: new Date().toISOString()
    });
  },

  trackFeatureExploration: (feature, timeSpent) => {
    demoAnalytics.track('Feature Explored', {
      feature,
      timeSpent,
      timestamp: new Date().toISOString()
    });
  },

  trackROICalculation: (roiData) => {
    demoAnalytics.track('ROI Calculated', {
      roiPercentage: roiData.roiPercentage,
      netROI: roiData.netROI,
      timestamp: new Date().toISOString()
    });
  },

  trackDemoCompletion: (sessionData) => {
    demoAnalytics.track('Demo Completed', {
      timeSpent: sessionData.timeSpent,
      featuresExplored: sessionData.featuresExplored.length,
      conversionIntent: sessionData.conversionIntent,
      timestamp: new Date().toISOString()
    });
  },

  trackSignupConversion: (demoContext, signupData) => {
    demoAnalytics.track('Demo to Signup', {
      conversionIntent: demoContext.conversionIntent,
      timeSpent: demoContext.timeSpent,
      featuresExplored: demoContext.featuresExplored.length,
      timestamp: new Date().toISOString()
    });
  }
}; 