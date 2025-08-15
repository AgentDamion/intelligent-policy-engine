import React, { useState, useEffect } from 'react';
import './PolicyDistributionDashboard.css';

const PolicyDistributionDashboard = () => {
  const [activeTab, setActiveTab] = useState('distributions');
  const [distributions, setDistributions] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [agencies, setAgencies] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchDistributions();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/policy-distribution/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/policy-distribution/distributions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDistributions(data);
      }
    } catch (error) {
      console.error('Error fetching distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async (agencyId) => {
    try {
      const response = await fetch(`/api/policy-distribution/compliance/${agencyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCompliance(data);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  };

  const fetchConflicts = async (agencyId) => {
    try {
      const response = await fetch(`/api/policy-distribution/conflicts/${agencyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConflicts(data);
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    }
  };

  const handleDistributePolicy = async (policyId, agencyIds) => {
    try {
      const response = await fetch('/api/policy-distribution/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          policy_id: policyId,
          agency_ids: agencyIds
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Policy distributed to ${result.distributions.length} agencies`);
        fetchDistributions();
        setShowDistributeModal(false);
      }
    } catch (error) {
      console.error('Error distributing policy:', error);
      alert('Failed to distribute policy');
    }
  };

  const handleAcknowledgeDistribution = async (distributionId) => {
    try {
      const response = await fetch(`/api/policy-distribution/distributions/${distributionId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        fetchDistributions();
      }
    } catch (error) {
      console.error('Error acknowledging distribution:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'orange';
      case 'compliant': return 'green';
      case 'non_compliant': return 'red';
      case 'unresolved': return 'red';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="policy-distribution-dashboard">
      <div className="dashboard-header">
        <h1>Policy Distribution & Sync Dashboard</h1>
      <div className="dashboard-stats">
        <div className="stat-card card-modern">
            <h3>Total Distributions</h3>
            <p>{dashboard.distributions?.total_distributions || 0}</p>
          </div>
        <div className="stat-card card-modern">
            <h3>Active Distributions</h3>
            <p>{dashboard.distributions?.active_distributions || 0}</p>
          </div>
        <div className="stat-card card-modern">
            <h3>Compliance Rate</h3>
            <p>{dashboard.compliance?.avg_compliance_score?.toFixed(1) || 0}%</p>
          </div>
        <div className="stat-card card-modern">
            <h3>Unresolved Conflicts</h3>
            <p>{dashboard.conflicts?.unresolved_conflicts || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'distributions' ? 'active' : ''}`}
          onClick={() => setActiveTab('distributions')}
        >
          Policy Distributions
        </button>
        <button 
          className={`tab ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance Tracking
        </button>
        <button 
          className={`tab ${activeTab === 'conflicts' ? 'active' : ''}`}
          onClick={() => setActiveTab('conflicts')}
        >
          Policy Conflicts
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'distributions' && (
          <div className="distributions-section">
            <div className="section-header">
              <h2>Policy Distributions</h2>
              <button 
                className="btn-primary"
                onClick={() => setShowDistributeModal(true)}
              >
                Distribute Policy
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Loading distributions...</div>
            ) : (
              <div className="distributions-list">
                {distributions.map((distribution) => (
                  <div key={distribution.id} className="distribution-card card-modern">
                    <div className="distribution-header">
                      <h3>{distribution.policy_name}</h3>
                      <span className={`status ${getStatusColor(distribution.distribution_status)}`}>
                        {distribution.distribution_status}
                      </span>
                    </div>
                    <div className="distribution-details">
                      <p><strong>Agency:</strong> {distribution.agency_name}</p>
                      <p><strong>Version:</strong> {distribution.version_number}</p>
                      <p><strong>Distributed:</strong> {new Date(distribution.distributed_at).toLocaleDateString()}</p>
                      {distribution.acknowledged_at && (
                        <p><strong>Acknowledged:</strong> {new Date(distribution.acknowledged_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="distribution-actions">
                      {!distribution.acknowledged_at && (
                        <button 
                          className="btn-success"
                          onClick={() => handleAcknowledgeDistribution(distribution.id)}
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="compliance-section">
            <h2>Compliance Tracking</h2>
            <div className="compliance-list">
              {compliance.map((record) => (
                <div key={record.id} className="compliance-card card-modern">
                  <div className="compliance-header">
                    <h3>{record.policy_name}</h3>
                    <span className={`status ${getStatusColor(record.compliance_status)}`}>
                      {record.compliance_status}
                    </span>
                  </div>
                  <div className="compliance-details">
                    <p><strong>Enterprise:</strong> {record.enterprise_name}</p>
                    <p><strong>Compliance Score:</strong> {record.compliance_score}%</p>
                    <p><strong>Violations:</strong> {record.violations_count}</p>
                    <p><strong>Last Assessment:</strong> {new Date(record.last_assessment_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div className="conflicts-section">
            <h2>Policy Conflicts</h2>
            <div className="conflicts-list">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="conflict-card card-modern">
                  <div className="conflict-header">
                    <h3>{conflict.conflict_type}</h3>
                    <span className={`severity ${getSeverityColor(conflict.severity)}`}>
                      {conflict.severity}
                    </span>
                  </div>
                  <div className="conflict-details">
                    <p><strong>Policy A:</strong> {conflict.policy_a_name}</p>
                    <p><strong>Policy B:</strong> {conflict.policy_b_name}</p>
                    <p><strong>Description:</strong> {conflict.conflict_description}</p>
                    <p><strong>Status:</strong> {conflict.resolution_status}</p>
                    <p><strong>Detected:</strong> {new Date(conflict.detected_at).toLocaleDateString()}</p>
                  </div>
                  {conflict.resolution_notes && (
                    <div className="resolution-notes">
                      <p><strong>Resolution Notes:</strong> {conflict.resolution_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDistributeModal && (
        <PolicyDistributeModal 
          onClose={() => setShowDistributeModal(false)}
          onDistribute={handleDistributePolicy}
        />
      )}
    </div>
  );
};

const PolicyDistributeModal = ({ onClose, onDistribute }) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [selectedAgencyIds, setSelectedAgencyIds] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [agencies, setAgencies] = useState([]);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setPolicies([
      { id: '1', name: 'Data Privacy Policy', description: 'GDPR compliance requirements' },
      { id: '2', name: 'FDA Compliance Policy', description: 'FDA regulatory requirements' },
      { id: '3', name: 'AI Ethics Policy', description: 'AI ethics and bias prevention' }
    ]);
    
    setAgencies([
      { id: '1', name: 'Digital Marketing Agency A' },
      { id: '2', name: 'Creative Agency B' },
      { id: '3', name: 'Media Agency C' }
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPolicyId && selectedAgencyIds.length > 0) {
      onDistribute(selectedPolicyId, selectedAgencyIds);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Distribute Policy</h2>
          <button className="btn-secondary" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Policy:</label>
            <select 
              value={selectedPolicyId} 
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              required
            >
              <option value="">Choose a policy...</option>
              {policies.map(policy => (
                <option key={policy.id} value={policy.id}>
                  {policy.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Select Agencies:</label>
            <div className="checkbox-group">
              {agencies.map(agency => (
                <label key={agency.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={agency.id}
                    checked={selectedAgencyIds.includes(agency.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAgencyIds([...selectedAgencyIds, agency.id]);
                      } else {
                        setSelectedAgencyIds(selectedAgencyIds.filter(id => id !== agency.id));
                      }
                    }}
                  />
                  {agency.name}
                </label>
              ))}
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Distribute Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyDistributionDashboard; 