import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
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

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  useEffect(() => {
    // Send to Sentry if available
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        {import.meta.env.DEV && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500">Error details</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="flex gap-2">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  // If a Supabase callback ever lands on the marketing domain, bounce to the platform.
  useEffect(() => {
    ensureOnPlatformOrigin()
  }, [])

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
    </ErrorBoundary>
  )
}

export default App





