// Example App.tsx showcasing the Modern Authentication Hub integration
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthProvider';
import AuthHubPage from '@/app/auth/AuthHubPage';
import { useAuth } from '@/hooks/useAuth';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  if (session.mfaRequired) {
    return <Navigate to="/auth/mfa" replace />;
  }
  
  return <>{children}</>;
};

// Placeholder dashboard component
const Dashboard: React.FC = () => {
  const { session, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to aicomplyr.io</h1>
          <p className="mb-4">You are logged in as: {session?.email}</p>
          <p className="mb-4">Organization ID: {session?.orgId || 'Not set'}</p>
          <p className="mb-4">Roles: {session?.roles?.join(', ') || 'None'}</p>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// MFA Setup placeholder
const MFASetup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Set up Multi-Factor Authentication</h1>
          <p className="text-gray-600 mb-4">
            Secure your account with an additional layer of protection.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App component with authentication
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public authentication route */}
          <Route path="/auth" element={<AuthHubPage />} />
          
          {/* MFA setup route */}
          <Route path="/auth/mfa" element={<MFASetup />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
