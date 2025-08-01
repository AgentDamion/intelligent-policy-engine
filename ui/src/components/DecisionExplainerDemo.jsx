import React, { useState } from 'react';
import DecisionExplainer from './DecisionExplainer';

const DecisionExplainerDemo = () => {
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState('');

  // Sample decision IDs for demo
  const sampleDecisions = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Social Media Post Approval',
      description: 'AI-generated content for pharmaceutical marketing campaign',
      status: 'approved',
      confidence: 0.87,
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Risk Assessment - Clinical Trial Data',
      description: 'Automated review of clinical trial documentation',
      status: 'conditional_approval',
      confidence: 0.72,
      timestamp: '2024-01-15T09:15:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Policy Violation Detection',
      description: 'Content flagged for potential FDA guideline violations',
      status: 'rejected',
      confidence: 0.95,
      timestamp: '2024-01-15T08:45:00Z'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Compliance Check - Marketing Materials',
      description: 'Review of promotional materials for regulatory compliance',
      status: 'approved',
      confidence: 0.91,
      timestamp: '2024-01-15T07:30:00Z'
    }
  ];

  const openExplainer = (decisionId) => {
    setSelectedDecisionId(decisionId);
    setIsExplainerOpen(true);
  };

  const closeExplainer = () => {
    setIsExplainerOpen(false);
    setSelectedDecisionId('');
  };

  const getStatusColor = (status) => {
    const colorMap = {
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      pending: 'text-yellow-600 bg-yellow-100',
      conditional_approval: 'text-orange-600 bg-orange-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Decision Explainability Demo
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of AI decision explainability and transparency features.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Decision Explainability Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Policy Evaluation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visual policy tree</li>
                <li>• Weight calculations</li>
                <li>• Rule triggering</li>
                <li>• Impact assessment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Confidence Analysis</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Confidence meters</li>
                <li>• Uncertainty levels</li>
                <li>• Factor breakdown</li>
                <li>• Recommendations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Alternative Outcomes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• What-if scenarios</li>
                <li>• Probability analysis</li>
                <li>• Impact assessment</li>
                <li>• Risk evaluation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Transparency Tools</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Share explanations</li>
                <li>• Export reports</li>
                <li>• Policy links</li>
                <li>• Audit trails</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sample Decisions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sample Decisions - Click to Explain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleDecisions.map((decision) => (
              <div
                key={decision.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openExplainer(decision.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    {decision.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(decision.status)}`}>
                    {decision.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {decision.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Confidence: <span className={getConfidenceColor(decision.confidence)}>{Math.round(decision.confidence * 100)}%</span></span>
                  <span>{new Date(decision.timestamp).toLocaleString()}</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openExplainer(decision.id);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span>Why this decision?</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Technical Implementation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Backend API</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-100 px-1 rounded">GET /api/decisions/explain/:decisionId</code></li>
                <li>• Organization scoping</li>
                <li>• Policy evaluation data</li>
                <li>• Confidence breakdown</li>
                <li>• Alternative outcomes</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Frontend Component</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Modal interface</li>
                <li>• Tabbed navigation</li>
                <li>• Interactive visualizations</li>
                <li>• Share functionality</li>
                <li>• Mobile responsive</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Response Format */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Explanation Data Format
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs text-gray-800 overflow-auto">
{`{
  "decision_id": "550e8400-e29b-41d4-a716-446655440000",
  "policies_evaluated": [
    {
      "policy_name": "Global MLR Policy v2.1",
      "weight": 40,
      "status": "passed",
      "rule_triggered": "healthcare_content_review"
    }
  ],
  "key_factors": [
    {
      "factor": "medium_urgency",
      "impact": -15,
      "description": "Reduced risk due to non-urgent timeline"
    }
  ],
  "final_calculation": {
    "risk_score": 55,
    "outcome": "conditional_approval",
    "confidence": 0.87
  }
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Decision Explainer Modal */}
      <DecisionExplainer
        decisionId={selectedDecisionId}
        isOpen={isExplainerOpen}
        onClose={closeExplainer}
      />
    </div>
  );
};

export default DecisionExplainerDemo; 