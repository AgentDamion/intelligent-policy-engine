import React, { useState } from "react";
import "../styles/dashboard.css";

interface Conflict {
  id: string;
  type: string;
  severity: string;
  description: string;
  affected_policies: string[];
  recommendation: string;
}

interface ConflictReport {
  conflicts: Conflict[];
  overallSeverity: string;
  summary: string;
  timestamp: string;
}

const ConflictDetection: React.FC = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  const samplePolicies = [
    {
      id: "policy-1",
      name: "AI Content Review Policy",
      content: "All AI-generated content must be reviewed by human editors before publication."
    },
    {
      id: "policy-2", 
      name: "Data Privacy Policy",
      content: "Personal data must be anonymized before processing by AI systems."
    },
    {
      id: "policy-3",
      name: "Compliance Policy",
      content: "All content must comply with FDA regulations for pharmaceutical advertising."
    }
  ];

  const analyzeConflicts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token') || 'mock-token';
      
      const response = await fetch('http://localhost:3001/api/analyze-conflicts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ policies: samplePolicies })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in.');
        } else {
          setError(`Failed to analyze conflicts: ${response.statusText}`);
        }
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setConflicts(result.data.conflicts || []);
        setLastAnalysis(new Date().toLocaleString());
      } else {
        setError(result.error || 'Failed to analyze conflicts');
      }
    } catch (err) {
      console.error('Error analyzing conflicts:', err);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="status-card">
      <h2>Conflict Detection</h2>
      <div className="conflict-detection">
        <div className="conflict-controls">
          <button 
            onClick={analyzeConflicts} 
            disabled={loading}
            className="analyze-button"
          >
            {loading ? 'Analyzing...' : 'Analyze Sample Policies'}
          </button>
          {lastAnalysis && (
            <span className="last-analysis">
              Last analysis: {lastAnalysis}
            </span>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={analyzeConflicts} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="conflicts-list">
            <h3>Detected Conflicts ({conflicts.length})</h3>
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="conflict-item">
                <div className="conflict-header">
                  <span className={`severity-indicator ${getSeverityColor(conflict.severity)}`}>
                    {getSeverityIcon(conflict.severity)} {conflict.severity.toUpperCase()}
                  </span>
                  <span className="conflict-type">{conflict.type}</span>
                </div>
                <div className="conflict-description">
                  {conflict.description}
                </div>
                <div className="conflict-details">
                  <div className="affected-policies">
                    <strong>Affected Policies:</strong>
                    <ul>
                      {conflict.affected_policies.map((policyId, index) => (
                        <li key={index}>{policyId}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="recommendation">
                    <strong>Recommendation:</strong>
                    <p>{conflict.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && conflicts.length === 0 && lastAnalysis && (
          <div className="no-conflicts">
            <p>✅ No conflicts detected in the analyzed policies.</p>
          </div>
        )}

        {!loading && !error && !lastAnalysis && (
          <div className="conflict-placeholder">
            <p>Click "Analyze Sample Policies" to detect potential conflicts between policies.</p>
            <div className="sample-policies">
              <h4>Sample Policies:</h4>
              <ul>
                {samplePolicies.map((policy) => (
                  <li key={policy.id}>
                    <strong>{policy.name}</strong>: {policy.content}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConflictDetection;
