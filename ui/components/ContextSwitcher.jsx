import React, { useState, useEffect } from 'react';
import { useContextStore } from '../stores/contextStore';
import './ContextSwitcher.css';

const ContextSwitcher = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    currentContext, 
    availableContexts, 
    isLoading, 
    error,
    loadUserContexts,
    switchContext,
    clearError
  } = useContextStore();

  useEffect(() => {
    loadUserContexts();
  }, [loadUserContexts]);

  // Group contexts by type
  const enterpriseContexts = availableContexts.filter(ctx => ctx.type === 'enterprise');
  const agencyContexts = availableContexts.filter(ctx => ctx.type === 'agency');

  const filteredContexts = availableContexts.filter(ctx =>
    ctx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ctx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContextSelect = async (context) => {
    if (context.id !== currentContext?.id) {
      await switchContext(context.id);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const getContextIcon = (type) => {
    switch (type) {
      case 'enterprise':
        return '🏢';
      case 'agency':
        return '🏛️';
      default:
        return '👤';
    }
  };

  const getContextBadge = (type) => {
    switch (type) {
      case 'enterprise':
        return { text: 'Enterprise', className: 'badge-enterprise' };
      case 'agency':
        return { text: 'Agency', className: 'badge-agency' };
      default:
        return { text: 'User', className: 'badge-user' };
    }
  };

  if (error) {
    return (
      <div className={`context-switcher ${className}`}>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
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
      </div>
    );
  }

  if (isLoading && availableContexts.length === 0) {
    return (
      <div className={`context-switcher ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading contexts...</span>
        </div>
      </div>
    );
  }

  if (!currentContext) {
    return (
      <div className={`context-switcher ${className}`}>
        <div className="no-context-state">
          <span className="no-context-icon">🚫</span>
          <span>No contexts available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`context-switcher ${className}`}>
      <button
        className="context-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isLoading}
      >
        <div className="current-context">
          <span className="context-icon">
            {getContextIcon(currentContext.type)}
          </span>
          <div className="context-info">
            <span className="context-name">{currentContext.name}</span>
            <span className={`context-badge ${getContextBadge(currentContext.type).className}`}>
              {getContextBadge(currentContext.type).text}
            </span>
          </div>
        </div>
        <span className="dropdown-arrow">▼</span>
        {isLoading && <div className="loading-indicator"></div>}
      </button>

      {isOpen && (
        <div className="context-dropdown">
          <div className="dropdown-header">
            <input
              type="text"
              placeholder="Search contexts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="context-search"
            />
          </div>

          <div className="context-sections">
            {enterpriseContexts.length > 0 && (
              <div className="context-section">
                <div className="section-header">
                  <span className="section-icon">🏢</span>
                  <span className="section-title">Enterprise Admin</span>
                </div>
                {filteredContexts
                  .filter(ctx => ctx.type === 'enterprise')
                  .map(context => (
                    <button
                      key={context.id}
                      className={`context-option ${currentContext.id === context.id ? 'active' : ''}`}
                      onClick={() => handleContextSelect(context)}
                      disabled={isLoading}
                    >
                      <span className="context-icon">{getContextIcon(context.type)}</span>
                      <div className="context-details">
                        <span className="context-name">{context.name}</span>
                        <span className="context-role">{context.role}</span>
                      </div>
                      {currentContext.id === context.id && (
                        <span className="active-indicator">✓</span>
                      )}
                    </button>
                  ))}
              </div>
            )}

            {agencyContexts.length > 0 && (
              <div className="context-section">
                <div className="section-header">
                  <span className="section-icon">🏛️</span>
                  <span className="section-title">Agency Seats</span>
                </div>
                {filteredContexts
                  .filter(ctx => ctx.type === 'agency')
                  .map(context => (
                    <button
                      key={context.id}
                      className={`context-option ${currentContext.id === context.id ? 'active' : ''}`}
                      onClick={() => handleContextSelect(context)}
                      disabled={isLoading}
                    >
                      <span className="context-icon">{getContextIcon(context.type)}</span>
                      <div className="context-details">
                        <span className="context-name">{context.name}</span>
                        <span className="context-role">{context.role}</span>
                      </div>
                      {currentContext.id === context.id && (
                        <span className="active-indicator">✓</span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <button 
              className="manage-contexts-btn"
              onClick={() => {
                // Navigate to context management page
                window.location.href = '/settings/contexts';
              }}
            >
              Manage Contexts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher; 