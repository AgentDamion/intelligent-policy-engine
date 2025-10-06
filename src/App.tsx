import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useEnterprise } from './contexts/EnterpriseContext'

// Components
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PoliciesPage from './pages/PoliciesPage'
import WorkspacesPage from './pages/WorkspacesPage'
import SettingsPage from './pages/SettingsPage'
import { PlatformIntegrationsPage } from './pages/PlatformIntegrationsPage'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise()

  if (loading || enterpriseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!currentEnterprise) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

// Onboarding Route Component
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise()

  if (loading || enterpriseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (currentEnterprise) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Onboarding Routes */}
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="max-w-md w-full">
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
                  Welcome to AIComplyr Policy Studio
                </h1>
                <p className="text-gray-600 text-center mb-8">
                  Let's get you started by setting up your enterprise and first workspace.
                </p>
                {/* Onboarding components will go here */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Onboarding flow coming soon...
                  </p>
                </div>
              </div>
            </div>
          </OnboardingRoute>
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="platform-integrations" element={<PlatformIntegrationsPage enterpriseId="enterprise-1" />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
