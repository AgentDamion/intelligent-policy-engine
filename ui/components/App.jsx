import React, { useState, useEffect } from 'react';
import ContextSwitcher from './ContextSwitcher';
import ContextAwareDashboard from './ContextAwareDashboard';
import ContextAwareNavigation from './ContextAwareNavigation';
import NotificationCenter from './NotificationCenter';
import { useContextStore } from '../stores/contextStore';
import './App.css';

const App = () => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  
  const { 
    currentContext, 
    isLoading, 
    error,
    loadUserContexts,
    loadUserProfile,
    clearError
  } = useContextStore();

  useEffect(() => {
    // Load user contexts and profile on app initialization
    loadUserContexts();
    loadUserProfile();
  }, [loadUserContexts, loadUserProfile]);

  const handleNavigate = (route) => {
    setCurrentRoute(route);
  };

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    // Handle notification click - could navigate to specific page
    // or show modal with notification details
  };

  if (isLoading && !currentContext) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading AICOMPLYR...</p>
      </div>
    );
  }

  if (error && !currentContext) {
    return (
      <div className="app-error">
        <h2>Failed to Load Application</h2>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => {
            clearError();
            loadUserContexts();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!currentContext) {
    return (
      <div className="app-error">
        <h2>No Context Available</h2>
        <p>Please contact your administrator to set up your access.</p>
        <button 
          className="retry-btn"
          onClick={() => loadUserContexts()}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <ContextSwitcher />
        </div>
        
        <div className="header-right">
          <NotificationCenter />
        </div>
      </header>

      <div className="app-main">
        <aside className="app-sidebar">
          <ContextAwareNavigation
            currentContext={currentContext}
            onNavigate={handleNavigate}
          />
        </aside>

        <main className="app-content">
          <ContextAwareDashboard
            onNavigate={handleNavigate}
          />
        </main>
      </div>

      {/* Route-based content rendering */}
      {currentRoute !== 'dashboard' && (
        <div className="route-content">
          <div className="route-header">
            <h2>{currentRoute.replace('-', ' ').toUpperCase()}</h2>
            <button 
              className="back-to-dashboard-btn"
              onClick={() => setCurrentRoute('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          
          <div className="route-body">
            <p>Content for {currentRoute} will be rendered here.</p>
            <p>Current context: {currentContext.name} ({currentContext.type})</p>
          </div>
        </div>
      )}

      {/* Global error boundary */}
      {error && (
        <div className="global-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button 
              className="dismiss-btn"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App; 