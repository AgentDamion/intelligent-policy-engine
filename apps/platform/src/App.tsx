import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useEnterprise } from './contexts/EnterpriseContext'
import { ensureOnPlatformOrigin } from './utils/platformOrigin'

// Components
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PoliciesPage from './pages/PoliciesPage'
import WorkspacesPage from './pages/WorkspacesPage'
import SettingsPage from './pages/SettingsPage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import EnterpriseDashboard from './pages/enterprise/EnterpriseDashboard'
import EnterpriseDashboardEnhanced from './pages/enterprise/EnterpriseDashboardEnhanced'
import OnboardingPage from './pages/OnboardingPage'
import AuthHubPage from './pages/auth/AuthHubPage'
import AgenticPage from './pages/AgenticPage'
import VERAOrbPage from './pages/VERAOrbPage'
import VeraPlusDashboard from './pages/VeraPlusDashboard'
import VERASettingsPage from './pages/VERASettingsPage'

function getSafeRedirectTo(search: string): string | null {
  const raw = new URLSearchParams(search).get('redirectTo')
  if (!raw) return null

  // Only allow internal paths.
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  if (raw.includes('://')) return null

  // Prevent loops.
  if (raw.startsWith('/login')) return null
  if (raw.startsWith('/onboarding')) return null

  return raw
}
// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const { currentEnterprise, loading: enterpriseLoading, enterpriseFetchComplete } = useEnterprise()
  const location = useLocation()

  if (loading || enterpriseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />
  }

  // Only redirect to onboarding if enterprise fetch is complete AND no enterprise exists
  // This prevents premature redirects while the enterprise is still loading
  if (enterpriseFetchComplete && !currentEnterprise) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to={`/onboarding?redirectTo=${redirectTo}`} replace />
  }

  // If enterprise fetch not complete yet, show loading
  if (!enterpriseFetchComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

// Onboarding Route Component
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise()
  const location = useLocation()

  if (loading || enterpriseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />
  }

  if (currentEnterprise) {
    const redirectTo = getSafeRedirectTo(location.search)
    return <Navigate to={redirectTo || '/vera-plus'} replace />
  }

  return <>{children}</>
}

function App() {
  // If a Supabase callback ever lands on the marketing domain, bounce to the platform.
  useEffect(() => {
    ensureOnPlatformOrigin()
  }, [])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<AuthHubPage />} />
      <Route path="/login-legacy" element={<LoginPage />} />
      
      {/* Onboarding Routes */}
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/vera-plus"
        element={
          <ProtectedRoute>
            <VeraPlusDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vera-settings"
        element={
          <ProtectedRoute>
            <VERASettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/vera-plus" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="agentic" element={<AgenticPage />} />
        <Route path="vera" element={<VERAOrbPage />} />
        <Route path="enterprise" element={<EnterpriseDashboard />} />
        <Route path="enterprise-ai" element={<EnterpriseDashboardEnhanced />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/vera-plus" replace />} />
    </Routes>
  )
}

export default App





