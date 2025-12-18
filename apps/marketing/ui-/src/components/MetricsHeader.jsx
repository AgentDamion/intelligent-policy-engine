import React, { useState, useEffect } from 'react';
import './MetricsHeader.css';

const MetricsHeader = ({ className = '' }) => {
  const [metrics, setMetrics] = useState({
    auditTasks: '3.2M',
    fasterDecisions: '87%',
    realTimeTransparency: '24/7'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch live metrics from the dashboard API
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/live-metrics');
        if (response.ok) {
          const data = await response.json();
          
          // Transform API data to match our display format
          setMetrics({
            auditTasks: `${(data.metrics?.auditEvents / 1000000).toFixed(1)}M`,
            fasterDecisions: `${data.metrics?.complianceRate || 87}%`,
            realTimeTransparency: '24/7'
          });
        }
      } catch (error) {
        console.warn('Failed to fetch live metrics, using default values:', error);
        // Keep default values if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const MetricCard = ({ title, value, subtitle, icon, variant = 'default' }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'success':
          return 'metric-card-success';
        case 'warning':
          return 'metric-card-warning';
        case 'info':
          return 'metric-card-info';
        default:
          return 'metric-card-default';
      }
    };

    return (
      <div className={`metric-card ${getVariantClasses()}`}>
        <div className="metric-card-content">
          <div className="metric-icon">
            <span className="metric-icon-text">{icon}</span>
          </div>
          <div className="metric-details">
            <div className="metric-value">
              {isLoading ? (
                <div className="metric-skeleton"></div>
              ) : (
                value
              )}
            </div>
            <div className="metric-title">{title}</div>
            {subtitle && (
              <div className="metric-subtitle">{subtitle}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`metrics-header ${className}`}>
      <div className="metrics-container">
        <MetricCard
          title="Audit tasks Historical"
          value={metrics.auditTasks}
          subtitle="Comprehensive audit trail"
          icon="📊"
          variant="info"
        />
        
        <MetricCard
          title="Faster decisions"
          value={metrics.fasterDecisions}
          subtitle="AI-powered automation"
          icon="⚡"
          variant="success"
        />
        
        <MetricCard
          title="Real Time Transparency"
          value={metrics.realTimeTransparency}
          subtitle="Live governance stream"
          icon="🔍"
          variant="warning"
        />
      </div>
    </div>
  );
};

export default MetricsHeader; 