import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEnterprise } from '../contexts/EnterpriseContext'
import {
  Home,
  Users,
  Shield,
  Zap,
  FileText,
  Settings,
  FlaskConical,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Sparkles,
  GitBranch,
  Briefcase,
} from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'
import VeraDrawer from './vera/VeraDrawer'
import { Input } from './ui/Input'
import { Button } from './ui/button'
import { ContextSwitcher } from './context-switcher/ContextSwitcher'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [enterpriseDropdownOpen, setEnterpriseDropdownOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { currentEnterprise, workspaces } = useEnterprise()
  const location = useLocation()
  const navigate = useNavigate()
  const [veraOpen, setVeraOpen] = useState(false)

  const navigationGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Mission Control', href: '/mission', icon: Home },
        { name: 'Triage', href: '/inbox', icon: Users },
        { name: 'Decisions', href: '/decisions', icon: Shield },
      ]
    },
    {
      title: 'Governance',
      items: [
        { name: 'The Forge', href: '/forge', icon: Zap },
        { name: 'Evidence Vault', href: '/proof', icon: FileText },
        { name: 'Simulation Lab', href: '/lab', icon: FlaskConical },
        { name: 'Workflows', href: '/workflows', icon: GitBranch, adminOnly: true },
        { name: 'Partner Workspace', href: '/partner', icon: Briefcase, partnerOnly: true },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const openVera = () => setVeraOpen(true)
  const closeVera = () => setVeraOpen(false)

  if (!currentEnterprise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 lg:flex lg:h-screen lg:overflow-hidden">
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
          fixed inset-y-0 left-0 z-50 w-sidebar bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Tenant dropdown (must live in sidebar) */}
            <div className="px-4 pt-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEnterpriseDropdownOpen(!enterpriseDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-neutral-200 hover:border-neutral-300 transition-colors"
                >
                  <span className="text-sm font-semibold text-aicomplyr-black truncate">
                    {currentEnterprise.name || 'Acme Pharmaceuticals'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${enterpriseDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {enterpriseDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 shadow-xl z-10 overflow-hidden">
                    <div className="p-2">
                      <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        Workspaces
                      </div>
                      {workspaces.map((workspace) => (
                        <button
                          key={workspace.id}
                          type="button"
                          className="w-full flex items-center px-2 py-2 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          {workspace.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar brand */}
            <div className="px-6 pt-6 pb-4">
              <div className="text-lg font-display text-aicomplyr-black tracking-tight uppercase">AICOMPLYR</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Boundary Governed</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-0 pb-6 overflow-y-auto">
              {navigationGroups.map((group) => (
                <div key={group.title} className="mb-4">
                  <div className="px-6 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {group.title}
                  </div>
                  <ul className="space-y-0.5">
                    {group.items
                      .filter((item) => {
                        // Filter admin-only items (for now, show to all - can be enhanced with role check)
                        if (item.adminOnly) return true
                        if (item.partnerOnly) return true
                        return true
                      })
                      .map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={`
                                flex items-center gap-3 px-6 py-2 text-sm transition-colors border-l-[3px]
                                ${active 
                                  ? 'bg-neutral-100 border-l-aicomplyr-yellow text-aicomplyr-black font-bold' 
                                  : 'border-l-transparent text-neutral-600 hover:bg-neutral-50 hover:text-aicomplyr-black font-medium'}
                              `}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <Icon className={`h-4 w-4 ${active ? 'text-aicomplyr-black' : 'text-neutral-400'}`} />
                              <span>{item.name}</span>
                            </Link>
                          </li>
                        )
                      })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Sidebar footer: version + user profile */}
            <div className="px-6 py-6 border-t border-neutral-200">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">v1.0.0-alpha</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Enterprise Edition</div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-neutral-700">
                      {(user?.email?.charAt(0) || 'D').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-aicomplyr-black truncate">
                      {user?.email?.split('@')[0] || 'damiont'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 text-neutral-400 hover:text-neutral-600"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col min-h-screen lg:min-h-0 lg:h-full overflow-y-auto transition-[padding] duration-200 ease-out ${
            veraOpen ? 'lg:pr-[380px]' : ''
          }`}
        >
          {/* Main header row: ContextSwitcher | Search | VERA | User */}
          <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
            <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Context Switcher */}
              <div className="hidden lg:block">
                <ContextSwitcher compact />
              </div>

              <div className="flex-1 max-w-2xl">
                <Input
                  placeholder="Search threads, decisions, policies..."
                  leadingIcon={<Search className="h-4 w-4 text-neutral-400" />}
                  className="bg-white border-neutral-200 focus:border-aicomplyr-black focus:ring-0 rounded-none shadow-none"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openVera}
                  className="h-9 px-3 border-neutral-200 text-aicomplyr-black hover:bg-neutral-100 gap-2"
                >
                  <Sparkles className="h-4 w-4 text-aicomplyr-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-aicomplyr-black">VERA</span>
                </Button>
              </div>
            </div>
          </header>


          {/* Page Content */}
          <div className="flex-1 bg-white">
            <Outlet />
          </div>
        </div>

        {/* VERA Drawer (anchored to shell) */}
        <VeraDrawer open={veraOpen} onClose={closeVera} />
      </div>
  )
}

export default Layout
