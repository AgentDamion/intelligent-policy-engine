import React, { useState, useEffect } from 'react';
import { useContextStore } from '../stores/contextStore';
import './NotificationCenter.css';

const NotificationCenter = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, current, enterprise, agency

  const { 
    currentContext,
    notifications, 
    isLoading,
    error,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount
  } = useContextStore();

  useEffect(() => {
    if (currentContext) {
      loadNotifications(filter);
    }
  }, [currentContext, filter, loadNotifications]);

  const getFilteredNotifications = () => {
    if (!currentContext) return [];

    switch (filter) {
      case 'current':
        return notifications.filter(n => 
          n.contextId === currentContext.id
        );
      case 'enterprise':
        return notifications.filter(n => n.contextType === 'enterprise');
      case 'agency':
        return notifications.filter(n => n.contextType === 'agency');
      default:
        return notifications;
    }
  };

  const getContextIcon = (context) => {
    return context === 'enterprise' ? '🏢' : '🏛️';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'alert':
        return '🚨';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification.id);
    }
    // Additional handling for notification click
    console.log('Notification clicked:', notification);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = getUnreadNotificationCount();

  return (
    <div className={`notification-center ${className}`}>
      <button
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        disabled={isLoading}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
        {isLoading && <div className="loading-indicator"></div>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'current' ? 'active' : ''}`}
                onClick={() => setFilter('current')}
              >
                Current
              </button>
              <button
                className={`filter-btn ${filter === 'enterprise' ? 'active' : ''}`}
                onClick={() => setFilter('enterprise')}
              >
                Enterprise
              </button>
              <button
                className={`filter-btn ${filter === 'agency' ? 'active' : ''}`}
                onClick={() => setFilter('agency')}
              >
                Agency
              </button>
            </div>
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="loading-notifications">
                <div className="loading-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="notification-error">
                <span className="error-icon">⚠️</span>
                <p>Failed to load notifications</p>
                <button 
                  className="retry-btn"
                  onClick={() => loadNotifications(filter)}
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">📭</span>
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityColor(notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <span className="notification-type-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <span className="notification-title">
                        {notification.title}
                      </span>
                      <span className="notification-time">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    
                    <div className="notification-context">
                      <span className="context-icon">
                        {getContextIcon(notification.contextType)}
                      </span>
                      <span className="context-name">
                        {notification.contextName}
                      </span>
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
            <button 
              className="view-all-notifications-btn"
              onClick={() => {
                // Navigate to notifications page
                window.location.href = '/notifications';
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 