import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";

interface SystemStatusProps {
  status: string;
  uptime: string;
  timestamp: string;
}

const getStatusColor = (status: string) => {
  if (status === "operational") return "status-indicator";
  if (status === "degraded") return "status-indicator yellow";
  if (status === "down") return "status-indicator red";
  return "status-indicator yellow";
};

function formatUptime(uptime: string) {
  // Accepts seconds as string or formatted string
  const sec = parseInt(uptime, 10);
  if (isNaN(sec)) return uptime;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

const SystemStatus: React.FC = () => {
  const [data, setData] = useState<SystemStatusProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("http://localhost:3001/api/status")
      .then((res) => res.json())
      .then((d) => {
        if (mounted) {
          setData({
            status: d.status,
            uptime: d.uptime || "0",
            timestamp: d.timestamp,
          });
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="status-card">
        <div className="loading-spinner" />
        <span>Loading system status...</span>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="status-card">
        <span className="status-indicator red" />
        <span>Unable to load system status</span>
      </div>
    );
  }
  return (
    <div className="status-card">
      <h2>System Status</h2>
      <div className="status-details">
        <p>
          <span className={getStatusColor(data.status)} />
          Status: <span className="status-value">{data.status}</span>
        </p>
        <p>
          Uptime: <span className="status-value">{formatUptime(data.uptime)}</span>
        </p>
        <p>
          Last Update: <span className="status-value">{new Date(data.timestamp).toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};

export default SystemStatus; 