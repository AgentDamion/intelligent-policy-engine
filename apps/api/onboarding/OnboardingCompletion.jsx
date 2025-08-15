import React, { useState, useEffect } from 'react';
import { useDemoStore } from '../demo/demo-store';

// Onboarding Completion Tracking
export const OnboardingCompletion = ({ userType, progress, onComplete }) => {
  const [showMetrics, setShowMetrics] = useState(false);
  const [completionData, setCompletionData] = useState({
    timeSpent: 0,
    stepsCompleted: 0,
    valueDemonstrated: [],
    nextSteps: []
  });

  const { demoData } = useDemoStore();

  useEffect(() => {
    // Calculate completion metrics
    const stepsCompleted = Object.values(progress).filter(Boolean).length;
    const totalSteps = userType === 'enterprise' ? 5 : 4;
    const completionRate = (stepsCompleted / totalSteps) * 100;

    setCompletionData({
      timeSpent: Math.floor(Math.random() * 10) + 8, // Simulated time
      stepsCompleted,
      completionRate,
      valueDemonstrated: generateValueMetrics(userType),
      nextSteps: generateNextSteps(userType, progress)
    });

    // Show metrics after a delay
    setTimeout(() => setShowMetrics(true), 500);
  }, [userType, progress]);

  const generateValueMetrics = (type) => {
    if (type === 'enterprise') {
      return [
        {
          metric: '80%',
          label: 'Faster Approvals',
          description: 'AI-powered policy generation and review'
        },
        {
          metric: '85%',
          label: 'Risk Reduction',
          description: 'Automated compliance monitoring'
        },
        {
          metric: '$127K',
          label: 'Annual Savings',
          description: 'Reduced admin time and incident costs'
        }
      ];
    } else {
      return [
        {
          metric: '60%',
          label: 'Faster Submissions',
          description: 'Streamlined approval workflows'
        },
        {
          metric: '95%',
          label: 'Approval Rate',
          description: 'Clear compliance requirements'
        },
        {
          metric: '2.3 days',
          label: 'Avg. Approval Time',
          description: 'Reduced from 12-15 days'
        }
      ];
    }
  };

  const generateNextSteps = (type, progress) => {
    if (type === 'enterprise') {
      return [
        {
          title: 'Invite More Agencies',
          description: 'Add additional agency partners to your workspace',
          action: 'Add Agency',
          priority: 'high'
        },
        {
          title: 'Create Additional Policies',
          description: 'Set up policies for different content types',
          action: 'Create Policy',
          priority: 'medium'
        },
        {
          title: 'Set Up Compliance Alerts',
          description: 'Configure automated monitoring and notifications',
          action: 'Configure Alerts',
          priority: 'medium'
        }
      ];
    } else {
      return [
        {
          title: 'Submit Your First Content',
          description: 'Create and submit AI-generated content for approval',
          action: 'Submit Content',
          priority: 'high'
        },
        {
          title: 'Review Client Requirements',
          description: 'Understand all compliance requirements',
          action: 'View Requirements',
          priority: 'medium'
        },
        {
          title: 'Set Up Team Permissions',
          description: 'Configure access for your team members',
          action: 'Manage Team',
          priority: 'low'
        }
      ];
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to AICOMPLYR!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your setup is complete. Here's what you've accomplished and what's next.
        </p>
      </div>

      {/* Completion Summary */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Setup Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {completionData.completionRate}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {completionData.stepsCompleted}
            </div>
            <div className="text-sm text-gray-600">Steps Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {completionData.timeSpent}m
            </div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
        </div>
      </div>

      {/* Value Demonstration */}
      {showMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Value You'll Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completionData.valueDemonstrated.map((metric, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {metric.metric}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-600">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended Next Steps</h2>
        <div className="space-y-4">
          {completionData.nextSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                step.priority === 'high' 
                  ? 'border-red-200 bg-red-50' 
                  : step.priority === 'medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-4 ${
                  step.priority === 'high' 
                    ? 'bg-red-500' 
                    : step.priority === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
                }`}></div>
                <div>
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {step.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Data Integration */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Real-World Example</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              {userType === 'enterprise' ? 'Enterprise Success Story' : 'Agency Success Story'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {userType === 'enterprise' 
                ? `See how ${demoData.pharmaCompanies[0].name} manages ${demoData.pharmaCompanies[0].agencyPartners} agency partners with ${demoData.pharmaCompanies[0].complianceScore}% compliance.`
                : `See how ${demoData.agencyScenarios[0].name} achieves ${demoData.agencyScenarios[0].complianceScore}% compliance with ${demoData.agencyScenarios[0].monthlySubmissions} monthly submissions.`
              }
            </p>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              View Full Case Study →
            </button>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">KEY METRICS</div>
            <div className="space-y-2">
              {userType === 'enterprise' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Agency Partners:</span>
                    <span className="text-sm font-medium">{demoData.pharmaCompanies[0].agencyPartners}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Compliance Score:</span>
                    <span className="text-sm font-medium">{demoData.pharmaCompanies[0].complianceScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly AI Spend:</span>
                    <span className="text-sm font-medium">${(demoData.pharmaCompanies[0].monthlyAISpend / 1000).toFixed(0)}k</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Team Size:</span>
                    <span className="text-sm font-medium">{demoData.agencyScenarios[0].teamSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approval Rate:</span>
                    <span className="text-sm font-medium">{demoData.agencyScenarios[0].approvalRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. Approval Time:</span>
                    <span className="text-sm font-medium">{demoData.agencyScenarios[0].avgApprovalTime}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => onComplete && onComplete()}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Launch Dashboard
        </button>
        <button className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
          Schedule Demo
        </button>
        <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
          Invite Team Members
        </button>
      </div>

      {/* Success Metrics Tracking */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Your onboarding success metrics have been recorded. 
          We'll track your progress and provide personalized recommendations.
        </p>
      </div>
    </div>
  );
};

// Onboarding Progress Tracker
export const OnboardingProgressTracker = ({ currentStep, totalSteps, progress }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
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
        
        {/* Step indicators */}
        <div className="flex justify-between mt-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < currentStep 
                  ? 'bg-blue-600' 
                  : i === currentStep - 1 
                  ? 'bg-blue-400' 
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Expansion Hints Component
export const ExpansionHints = ({ userType, currentStep }) => {
  const hints = {
    enterprise: [
      {
        step: 1,
        hint: "💡 Pro tip: You can invite up to 50 agency partners",
        action: "Learn more about enterprise limits"
      },
      {
        step: 2,
        hint: "💡 Pro tip: Industry-specific templates are available",
        action: "Browse policy templates"
      },
      {
        step: 3,
        hint: "💡 Pro tip: AI can generate policies in multiple languages",
        action: "Explore international compliance"
      },
      {
        step: 4,
        hint: "💡 Pro tip: Agencies get real-time compliance feedback",
        action: "View agency dashboard features"
      }
    ],
    agency: [
      {
        step: 1,
        hint: "💡 Pro tip: You can submit multiple tools at once",
        action: "Learn about bulk submissions"
      },
      {
        step: 2,
        hint: "💡 Pro tip: Save frequently used tools as templates",
        action: "Create tool templates"
      },
      {
        step: 3,
        hint: "💡 Pro tip: Track approval history and trends",
        action: "View analytics dashboard"
      }
    ]
  };

  const currentHints = hints[userType] || [];
  const currentHint = currentHints.find(h => h.step === currentStep);

  if (!currentHint) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <div className="flex items-start">
        <span className="text-yellow-600 mr-3 mt-1">💡</span>
        <div className="flex-1">
          <p className="text-sm text-yellow-800 mb-2">{currentHint.hint}</p>
          <button className="text-xs text-yellow-700 underline hover:text-yellow-800">
            {currentHint.action}
          </button>
        </div>
      </div>
    </div>
  );
}; 