import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  Clock, 
  User, 
  FileText, 
  Shield, 
  AlertTriangle, 
  AlertCircle,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  Target,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Eye,
  MessageSquare,
  Send,
  Archive
} from 'lucide-react';

const OverrideReviewPanel = ({ 
  override, 
  isOpen, 
  onClose, 
  onReview,
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [newDecision, setNewDecision] = useState({
    status: '',
    reasoning: '',
    decision: {}
  });
  const [showNewDecisionForm, setShowNewDecisionForm] = useState(false);

  useEffect(() => {
    if (override && action === 'approved') {
      setShowNewDecisionForm(true);
    } else {
      setShowNewDecisionForm(false);
    }
  }, [action, override]);

  const handleReview = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    if (action === 'approved' && showNewDecisionForm && (!newDecision.status || !newDecision.reasoning)) {
      setError('Please provide the new decision status and reasoning');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reviewData = {
        action,
        notes: notes.trim() || null,
        newDecision: action === 'approved' && showNewDecisionForm ? newDecision : null
      };

      const response = await fetch(`/api/overrides/${override.entry_id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();

      if (data.success) {
        onReview && onReview(data);
        onClose();
      } else {
        setError(data.error || 'Failed to review override');
      }
    } catch (err) {
      console.error('Error reviewing override:', err);
      setError('Failed to review override');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: X,
      cancelled: Archive
    };
    return icons[status] || Clock;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      normal: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: Clock,
      normal: Info,
      high: AlertTriangle,
      urgent: Zap
    };
    return icons[priority] || Info;
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

  if (!isOpen || !override) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Review Override Request
                  </h3>
                  <p className="text-sm text-gray-600">
                    Decision ID: {override.entry_id}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            {/* Error State */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Override Details */}
              <div className="space-y-6">
                {/* Override Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Override Status</h4>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const IconComponent = getStatusIcon(override.override_status);
                      return <IconComponent className="w-5 h-5 text-gray-400" />;
                    })()}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(override.override_status)}`}>
                      {override.override_status}
                    </span>
                  </div>
                </div>

                {/* Original Decision */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Original Decision</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Agent:</dt>
                      <dd className="text-gray-900">{override.agent}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="text-gray-900">{override.decision_type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Status:</dt>
                      <dd className="text-gray-900">{override.original_status}</dd>
                    </div>
                  </dl>
                </div>

                {/* Override Request Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Override Request</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">Reason:</dt>
                      <dd className="text-gray-900 mt-1">{override.override_reason}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Justification:</dt>
                      <dd className="text-gray-900 mt-1">{override.override_justification}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Requested by:</dt>
                      <dd className="text-gray-900">{override.requested_by_email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Requested:</dt>
                      <dd className="text-gray-900">{formatTimeAgo(override.override_requested_at)}</dd>
                    </div>
                    {override.hours_pending && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Time pending:</dt>
                        <dd className="text-gray-900">{Math.round(override.hours_pending)} hours</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Right Column - Review Actions */}
              <div className="space-y-6">
                {/* Review Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Review Actions</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="approved"
                        checked={action === 'approved'}
                        onChange={(e) => setAction(e.target.value)}
                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Approve Override</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="rejected"
                        checked={action === 'rejected'}
                        onChange={(e) => setAction(e.target.value)}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <div className="flex items-center space-x-2">
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-900">Reject Override</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="cancelled"
                        checked={action === 'cancelled'}
                        onChange={(e) => setAction(e.target.value)}
                        className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Archive className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Cancel Override</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Review Notes */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Review Notes</h4>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add your review notes here..."
                  />
                </div>

                {/* New Decision Form (if approved) */}
                {showNewDecisionForm && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">New Decision</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          New Status *
                        </label>
                        <select
                          value={newDecision.status}
                          onChange={(e) => setNewDecision({...newDecision, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select status...</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="conditional_approval">Conditional Approval</option>
                          <option value="pending">Pending</option>
                          <option value="review">Under Review</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reasoning *
                        </label>
                        <textarea
                          rows={3}
                          value={newDecision.reasoning}
                          onChange={(e) => setNewDecision({...newDecision, reasoning: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Explain the new decision..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReview}
                    disabled={loading || !action}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverrideReviewPanel; 