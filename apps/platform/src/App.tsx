import React, { useEffect, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { useAuth } from './contexts/AuthContext'
import { useEnterprise } from './contexts/EnterpriseContext'
import { ensureOnPlatformOrigin } from './utils/platformOrigin'

// Components
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import AuthHubPage from './pages/auth/AuthHubPage'
import VERASettingsPage from './pages/VERASettingsPage'
import SettingsPage from './pages/SettingsPage'
import WorkspacesPage from './pages/WorkspacesPage'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Surface-First Pages
const MissionControl = React.lazy(() => import('./pages/mission/Overview'))
const Triage = React.lazy(() => import('./pages/inbox/ThreadList'))
const DecisionSurface = React.lazy(() => import('./pages/decisions/Queue'))
const TheForge = React.lazy(() => import('./pages/forge/PolicyStudio'))
const EvidenceVault = React.lazy(() => import('./pages/proof/Vault'))
const SimulationLab = React.lazy(() => import('./pages/lab/Replay'))
const WorkflowBuilderPage = React.lazy(() => import('./pages/workflow/WorkflowBuilderPage'))
const PartnerWorkspacePage = React.lazy(() => import('./pages/partner/PartnerWorkspace'))
const NewRequestPage = React.lazy(() => import('./pages/partner/NewRequestPage'))
const VisibilityControlsPage = React.lazy(() => import('./pages/msa/VisibilityControlsPage'))
const ToolLookupDemo = React.lazy(() => import('./pages/ToolLookupDemo'))

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
      <div className="max-w-md w-full bg-white shadow-lg rounded-none p-6">
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
            <MissionControl />
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
        <Route index element={<Navigate to="/mission" replace />} />
        
        {/* Surface-First Routes */}
        <Route path="mission" element={<Suspense fallback={<LoadingSpinner />}><MissionControl /></Suspense>} />
        
        <Route path="inbox" element={<Suspense fallback={<LoadingSpinner />}><Triage /></Suspense>} />
        <Route path="inbox/:threadId" element={<Suspense fallback={<LoadingSpinner />}><Triage /></Suspense>} />
        
        <Route path="decisions" element={<Suspense fallback={<LoadingSpinner />}><DecisionSurface /></Suspense>} />
        <Route path="decisions/:decisionId" element={<Suspense fallback={<LoadingSpinner />}><DecisionSurface /></Suspense>} />
        
        <Route path="forge" element={<Suspense fallback={<LoadingSpinner />}><TheForge /></Suspense>} />
        <Route path="forge/policies/:id" element={<Suspense fallback={<LoadingSpinner />}><TheForge /></Suspense>} />
        
        <Route path="proof" element={<Suspense fallback={<LoadingSpinner />}><EvidenceVault /></Suspense>} />
        <Route path="proof/bundles/:id" element={<Suspense fallback={<LoadingSpinner />}><EvidenceVault /></Suspense>} />
        
        <Route path="lab" element={<Suspense fallback={<LoadingSpinner />}><SimulationLab /></Suspense>} />
        <Route path="lab/replays/:id" element={<Suspense fallback={<LoadingSpinner />}><SimulationLab /></Suspense>} />
        
        <Route path="workflows" element={<Suspense fallback={<LoadingSpinner />}><WorkflowBuilderPage /></Suspense>} />
        <Route path="workflows/:agencyId/:clientId" element={<Suspense fallback={<LoadingSpinner />}><WorkflowBuilderPage /></Suspense>} />
        <Route path="workflows/:agencyId/:clientId/:brandId" element={<Suspense fallback={<LoadingSpinner />}><WorkflowBuilderPage /></Suspense>} />
        <Route path="workflows/:agencyId/:clientId/:brandId/:workflowId" element={<Suspense fallback={<LoadingSpinner />}><WorkflowBuilderPage /></Suspense>} />
        
        <Route path="partner" element={<Suspense fallback={<LoadingSpinner />}><PartnerWorkspacePage /></Suspense>} />
        <Route path="partner/requests/new" element={<Suspense fallback={<LoadingSpinner />}><NewRequestPage /></Suspense>} />
        <Route path="workspace" element={<Suspense fallback={<LoadingSpinner />}><PartnerWorkspacePage /></Suspense>} />
        
        <Route path="msa/visibility" element={<Suspense fallback={<LoadingSpinner />}><VisibilityControlsPage /></Suspense>} />
        <Route path="msa/visibility/:agencyId/:clientId" element={<Suspense fallback={<LoadingSpinner />}><VisibilityControlsPage /></Suspense>} />

        {/* Tool Lookup Demo */}
        <Route path="tool-lookup-demo" element={<Suspense fallback={<LoadingSpinner />}><ToolLookupDemo /></Suspense>} />

        {/* Compatibility Redirects */}
        <Route path="dashboard" element={<Navigate to="/mission" replace />} />
        <Route path="vera-plus" element={<Navigate to="/mission" replace />} />
        <Route path="agentic" element={<Navigate to="/inbox" replace />} />
        <Route path="enterprise" element={<Navigate to="/mission" replace />} />
        <Route path="policies" element={<Navigate to="/forge" replace />} />
        
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/mission" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App





