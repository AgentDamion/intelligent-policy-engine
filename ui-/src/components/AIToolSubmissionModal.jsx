import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  FileText, 
  Upload, 
  Send, 
  AlertCircle,
  CheckCircle,
  Shield,
  ExternalLink
} from 'lucide-react';

const AIToolSubmissionModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    toolName: '',
    toolDescription: '',
    toolType: '',
    toolUrl: '',
    complianceDocumentation: {
      dataPrivacy: '',
      securityMeasures: '',
      fdaCompliance: '',
      contentGuidelines: '',
      testingResults: ''
    }
  });

  const toolTypes = [
    { value: 'content_creation', label: 'Content Creation', description: 'AI tools for creating marketing content' },
    { value: 'social_media', label: 'Social Media', description: 'AI tools for social media management' },
    { value: 'analytics', label: 'Analytics', description: 'AI tools for data analysis and insights' },
    { value: 'image_generation', label: 'Image Generation', description: 'AI tools for creating visual content' },
    { value: 'copywriting', label: 'Copywriting', description: 'AI tools for writing marketing copy' },
    { value: 'campaign_optimization', label: 'Campaign Optimization', description: 'AI tools for optimizing marketing campaigns' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.toolName || !formData.toolDescription || !formData.toolType) {
      setError('Tool name, description, and type are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agency-onboarding/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          toolName: formData.toolName,
          toolDescription: formData.toolDescription,
          toolType: formData.toolType,
          toolUrl: formData.toolUrl,
          complianceDocumentation: formData.complianceDocumentation
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(data.tool);
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit AI tool');
      }
    } catch (err) {
      console.error('Error submitting AI tool:', err);
      setError('Failed to submit AI tool');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      toolName: '',
      toolDescription: '',
      toolType: '',
      toolUrl: '',
      complianceDocumentation: {
        dataPrivacy: '',
        securityMeasures: '',
        fdaCompliance: '',
        contentGuidelines: '',
        testingResults: ''
      }
    });
    setError(null);
    setSuccess(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplianceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      complianceDocumentation: {
        ...prev.complianceDocumentation,
        [field]: value
      }
    }));
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
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Submit AI Tool
                  </h3>
                  <p className="text-sm text-gray-600">
                    Submit AI tool for enterprise approval
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
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
                    <h3 className="text-sm font-medium text-green-800">Tool Submitted</h3>
                    <p className="text-sm text-green-700 mt-1">
                      AI tool has been submitted for review.
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="toolName" className="block text-sm font-medium text-gray-700 mb-2">
                      Tool Name *
                    </label>
                    <input
                      type="text"
                      id="toolName"
                      value={formData.toolName}
                      onChange={(e) => handleInputChange('toolName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter AI tool name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="toolType" className="block text-sm font-medium text-gray-700 mb-2">
                      Tool Type *
                    </label>
                    <select
                      id="toolType"
                      value={formData.toolType}
                      onChange={(e) => handleInputChange('toolType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select tool type...</option>
                      {toolTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="toolUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Tool URL
                    </label>
                    <input
                      type="url"
                      id="toolUrl"
                      value={formData.toolUrl}
                      onChange={(e) => handleInputChange('toolUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      placeholder="https://tool-website.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="toolDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Tool Description *
                    </label>
                    <textarea
                      id="toolDescription"
                      rows={4}
                      value={formData.toolDescription}
                      onChange={(e) => handleInputChange('toolDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Describe what this AI tool does and how it will be used..."
                      required
                    />
                  </div>
                </div>

                {/* Right Column - Compliance Documentation */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Compliance Documentation
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Data Privacy Measures
                        </label>
                        <textarea
                          rows={2}
                          value={formData.complianceDocumentation.dataPrivacy}
                          onChange={(e) => handleComplianceChange('dataPrivacy', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="Describe data privacy measures..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Security Measures
                        </label>
                        <textarea
                          rows={2}
                          value={formData.complianceDocumentation.securityMeasures}
                          onChange={(e) => handleComplianceChange('securityMeasures', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="Describe security measures..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          FDA Compliance
                        </label>
                        <textarea
                          rows={2}
                          value={formData.complianceDocumentation.fdaCompliance}
                          onChange={(e) => handleComplianceChange('fdaCompliance', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="Describe FDA compliance measures..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Content Guidelines
                        </label>
                        <textarea
                          rows={2}
                          value={formData.complianceDocumentation.contentGuidelines}
                          onChange={(e) => handleComplianceChange('contentGuidelines', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="Describe content guidelines..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Testing Results
                        </label>
                        <textarea
                          rows={2}
                          value={formData.complianceDocumentation.testingResults}
                          onChange={(e) => handleComplianceChange('testingResults', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                          placeholder="Describe testing results..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Guidelines */}
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Submission Guidelines</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• All AI tools must comply with FDA regulations</li>
                      <li>• Data privacy and security measures are required</li>
                      <li>• Content must follow pharmaceutical industry guidelines</li>
                      <li>• Testing results and validation are mandatory</li>
                      <li>• Enterprise will review and approve submissions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.toolName || !formData.toolDescription || !formData.toolType}
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
                      Submit Tool
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

export default AIToolSubmissionModal; 