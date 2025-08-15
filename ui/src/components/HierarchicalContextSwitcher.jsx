// File: ui/components/HierarchicalContextSwitcher.jsx

import React, { useState, useEffect } from 'react';
import { useHierarchicalContextStore } from '../stores/hierarchicalContextStore';
import './HierarchicalContextSwitcher.css';

const HierarchicalContextSwitcher = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'enterprise', 'agencySeat'

  const { 
    currentContext, 
    availableContexts, 
    isLoading, 
    error,
    switchContext,
    clearError
  } = useHierarchicalContextStore();

  // Filter contexts based on search and type
  const filteredContexts = availableContexts.filter(ctx => {
    const matchesSearch = ctx.enterpriseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ctx.agencySeatName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ctx.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || ctx.contextType === filterType;
    
    return matchesSearch && matchesType;
  });

  // Group contexts by type
  const enterpriseContexts = filteredContexts.filter(ctx => ctx.contextType === 'enterprise');
  const agencySeatContexts = filteredContexts.filter(ctx => ctx.contextType === 'agencySeat');

  const handleContextSelect = async (context) => {
    if (context.contextId !== currentContext?.contextId) {
      await switchContext(context.contextId);
    }
    setIsOpen(false);
    setSearchTerm('');
    setFilterType('all');
  };

  const getContextIcon = (contextType, role) => {
    if (contextType === 'enterprise') {
      switch (role) {
        case 'enterprise_owner':
          return '👑';
        case 'enterprise_admin':
          return '🏢';
        case 'platform_super_admin':
          return '⭐';
        default:
          return '🏢';
      }
    } else {
      switch (role) {
        case 'seat_admin':
          return '👨‍💼';
        case 'seat_user':
          return '👤';
        default:
          return '🏛️';
      }
    }
  };

  const getContextBadge = (contextType, role) => {
    if (contextType === 'enterprise') {
      switch (role) {
        case 'enterprise_owner':
          return { text: 'Owner', className: 'badge-owner' };
        case 'enterprise_admin':
          return { text: 'Admin', className: 'badge-admin' };
        case 'platform_super_admin':
          return { text: 'Super Admin', className: 'badge-super-admin' };
        default:
          return { text: 'Enterprise', className: 'badge-enterprise' };
      }
    } else {
      switch (role) {
        case 'seat_admin':
          return { text: 'Seat Admin', className: 'badge-seat-admin' };
        case 'seat_user':
          return { text: 'Seat User', className: 'badge-seat-user' };
        default:
          return { text: 'Agency Seat', className: 'badge-agency' };
      }
    }
  };

  const getContextDisplayName = (context) => {
    if (context.contextType === 'enterprise') {
      return context.enterpriseName;
    } else {
      return `${context.agencySeatName} (${context.enterpriseName})`;
    }
  };

  const getContextSubtitle = (context) => {
    if (context.contextType === 'enterprise') {
      return `${context.enterpriseType} • ${context.role.replace('_', ' ')}`;
    } else {
      return `${context.role.replace('_', ' ')} • ${context.enterpriseType}`;
    }
  };

  if (error) {
    return (
      <div className={`hierarchical-context-switcher error ${className}`}>
        <div className="error-message">
          <span>⚠️ Context Error</span>
          <button onClick={clearError} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`hierarchical-context-switcher ${className}`}>
      <button
        className="context-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="loading-spinner">⏳</div>
        ) : currentContext ? (
          <>
            <span className="context-icon">
              {getContextIcon(currentContext.contextType, currentContext.role)}
            </span>
            <div className="context-info">
              <span className="context-name">
                {getContextDisplayName(currentContext)}
              </span>
              <span className="context-role">
                {currentContext.role.replace('_', ' ')}
              </span>
            </div>
            <span className="dropdown-arrow">▼</span>
          </>
        ) : (
          <>
            <span className="context-icon">👤</span>
            <span className="context-name">Select Context</span>
            <span className="dropdown-arrow">▼</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="context-dropdown">
          <div className="dropdown-header">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search contexts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="context-search input-modern"
              />
            </div>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All ({availableContexts.length})
              </button>
              <button
                className={`filter-tab ${filterType === 'enterprise' ? 'active' : ''}`}
                onClick={() => setFilterType('enterprise')}
              >
                Enterprise ({enterpriseContexts.length})
              </button>
              <button
                className={`filter-tab ${filterType === 'agencySeat' ? 'active' : ''}`}
                onClick={() => setFilterType('agencySeat')}
              >
                Agency Seats ({agencySeatContexts.length})
              </button>
            </div>
          </div>

          <div className="context-list">
            {enterpriseContexts.length > 0 && (
              <div className="context-section">
                <div className="section-header">
                  <span className="section-icon">🏢</span>
                  <span className="section-title">Enterprise Contexts</span>
                </div>
                {enterpriseContexts.map(context => (
                  <button
                    key={context.contextId}
                    className={`context-option ${currentContext?.contextId === context.contextId ? 'active' : ''}`}
                    onClick={() => handleContextSelect(context)}
                    disabled={isLoading}
                  >
                    <span className="context-icon">
                      {getContextIcon(context.contextType, context.role)}
                    </span>
                    <div className="context-details">
                      <span className="context-name">
                        {getContextDisplayName(context)}
                      </span>
                      <span className="context-subtitle">
                        {getContextSubtitle(context)}
                      </span>
                    </div>
                    <div className="context-badge">
                      {getContextBadge(context.contextType, context.role).text}
                    </div>
                    {currentContext?.contextId === context.contextId && (
                      <span className="active-indicator">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {agencySeatContexts.length > 0 && (
              <div className="context-section">
                <div className="section-header">
                  <span className="section-icon">🏛️</span>
                  <span className="section-title">Agency Seat Contexts</span>
                </div>
                {agencySeatContexts.map(context => (
                  <button
                    key={context.contextId}
                    className={`context-option ${currentContext?.contextId === context.contextId ? 'active' : ''}`}
                    onClick={() => handleContextSelect(context)}
                    disabled={isLoading}
                  >
                    <span className="context-icon">
                      {getContextIcon(context.contextType, context.role)}
                    </span>
                    <div className="context-details">
                      <span className="context-name">
                        {getContextDisplayName(context)}
                      </span>
                      <span className="context-subtitle">
                        {getContextSubtitle(context)}
                      </span>
                    </div>
                    <div className="context-badge">
                      {getContextBadge(context.contextType, context.role).text}
                    </div>
                    {currentContext?.contextId === context.contextId && (
                      <span className="active-indicator">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredContexts.length === 0 && (
              <div className="no-contexts">
                <span className="no-contexts-icon">🔍</span>
                <span className="no-contexts-text">
                  {searchTerm ? 'No contexts match your search' : 'No contexts available'}
                </span>
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <button 
              className="btn-secondary manage-contexts-btn"
              onClick={() => {
                // Navigate to context management page
                window.location.href = '/settings/contexts';
              }}
            >
              Manage Contexts
            </button>
            <button 
              className="btn-primary create-context-btn"
              onClick={() => {
                // Navigate to context creation page
                window.location.href = '/settings/contexts/create';
              }}
            >
              Create New Context
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalContextSwitcher; 