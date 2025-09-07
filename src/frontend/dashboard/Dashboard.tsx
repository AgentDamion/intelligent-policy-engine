import React from "react";
import SystemStatus from "../components/SystemStatus";
import AgentStatus from "../components/AgentStatus";
import ActivityFeed from "../components/ActivityFeed";
import ConflictDetection from "../components/ConflictDetection";
import "../styles/dashboard.css";

const Dashboard: React.FC = () => {
  return (
    <div>
      <header className="dashboard-header">
        <h1>AI Policy Engine Dashboard</h1>
        <p>Monitor agent activities, system status, and policy conflicts</p>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-grid">
          <SystemStatus />
          <AgentStatus />
          <ActivityFeed />
          <ConflictDetection />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 