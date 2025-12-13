import React from 'react'
import { useEnterprise } from '@/contexts/EnterpriseContext'
import { 
  FileText, 
  Users, 
  TrendingUp,
  Building2,
  Briefcase
} from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { currentEnterprise, workspaces, enterpriseMembers } = useEnterprise()

  // Mock data - replace with real data from your database
  const mockStats = {
    totalPolicies: 12,
    activePolicies: 8,
    pendingReviews: 3,
    complianceScore: 87,
    recentActivity: [
      { id: 1, action: 'Policy updated', policy: 'Data Privacy Policy', user: 'John Doe', time: '2 hours ago' },
      { id: 2, action: 'New workspace created', workspace: 'Marketing Team', user: 'Jane Smith', time: '1 day ago' },
      { id: 3, action: 'Policy published', policy: 'AI Usage Guidelines', user: 'Mike Johnson', time: '2 days ago' },
    ]
  }

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ 
    title, 
    value, 
    icon, 
    color 
  }) => (
    <div className="card-hover">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  const ActivityItem: React.FC<{ activity: any }> = ({ activity }) => (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0">
        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.action}</span>
          {activity.policy && (
            <span className="text-gray-600">: {activity.policy}</span>
          )}
          {activity.workspace && (
            <span className="text-gray-600">: {activity.workspace}</span>
          )}
        </p>
        <p className="text-xs text-gray-500">
          by {activity.user} • {activity.time}
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here&apos;s what&apos;s happening with {currentEnterprise?.name}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Policies"
          value={mockStats.totalPolicies}
          icon={<FileText className="h-6 w-6 text-white" />}
          color="bg-primary-500"
        />
        <StatCard
          title="Active Workspaces"
          value={workspaces.length}
          icon={<Briefcase className="h-6 w-6 text-white" />}
          color="bg-success-500"
        />
        <StatCard
          title="Team Members"
          value={enterpriseMembers.length}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-warning-500"
        />
        <StatCard
          title="Compliance Score"
          value={`${mockStats.complianceScore}%`}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-danger-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enterprise Overview */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Enterprise Overview</h3>
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enterprise Name</p>
                  <p className="text-lg font-semibold text-gray-900">{currentEnterprise?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm text-gray-900">
                    {currentEnterprise?.created_at ? new Date(currentEnterprise.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{workspaces.length}</p>
                  <p className="text-sm text-primary-700">Workspaces</p>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-lg">
                  <p className="text-2xl font-bold text-success-600">{enterpriseMembers.length}</p>
                  <p className="text-sm text-success-700">Team Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-1">
              {mockStats.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                View all activity →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <FileText className="h-5 w-5 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Policy</p>
              <p className="text-sm text-gray-600">Draft a new policy</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <Users className="h-5 w-5 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Invite Team</p>
              <p className="text-sm text-gray-600">Add new members</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <Briefcase className="h-5 w-5 text-primary-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">New Workspace</p>
              <p className="text-sm text-gray-600">Create workspace</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
