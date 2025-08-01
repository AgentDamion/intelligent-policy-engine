import React, { useState } from 'react';
import AgencyOnboardingPortal from './AgencyOnboardingPortal';
import AgencyInviteModal from './AgencyInviteModal';
import AIToolSubmissionModal from './AIToolSubmissionModal';

const AgencyOnboardingDemo = () => {
  const [userRole, setUserRole] = useState('enterprise_admin');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  const handleInviteSuccess = (invitation) => {
    console.log('Invitation sent:', invitation);
    // In a real app, you might show a notification or update the dashboard
  };

  const handleToolSuccess = (tool) => {
    console.log('Tool submitted:', tool);
    // In a real app, you might show a notification or update the dashboard
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Agency Onboarding Portal Demo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Role Switcher */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Role:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="enterprise_admin">Enterprise Admin</option>
                  <option value="agency_admin">Agency Admin</option>
                  <option value="agency_user">Agency User</option>
                </select>
              </div>

              {/* Demo Actions */}
              {userRole === 'enterprise_admin' && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Invite Agency
                </button>
              )}

              {(userRole === 'agency_admin' || userRole === 'agency_user') && (
                <button
                  onClick={() => setShowToolModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  Submit AI Tool
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Info */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-blue-700">
                <span className="font-medium">Current Role:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md text-blue-800">
                  {userRole === 'enterprise_admin' ? 'Enterprise Admin' : 
                   userRole === 'agency_admin' ? 'Agency Admin' : 'Agency User'}
                </span>
              </div>
              
              <div className="text-sm text-blue-600">
                {userRole === 'enterprise_admin' 
                  ? 'Manage agency invitations and review AI tool submissions'
                  : 'Complete onboarding and submit AI tools for approval'
                }
              </div>
            </div>

            <div className="text-xs text-blue-500">
              Demo Mode • All data is simulated
            </div>
          </div>
        </div>
      </div>

      {/* Main Portal */}
      <AgencyOnboardingPortal userRole={userRole} />

      {/* Modals */}
      <AgencyInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />

      <AIToolSubmissionModal
        isOpen={showToolModal}
        onClose={() => setShowToolModal(false)}
        onSuccess={handleToolSuccess}
      />

      {/* Demo Features */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Demo Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Enterprise Features */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Enterprise Admin</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Send agency invitations</li>
                <li>• Track invitation status</li>
                <li>• Review AI tool submissions</li>
                <li>• Monitor compliance scores</li>
                <li>• Manage agency relationships</li>
              </ul>
            </div>

            {/* Agency Features */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">Agency Admin</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Complete onboarding process</li>
                <li>• Submit AI tools for approval</li>
                <li>• Track compliance requirements</li>
                <li>• Monitor approval status</li>
                <li>• Manage team access</li>
              </ul>
            </div>

            {/* Compliance Features */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Compliance & Security</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• FDA compliance tracking</li>
                <li>• Data privacy validation</li>
                <li>• Security measure verification</li>
                <li>• Content guideline enforcement</li>
                <li>• Audit trail maintenance</li>
              </ul>
            </div>
          </div>

          {/* Business Context */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Business Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pharma Enterprise Workflow</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enterprise identifies marketing agency</li>
                  <li>Sends invitation through portal</li>
                  <li>Agency completes registration</li>
                  <li>Agency submits AI tools for approval</li>
                  <li>Enterprise reviews and approves tools</li>
                  <li>Agency can use approved tools for campaigns</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Compliance Requirements</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>FDA regulations for pharmaceutical marketing</li>
                  <li>Data privacy and security standards</li>
                  <li>Content guidelines and approval processes</li>
                  <li>Testing and validation requirements</li>
                  <li>Audit trail and documentation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyOnboardingDemo; 