import React, { useState } from 'react';
import './ContextAwareNavigation.css';

const ContextAwareNavigation = ({ 
  currentContext, 
  onNavigate, 
  className = '' 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Enterprise Navigation Items
  const enterpriseNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/dashboard',
      badge: null
    },
    {
      id: 'policy-management',
      label: 'Policy Management',
      icon: '📋',
      path: '/policy-management',
      badge: '24'
    },
    {
      id: 'seat-management',
      label: 'Seat Management',
      icon: '👥',
      path: '/seat-management',
      badge: '156'
    },
    {
      id: 'audit-center',
      label: 'Audit Center',
      icon: '🔍',
      path: '/audit-center',
      badge: '12'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      path: '/analytics',
      badge: null
    },
    {
      id: 'compliance-reports',
      label: 'Compliance Reports',
      icon: '📄',
      path: '/compliance-reports',
      badge: '3'
    }
  ];

  // Agency Navigation Items
  const agencyNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/dashboard',
      badge: null
    },
    {
      id: 'submissions',
      label: 'Submissions',
      icon: '📝',
      path: '/submissions',
      badge: '8'
    },
    {
      id: 'client-compliance',
      label: 'Client Compliance',
      icon: '👥',
      path: '/client-compliance',
      badge: '12'
    },
    {
      id: 'tool-management',
      label: 'Tool Management',
      icon: '🛠️',
      path: '/tool-management',
      badge: '15'
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: '⚡',
      path: '/workflow',
      badge: null
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📄',
      path: '/reports',
      badge: null
    }
  ];

  // Shared Navigation Items
  const sharedNavItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile',
      badge: null
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      path: '/notifications',
      badge: '5'
    },
    {
      id: 'help',
      label: 'Help',
      icon: '❓',
      path: '/help',
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings',
      badge: null
    }
  ];

  // Get navigation items based on context
  const getNavItems = () => {
    const contextItems = currentContext.type === 'enterprise' 
      ? enterpriseNavItems 
      : agencyNavItems;
    
    return [...contextItems, ...sharedNavItems];
  };

  const navItems = getNavItems();

  const handleNavClick = (item) => {
    onNavigate(item.id);
    setIsMobileMenuOpen(false);
  };

  const getContextIcon = () => {
    return currentContext.type === 'enterprise' ? '🏢' : '🏛️';
  };

  const getContextLabel = () => {
    return currentContext.type === 'enterprise' ? 'Enterprise' : 'Agency';
  };

  return (
    <nav className={`context-aware-navigation ${className}`}>
      <div className="nav-header">
        <div className="nav-brand">
          <span className="brand-icon">🦜</span>
          <span className="brand-name">AICOMPLYR</span>
        </div>
        
        <div className="context-indicator">
          <span className="context-icon">{getContextIcon()}</span>
          <span className="context-label">{getContextLabel()}</span>
        </div>
      </div>

      <div className="nav-content">
        <div className="nav-section">
          <h3 className="section-title">
            {currentContext.type === 'enterprise' ? 'Enterprise Admin' : 'Agency Workflow'}
          </h3>
          
          <ul className="nav-list">
            {navItems
              .filter(item => item.id !== 'dashboard') // Dashboard is handled separately
              .map(item => (
                <li key={item.id} className="nav-item">
                  <button
                    className="nav-link"
                    onClick={() => handleNavClick(item)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              ))}
          </ul>
        </div>

        <div className="nav-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="user-details">
              <span className="user-name">{currentContext.name}</span>
              <span className="user-role">{currentContext.role}</span>
            </div>
          </div>
          
          <button className="logout-btn">
            <span className="logout-icon">🚪</span>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <h3>Navigation</h3>
              <button 
                className="close-menu-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <ul className="mobile-nav-list">
              {navItems.map(item => (
                <li key={item.id} className="mobile-nav-item">
                  <button
                    className="mobile-nav-link"
                    onClick={() => handleNavClick(item)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ContextAwareNavigation; 