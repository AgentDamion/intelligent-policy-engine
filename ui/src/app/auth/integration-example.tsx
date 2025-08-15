// Example integration for the Modern Authentication Hub
// This shows how to integrate the auth hub into your main React app

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import AuthHubPage from './AuthHubPage';
import { useAuth } from '../../hooks/useAuth';

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

// Main App component
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthHubPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/policies"
            element={
              <ProtectedRoute>
                <div>Policy Management</div>
              </ProtectedRoute>
            }
          />
          
          {/* MFA setup route */}
          <Route
            path="/auth/mfa"
            element={
              <div>MFA Setup Page (TODO)</div>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Example of using auth in a component
export const ExampleAuthComponent: React.FC = () => {
  const { session, logout } = useAuth();
  
  return (
    <div className="p-4">
      <p>Welcome, {session?.email}!</p>
      <p>Organization: {session?.orgId}</p>
      <p>Roles: {session?.roles?.join(', ')}</p>
      <button onClick={logout} className="text-blue-600 hover:text-blue-500">
        Sign out
      </button>
    </div>
  );
};

// Example of role-based rendering
export const RoleBasedComponent: React.FC = () => {
  const { session } = useAuth();
  const isAdmin = session?.roles?.includes('admin');
  const isReviewer = session?.roles?.includes('reviewer');
  
  return (
    <div>
      {isAdmin && (
        <div className="p-4 bg-red-50 rounded">
          <h3>Admin Section</h3>
          <p>Only visible to admins</p>
        </div>
      )}
      
      {isReviewer && (
        <div className="p-4 bg-blue-50 rounded">
          <h3>Reviewer Section</h3>
          <p>Only visible to reviewers</p>
        </div>
      )}
      
      <div className="p-4 bg-gray-50 rounded">
        <h3>General Section</h3>
        <p>Visible to all authenticated users</p>
      </div>
    </div>
  );
};
