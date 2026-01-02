import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useEnterprise } from '@/contexts/EnterpriseContext'
import { Settings, User, Building2, Shield, Bell, Key } from 'lucide-react'

const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { currentEnterprise } = useEnterprise()

  const settingsSections = [
    {
      title: 'Account Settings',
      icon: User,
      description: 'Manage your personal account settings',
      items: [
        { name: 'Profile Information', description: 'Update your name, email, and avatar' },
        { name: 'Password', description: 'Change your password' },
        { name: 'Two-Factor Authentication', description: 'Add an extra layer of security' },
        { name: 'Notification Preferences', description: 'Configure how you receive notifications' }
      ]
    },
    {
      title: 'Enterprise Settings',
      icon: Building2,
      description: 'Manage your enterprise configuration',
      items: [
        { name: 'Enterprise Information', description: 'Update enterprise name and details' },
        { name: 'Billing & Subscription', description: 'Manage your subscription and billing' },
        { name: 'Integrations', description: 'Connect with third-party services' },
        { name: 'Data Export', description: 'Export your enterprise data' }
      ]
    },
    {
      title: 'Security & Privacy',
      icon: Shield,
      description: 'Configure security and privacy settings',
      items: [
        { name: 'Access Control', description: 'Manage user roles and permissions' },
        { name: 'Audit Logs', description: 'View system activity and changes' },
        { name: 'Data Retention', description: 'Configure data retention policies' },
        { name: 'Compliance', description: 'Set up compliance frameworks' }
      ]
    },
    {
      title: 'API & Development',
      icon: Key,
      description: 'Manage API keys and developer settings',
      items: [
        { name: 'API Keys', description: 'Generate and manage API keys' },
        { name: 'Webhooks', description: 'Configure webhook endpoints' },
        { name: 'Rate Limits', description: 'View and adjust API rate limits' },
        { name: 'Documentation', description: 'Access API documentation' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and enterprise settings</p>
      </div>

      {/* User Info Card */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{user?.email}</h3>
            <p className="text-sm text-gray-600">
              Member of {currentEnterprise?.name}
            </p>
            <p className="text-xs text-gray-500">
              Account created {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="card">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-none">
                  <Icon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {section.items.map((item) => (
                  <button
                    key={item.name}
                    className="w-full text-left p-3 rounded-none hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <Settings className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-none hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <User className="h-5 w-5 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Update Profile</p>
              <p className="text-sm text-gray-600">Change your information</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-none hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <Shield className="h-5 w-5 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Security Settings</p>
              <p className="text-sm text-gray-600">Manage security options</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-none hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <Bell className="h-5 w-5 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Notifications</p>
              <p className="text-sm text-gray-600">Configure alerts</p>
            </div>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-red-100 rounded-none">
            <Settings className="h-5 w-5 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
            <p className="text-sm text-red-700">Irreversible and destructive actions</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-none hover:bg-red-100 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">Delete Account</p>
                <p className="text-xs text-red-700">Permanently delete your account and all data</p>
              </div>
              <button className="btn-danger text-sm px-3 py-1">
                Delete
              </button>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
