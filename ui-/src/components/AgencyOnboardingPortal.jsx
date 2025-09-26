import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Mail,
  Shield,
  Zap,
  BarChart3,
  Settings,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const AgencyOnboardingPortal = ({ userRole = 'enterprise_admin' }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (userRole === 'enterprise_admin') {
      fetchInvitations();
    } else {
      fetchTools();
    }
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/agency-onboarding/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/agency-onboarding/invitations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/agency-onboarding/tools', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTools(data.tools);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      accepted: 'text-green-600 bg-green-100',
      active: 'text-blue-600 bg-blue-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      under_review: 'text-orange-600 bg-orange-100'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      accepted: CheckCircle,
      active: CheckCircle,
      approved: CheckCircle,
      rejected: AlertTriangle,
      under_review: Clock
    };
    return icons[status] || Clock;
  };

  const renderEnterpriseDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invitations</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_invitations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Agencies</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.active_agencies || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tools Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_tools_submitted || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.avg_compliance_score ? Math.round(dashboardData.avg_compliance_score) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invitations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Agency Invitations</h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite Agency
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invited
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.slice(0, 5).map((invitation) => {
                const StatusIcon = getStatusIcon(invitation.status);
                return (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invitation.agency_name}</div>
                        <div className="text-sm text-gray-500">{invitation.agency_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAgencyDashboard = () => (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Onboarding Progress</h3>
        <div className="space-y-4">
          {[
            { step: 1, name: 'Invitation Sent', status: 'completed' },
            { step: 2, name: 'Agency Registration', status: 'completed' },
            { step: 3, name: 'Compliance Review', status: 'in_progress' },
            { step: 4, name: 'AI Tool Submission', status: 'pending' },
            { step: 5, name: 'Enterprise Approval', status: 'pending' },
            { step: 6, name: 'Onboarding Complete', status: 'pending' }
          ].map((step) => (
            <div key={step.step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-100' : 
                step.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : step.status === 'in_progress' ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <span className="text-sm font-medium text-gray-500">{step.step}</span>
                )}
              </div>
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-900' : 
                  step.status === 'in_progress' ? 'text-blue-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Tools */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">AI Tools</h3>
            <button
              onClick={() => setShowToolModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Tool
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tools.slice(0, 5).map((tool) => {
                const StatusIcon = getStatusIcon(tool.submission_status);
                return (
                  <tr key={tool.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tool.tool_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.tool_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tool.submission_status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {tool.submission_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tool.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agency Onboarding Portal</h1>
            <p className="mt-2 text-gray-600">
              {userRole === 'enterprise_admin' 
                ? 'Manage agency invitations and relationships'
                : 'Complete your onboarding process and submit AI tools'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <Shield className="h-4 w-4 mr-2" />
              Secure Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
            { id: 'invitations', name: 'Invitations', icon: Mail, show: userRole === 'enterprise_admin' },
            { id: 'tools', name: 'AI Tools', icon: Zap },
            { id: 'compliance', name: 'Compliance', icon: Shield },
            { id: 'settings', name: 'Settings', icon: Settings }
          ].filter(tab => tab.show !== false).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          userRole === 'enterprise_admin' ? renderEnterpriseDashboard() : renderAgencyDashboard()
        )}
        
        {activeTab === 'invitations' && userRole === 'enterprise_admin' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Agency Invitations</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">Invitation management interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">AI Tools Management</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">AI tools management interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Compliance Requirements</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">Compliance management interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Portal Settings</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">Settings interface will be implemented here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyOnboardingPortal; 