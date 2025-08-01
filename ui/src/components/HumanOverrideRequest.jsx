import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Send, 
  Clock, 
  User, 
  FileText, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

const HumanOverrideRequest = ({ 
  decisionId, 
  isOpen, 
  onClose, 
  onSuccess,
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reasons, setReasons] = useState({});
  const [selectedReason, setSelectedReason] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState('normal');
  const [assignedReviewer, setAssignedReviewer] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchOverrideReasons();
    }
  }, [isOpen]);

  const fetchOverrideReasons = async () => {
    try {
      const response = await fetch('/api/overrides/reasons', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch override reasons');
      }

      const data = await response.json();
      if (data.success) {
        setReasons(data.reasons);
      }
    } catch (err) {
      console.error('Error fetching override reasons:', err);
      setError('Failed to load override reasons');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason || !justification.trim()) {
      setError('Please select a reason and provide justification');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/overrides/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          decisionId,
          reason: selectedReason,
          justification: justification.trim(),
          priority,
          assignedReviewer: assignedReviewer || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(data.overrideId);
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit override request');
      }
    } catch (err) {
      console.error('Error submitting override request:', err);
      setError('Failed to submit override request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReason('');
    setJustification('');
    setPriority('normal');
    setAssignedReviewer('');
    setError(null);
    setSuccess(false);
  };

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Request Human Override
                  </h3>
                  <p className="text-sm text-gray-600">
                    Request human review for AI decision
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

          {/* Success State */}
          {success && (
            <div className="px-6 py-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Override Request Submitted</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your override request has been submitted successfully and is pending review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="px-6 py-4">
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

              {/* Override Reason Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Override Reason *
                </label>
                
                <div className="space-y-3">
                  {Object.entries(reasons).map(([category, categoryReasons]) => (
                    <div key={category} className="border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Shield className="w-4 h-4 text-orange-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 capitalize">
                              {category.replace('_', ' ')}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {categoryReasons.length} reason{categoryReasons.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedCategories.has(category) && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="mt-3 space-y-2">
                            {categoryReasons.map((reason) => (
                              <label key={reason.reason_code} className="flex items-start space-x-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="overrideReason"
                                  value={reason.reason_code}
                                  checked={selectedReason === reason.reason_code}
                                  onChange={(e) => setSelectedReason(e.target.value)}
                                  className="mt-1 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {reason.reason_name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {reason.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Justification */}
              <div className="mb-6">
                <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
                  Justification *
                </label>
                <textarea
                  id="justification"
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Please provide a detailed justification for why this decision requires human review..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Explain why the AI decision should be overridden and what additional context or considerations are needed.
                </p>
              </div>

              {/* Priority Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'low', label: 'Low', description: 'Non-urgent review' },
                    { value: 'normal', label: 'Normal', description: 'Standard review' },
                    { value: 'high', label: 'High', description: 'Urgent review' },
                    { value: 'urgent', label: 'Urgent', description: 'Immediate attention' }
                  ].map((priorityOption) => {
                    const IconComponent = getPriorityIcon(priorityOption.value);
                    return (
                      <label
                        key={priorityOption.value}
                        className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                          priority === priorityOption.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priorityOption.value}
                          checked={priority === priorityOption.value}
                          onChange={(e) => setPriority(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm">
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-4 h-4" />
                                <span className="font-medium text-gray-900">
                                  {priorityOption.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {priorityOption.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Reviewer (Optional) */}
              <div className="mb-6">
                <label htmlFor="assignedReviewer" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Specific Reviewer (Optional)
                </label>
                <input
                  type="email"
                  id="assignedReviewer"
                  value={assignedReviewer}
                  onChange={(e) => setAssignedReviewer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="reviewer@company.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to assign to the next available reviewer.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedReason || !justification.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Override Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HumanOverrideRequest; 