import React from "react";
import SystemStatus from "../components/SystemStatus";
import AgentStatus from "../components/AgentStatus";
import ActivityFeed from "../components/ActivityFeed";
import "../styles/dashboard.css";

const Dashboard: React.FC = () => {
  return (
    <div>
      <main className="dashboard-main">
        <div className="dashboard-grid">
          <SystemStatus />
          <AgentStatus />
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 