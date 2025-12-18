import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  FileText, 
  BarChart3, 
  Zap, 
  Activity, 
  ExternalLink, 
  Copy, 
  Share2, 
  Download,
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
  Star,
  Target,
  Gauge,
  Scale,
  Lightbulb,
  BookOpen,
  Link,
  Users,
  Settings
} from 'lucide-react';

const DecisionExplainer = ({ 
  decisionId, 
  isOpen, 
  onClose, 
  className = '' 
}) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPolicies, setExpandedPolicies] = useState(new Set());

  useEffect(() => {
    if (isOpen && decisionId) {
      fetchExplanation();
    }
  }, [isOpen, decisionId]);

  const fetchExplanation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/decisions/explain/${decisionId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setExplanation(data.explanation);
      } else {
        throw new Error(data.error || 'Failed to fetch explanation');
      }
    } catch (err) {
      console.error('Error fetching decision explanation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePolicyExpansion = (policyId) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedPolicies(newExpanded);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      approved: CheckCircle,
      rejected: AlertTriangle,
      pending: Clock,
      review: Eye,
      conditional_approval: Shield
    };
    return iconMap[status] || FileText;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      pending: 'text-yellow-600 bg-yellow-100',
      review: 'text-blue-600 bg-blue-100',
      conditional_approval: 'text-orange-600 bg-orange-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  const getPolicyImpactColor = (impact) => {
    const colorMap = {
      positive: 'text-green-600 bg-green-50 border-green-200',
      negative: 'text-red-600 bg-red-50 border-red-200',
      neutral: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colorMap[impact] || colorMap.neutral;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const shareExplanation = () => {
    const url = `${window.location.origin}/decisions/${decisionId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Decision Explanation',
        text: `View the explanation for decision ${decisionId}`,
        url: url
      });
    } else {
      copyToClipboard(url);
    }
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Decision Explanation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Understanding why this decision was made
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={shareExplanation}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading explanation...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-6 py-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading explanation</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {explanation && !loading && (
            <div className="px-6 py-4">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'policies', label: 'Policies', icon: Shield },
                    { id: 'factors', label: 'Key Factors', icon: TrendingUp },
                    { id: 'alternatives', label: 'Alternatives', icon: Eye },
                    { id: 'details', label: 'Details', icon: FileText }
                  ].map(tab => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-96">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Decision Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Decision Summary</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(explanation.final_calculation.outcome)}`}>
                            {getStatusIcon(explanation.final_calculation.outcome) && React.createElement(getStatusIcon(explanation.final_calculation.outcome), { className: "w-3 h-3 mr-1" })}
                            {explanation.final_calculation.outcome}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-md">
                          <div className="flex items-center">
                            <Gauge className="w-5 h-5 text-blue-500" />
                            <span className="ml-2 text-sm font-medium text-gray-600">Confidence</span>
                          </div>
                          <p className={`text-2xl font-bold ${getConfidenceColor(explanation.final_calculation.confidence)}`}>
                            {Math.round(explanation.final_calculation.confidence * 100)}%
                          </p>
                          <p className="text-xs text-gray-500">{getConfidenceLevel(explanation.final_calculation.confidence)} Confidence</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-md">
                          <div className="flex items-center">
                            <Scale className="w-5 h-5 text-green-500" />
                            <span className="ml-2 text-sm font-medium text-gray-600">Compliance</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(explanation.final_calculation.compliance_score * 100)}%
                          </p>
                          <p className="text-xs text-gray-500">Compliance Score</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-md">
                          <div className="flex items-center">
                            <Target className="w-5 h-5 text-orange-500" />
                            <span className="ml-2 text-sm font-medium text-gray-600">Risk Score</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">
                            {explanation.final_calculation.risk_score}
                          </p>
                          <p className="text-xs text-gray-500">Risk Assessment</p>
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    {explanation.reasoning && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Decision Reasoning</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <p className="text-sm text-blue-800">{explanation.reasoning}</p>
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-md p-3">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="ml-2 text-xs font-medium text-gray-600">Policies</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{explanation.policies_evaluated.length}</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-md p-3">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="ml-2 text-xs font-medium text-gray-600">Factors</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{explanation.key_factors.length}</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-md p-3">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-purple-500" />
                          <span className="ml-2 text-xs font-medium text-gray-600">Alternatives</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{explanation.alternative_outcomes.length}</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-md p-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="ml-2 text-xs font-medium text-gray-600">Processing</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{explanation.final_calculation.processing_time_ms}ms</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Policies Evaluated</h4>
                    
                    {explanation.policies_evaluated.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No policies evaluated</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          This decision was made without specific policy evaluation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {explanation.policies_evaluated.map((policy, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg">
                            <div
                              className="px-4 py-3 cursor-pointer"
                              onClick={() => togglePolicyExpansion(`policy-${index}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Shield className="w-4 h-4 text-blue-600" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-sm font-medium text-gray-900 truncate">
                                        {policy.policy_name}
                                      </h5>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPolicyImpactColor(policy.status)}`}>
                                        {policy.status}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                      <span>v{policy.policy_version}</span>
                                      <span>Weight: {policy.weight}%</span>
                                      <span>Relevance: {Math.round(policy.relevance_score * 100)}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex-shrink-0">
                                  {expandedPolicies.has(`policy-${index}`) ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {expandedPolicies.has(`policy-${index}`) && (
                              <div className="px-4 pb-4 border-t border-gray-100">
                                <div className="mt-3 space-y-3">
                                  {policy.policy_section && (
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                                        Policy Section
                                      </h6>
                                      <p className="text-sm text-gray-600">{policy.policy_section}</p>
                                    </div>
                                  )}
                                  
                                  {policy.rule_triggered && (
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                                        Rule Triggered
                                      </h6>
                                      <p className="text-sm text-gray-600">{policy.rule_triggered}</p>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      View Policy
                                    </button>
                                    <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Open Document
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'factors' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Key Factors</h4>
                    
                    {explanation.key_factors.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No key factors identified</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          This decision was made without specific key factors.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {explanation.key_factors.map((factor, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    factor.impact > 0 ? 'bg-green-100' : 
                                    factor.impact < 0 ? 'bg-red-100' : 'bg-gray-100'
                                  }`}>
                                    {factor.impact > 0 ? (
                                      <TrendingUp className="w-4 h-4 text-green-600" />
                                    ) : factor.impact < 0 ? (
                                      <TrendingDown className="w-4 h-4 text-red-600" />
                                    ) : (
                                      <Activity className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-900">{factor.factor}</h5>
                                  <p className="text-sm text-gray-600">{factor.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  factor.impact > 0 ? 'bg-green-100 text-green-800' :
                                  factor.impact < 0 ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {factor.impact > 0 ? '+' : ''}{factor.impact}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'alternatives' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Alternative Outcomes</h4>
                    
                    <div className="space-y-3">
                      {explanation.alternative_outcomes.map((alternative, index) => (
                        <div key={index} className={`bg-white border rounded-lg p-4 ${
                          alternative.is_actual ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  alternative.is_actual ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  {alternative.is_actual ? (
                                    <Star className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-sm font-medium text-gray-900">{alternative.outcome}</h5>
                                  {alternative.is_actual && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                      Actual
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{alternative.reason}</p>
                                <p className="text-xs text-gray-500 mt-1">{alternative.impact}</p>
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <span className="text-sm font-medium text-gray-900">
                                {Math.round(alternative.probability * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Decision Information</h5>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Decision ID:</dt>
                            <dd className="text-gray-900 font-mono">{explanation.decision_id}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Type:</dt>
                            <dd className="text-gray-900">{explanation.decision_type}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Agent:</dt>
                            <dd className="text-gray-900">{explanation.agent}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Timestamp:</dt>
                            <dd className="text-gray-900">{new Date(explanation.timestamp).toLocaleString()}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h5>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Processing Time:</dt>
                            <dd className="text-gray-900">{explanation.final_calculation.processing_time_ms}ms</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Confidence Score:</dt>
                            <dd className="text-gray-900">{Math.round(explanation.final_calculation.confidence * 100)}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Compliance Score:</dt>
                            <dd className="text-gray-900">{Math.round(explanation.final_calculation.compliance_score * 100)}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Risk Score:</dt>
                            <dd className="text-gray-900">{explanation.final_calculation.risk_score}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {explanation.metadata && Object.keys(explanation.metadata).length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Metadata</h5>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto">
                          {JSON.stringify(explanation.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionExplainer; 