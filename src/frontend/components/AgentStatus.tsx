import React from "react";
import "../styles/dashboard.css";

const AgentStatus: React.FC = () => {
  return (
    <div className="status-card">
      <h2>Agent Status</h2>
      <div className="agent-grid">
        <div className="agent-placeholder">
          <p>No agents initialized yet - Agents arrive in Week 4</p>
          <p className="text-sm text-gray-500">Future agent activity will animate here</p>
        </div>
      </div>
    </div>
  );
};

export default AgentStatus; 