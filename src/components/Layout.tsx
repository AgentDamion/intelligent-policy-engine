import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEnterprise } from '../contexts/EnterpriseContext'
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  Building2,
  Briefcase,
  Activity,
  Zap
} from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'
import { SpineLayout } from './agentic/spine/SpineLayout'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [enterpriseDropdownOpen, setEnterpriseDropdownOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { currentEnterprise, workspaces } = useEnterprise()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Enterprise', href: '/enterprise', icon: Activity },
    { name: 'Enterprise AI', href: '/enterprise-ai', icon: Zap },
    { name: 'Policies', href: '/policies', icon: FileText },
    { name: 'Workspaces', href: '/workspaces', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  if (!currentEnterprise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <SpineLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Policy Studio</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Enterprise Selector */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <button
                onClick={() => setEnterpriseDropdownOpen(!enterpriseDropdownOpen)}
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900 truncate">
                    {currentEnterprise.name}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${enterpriseDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {enterpriseDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-100">
                      Workspaces
                    </div>
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                        {workspace.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-6 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive(item.href)
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${isActive(item.href) ? 'text-primary-700' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SpineLayout>
  )
}

export default Layout
