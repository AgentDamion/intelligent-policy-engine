import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: string;
  details: Record<string, any>;
  created_at: string;
  user_id: string;
}

interface ActivityResponse {
  activities: AgentActivity[];
  total: number;
  limit: number;
  offset: number;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll use a mock token - in production this should come from auth context
      const token = localStorage.getItem('auth_token') || 'mock-token';
      
      const response = await fetch('http://localhost:3001/api/agent/activity?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in.');
        } else {
          setError(`Failed to fetch activities: ${response.statusText}`);
        }
        return;
      }

      const data: ActivityResponse = await response.json();
      setActivities(data.activities || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up polling for updates every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="status-card">
        <h2>Activity Feed</h2>
        <div className="activity-feed">
          <div className="loading-spinner" />
          <span>Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-card">
        <h2>Activity Feed</h2>
        <div className="activity-feed">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchActivities} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-card">
      <h2>Activity Feed</h2>
      <div className="activity-feed">
        {activities.length === 0 ? (
          <div className="activity-placeholder">
            <p>No agent activities yet. Activities will appear here once agents start working.</p>
          </div>
        ) : (
          <>
            <div className="activity-header">
              <span className="activity-count">{total} total activities</span>
              <button onClick={fetchActivities} className="refresh-button">
                Refresh
              </button>
            </div>
            <div className="activity-list">
              {activities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-main">
                    <span className={`status-indicator ${getStatusColor(activity.status)}`} />
                    <span className="agent-name">{activity.agent}</span>
                    <span className="activity-action">{activity.action}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{formatTimestamp(activity.created_at)}</span>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <span className="activity-details">
                        {JSON.stringify(activity.details, null, 2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed; 