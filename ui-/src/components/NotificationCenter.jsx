import React, { useState, useEffect } from 'react';
import './NotificationCenter.css';

const NotificationCenter = ({ notifications = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Count unread notifications
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    notification.read = true;
    console.log('📧 Notification clicked:', notification);
  };

  const markAllAsRead = () => {
    notifications.forEach(n => n.read = true);
    setUnreadCount(0);
    console.log('📧 Marked all notifications as read');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'workflow': return '🔄';
      case 'agent': return '🤖';
      default: return '📧';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'var(--accent-green)';
      case 'warning': return 'var(--accent-orange)';
      case 'error': return 'var(--accent-red)';
      case 'info': return 'var(--primary-blue)';
      case 'workflow': return 'var(--accent-purple)';
      case 'agent': return 'var(--secondary-blue)';
      default: return 'var(--gray-500)';
    }
  };

  return (
    <div className="notification-center">
      {/* Notification Bell */}
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3 className="notification-title">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">📭</span>
                <p className="no-notifications-text">No notifications</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div 
                    className="notification-icon"
                    style={{ color: getNotificationColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {notification.timestamp ? 
                        new Date(notification.timestamp).toLocaleTimeString() : 
                        'Just now'
                      }
                    </span>
                  </div>

                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="view-all-notifications">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 