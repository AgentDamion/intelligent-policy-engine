import React from "react";
import "../styles/dashboard.css";

const ActivityFeed: React.FC = () => {
  return (
    <div className="status-card">
      <h2>Activity Feed</h2>
      <div className="activity-feed">
        <div className="activity-placeholder">
          <p>Agent activity will appear here once agents are initialized</p>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed; 