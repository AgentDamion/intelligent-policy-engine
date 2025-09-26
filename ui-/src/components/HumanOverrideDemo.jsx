import React, { useState, useEffect } from 'react';
import HumanOverrideRequest from './HumanOverrideRequest';
import OverrideReviewPanel from './OverrideReviewPanel';

const HumanOverrideDemo = () => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState('');
  const [selectedOverride, setSelectedOverride] = useState(null);
  const [pendingOverrides, setPendingOverrides] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sample decisions for demo
  const sampleDecisions = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Social Media Post Approval',
      description: 'AI-generated content for pharmaceutical marketing campaign',
      status: 'rejected',
      confidence: 0.72,
      timestamp: '2024-01-15T10:30:00Z',
      agent: 'ai-governance-agent',
      decision_type: 'policy'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Risk Assessment - Clinical Trial Data',
      description: 'Automated review of clinical trial documentation',
      status: 'conditional_approval',
      confidence: 0.85,
      timestamp: '2024-01-15T09:15:00Z',
      agent: 'ai-compliance-agent',
      decision_type: 'compliance'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Policy Violation Detection',
      description: 'Content flagged for potential FDA guideline violations',
      status: 'approved',
      confidence: 0.95,
      timestamp: '2024-01-15T08:45:00Z',
      agent: 'ai-policy-agent',
      decision_type: 'policy'
    }
  ];

  // Sample pending overrides for demo
  const samplePendingOverrides = [
    {
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      agent: 'ai-governance-agent',
      decision_type: 'policy',
      original_status: 'rejected',
      override_reason: 'AI_CONFIDENCE_LOW',
      override_justification: 'The AI confidence score of 72% is below our threshold of 80%. The content appears to be compliant but the AI is uncertain due to ambiguous policy language.',
      override_status: 'pending',
      override_requested_at: '2024-01-15T10:30:00Z',
      requested_by_email: 'john.doe@company.com',
      hours_pending: 2.5
    },
    {
      entry_id: '550e8400-e29b-41d4-a716-446655440001',
      agent: 'ai-compliance-agent',
      decision_type: 'compliance',
      original_status: 'conditional_approval',
      override_reason: 'BUSINESS_CONTEXT',
      override_justification: 'The AI lacks context about the specific clinical trial phase and patient population. This requires human review to ensure proper compliance assessment.',
      override_status: 'pending',
      override_requested_at: '2024-01-15T09:15:00Z',
      requested_by_email: 'sarah.smith@company.com',
      hours_pending: 4.2
    }
  ];

  useEffect(() => {
    // Simulate loading dashboard data
    setDashboardStats({
      statistics: {
        total_overrides: 15,
        pending_overrides: 2,
        approved_overrides: 10,
        rejected_overrides: 3,
        avg_resolution_hours: 6.5
      },
      recentOverrides: samplePendingOverrides,
      reasonsBreakdown: [
        { override_reason: 'AI_CONFIDENCE_LOW', count: 8 },
        { override_reason: 'BUSINESS_CONTEXT', count: 4 },
        { override_reason: 'POLICY_AMBIGUITY', count: 3 }
      ]
    });
  }, []);

  const openOverrideRequest = (decisionId) => {
    setSelectedDecisionId(decisionId);
    setIsRequestOpen(true);
  };

  const openOverrideReview = (override) => {
    setSelectedOverride(override);
    setIsReviewOpen(true);
  };

  const handleOverrideSuccess = (overrideId) => {
    console.log('Override request submitted:', overrideId);
    // In a real app, you might refresh the data here
  };

  const handleOverrideReview = (reviewData) => {
    console.log('Override reviewed:', reviewData);
    // In a real app, you might refresh the data here
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

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Human Override System Demo
          </h1>
          <p className="text-gray-600">
            Complete human override system for AI decisions with request, review, and dashboard functionality.
          </p>
        </div>

        {/* Dashboard Stats */}
        {dashboardStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Override Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">15</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Overrides</p>
                    <p className="text-xs text-blue-600">All time</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold">2</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-900">Pending Review</p>
                    <p className="text-xs text-yellow-600">Awaiting action</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">10</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Approved</p>
                    <p className="text-xs text-green-600">Override granted</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">6.5h</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Avg Resolution</p>
                    <p className="text-xs text-gray-600">Time to resolve</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sample Decisions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Decisions - Request Override</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleDecisions.map((decision) => (
              <div key={decision.id} className="border border-gray-200 rounded-lg p-4">
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
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Confidence: <span className={getConfidenceColor(decision.confidence)}>{Math.round(decision.confidence * 100)}%</span></span>
                  <span>{formatTimeAgo(decision.timestamp)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Agent: {decision.agent}</span>
                  <span>Type: {decision.decision_type}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openOverrideRequest(decision.id)}
                    className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <span>Request Override</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Overrides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Override Reviews</h2>
          <div className="space-y-4">
            {samplePendingOverrides.map((override) => (
              <div key={override.entry_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-semibold">!</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Override Request - {override.decision_type}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Decision ID: {override.entry_id}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Original Decision</p>
                    <p className="text-sm text-gray-900">{override.original_status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Override Reason</p>
                    <p className="text-sm text-gray-900">{override.override_reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Requested By</p>
                    <p className="text-sm text-gray-900">{override.requested_by_email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Time Pending</p>
                    <p className="text-sm text-gray-900">{Math.round(override.hours_pending)} hours</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Justification</p>
                  <p className="text-sm text-gray-900">{override.override_justification}</p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Requested {formatTimeAgo(override.override_requested_at)}
                  </span>
                  <button
                    onClick={() => openOverrideReview(override)}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span>Review Override</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Human Override System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Override Request</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Standardized reason categories</li>
                <li>• Detailed justification required</li>
                <li>• Priority level selection</li>
                <li>• Optional reviewer assignment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Review Process</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Comprehensive review panel</li>
                <li>• Approve/reject/cancel actions</li>
                <li>• New decision specification</li>
                <li>• Review notes and audit trail</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Dashboard & Analytics</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time statistics</li>
                <li>• Pending override queue</li>
                <li>• Resolution time tracking</li>
                <li>• Reason breakdown analysis</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Workflow Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automated workflow creation</li>
                <li>• Priority-based routing</li>
                <li>• Escalation handling</li>
                <li>• SLA monitoring</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Audit & Compliance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Complete activity logging</li>
                <li>• Decision history tracking</li>
                <li>• Compliance reporting</li>
                <li>• Regulatory audit support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Security & Access</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Role-based permissions</li>
                <li>• Organization scoping</li>
                <li>• JWT authentication</li>
                <li>• Secure API endpoints</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Override Request Modal */}
      <HumanOverrideRequest
        decisionId={selectedDecisionId}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onSuccess={handleOverrideSuccess}
      />

      {/* Override Review Modal */}
      <OverrideReviewPanel
        override={selectedOverride}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onReview={handleOverrideReview}
      />
    </div>
  );
};

export default HumanOverrideDemo; 