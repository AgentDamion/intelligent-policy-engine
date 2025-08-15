import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Building2, 
  Send, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const AgencyInviteModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    agencyEmail: '',
    agencyName: '',
    contactPerson: '',
    phone: '',
    website: '',
    specialties: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agencyEmail || !formData.agencyName) {
      setError('Agency email and name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agency-onboarding/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          agencyEmail: formData.agencyEmail,
          agencyName: formData.agencyName
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(data.invitation);
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      agencyEmail: '',
      agencyName: '',
      contactPerson: '',
      phone: '',
      website: '',
      specialties: []
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-brand-indigo/10 px-6 py-4 border-b border-brand-indigo/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-brand-indigo" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Invite Agency
                  </h3>
                  <p className="text-sm text-gray-600">
                    Send invitation to a marketing agency
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo"
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
                    <h3 className="text-sm font-medium text-green-800">Invitation Sent</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Agency invitation has been sent successfully.
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

              {/* Agency Information */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    id="agencyName"
                    value={formData.agencyName}
                    onChange={(e) => handleInputChange('agencyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-indigo focus:border-brand-indigo"
                    placeholder="Enter agency name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="agencyEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Email *
                  </label>
                  <input
                    type="email"
                    id="agencyEmail"
                    value={formData.agencyEmail}
                    onChange={(e) => handleInputChange('agencyEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-indigo focus:border-brand-indigo"
                    placeholder="agency@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-indigo focus:border-brand-indigo"
                    placeholder="Primary contact name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-indigo focus:border-brand-indigo"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://agency-website.com"
                  />
                </div>
              </div>

              {/* Invitation Details */}
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Invitation Details</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Invitation expires in 7 days</span>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>Agency will be able to submit AI tools for approval</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Invitation link will be sent to the provided email</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.agencyEmail || !formData.agencyName}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-indigo hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitation
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

export default AgencyInviteModal; 