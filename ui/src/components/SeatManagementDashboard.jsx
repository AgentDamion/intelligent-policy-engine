import React, { useState, useEffect } from 'react';
import { useContextStore } from '../stores/contextStore';
import { contextApi } from '../services/contextApi';
import CreateSeatModal from './CreateSeatModal';
import BulkPolicyAssignmentModal from './BulkPolicyAssignmentModal';
import './SeatManagementDashboard.css';

// Seat Metric Card Component
const SeatMetricCard = ({ title, value, total, icon: Icon, trend, variant = 'default' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'danger':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo';
    }
  };

  return (
    <div className={`seat-metric-card ${getVariantClasses()}`}>
      <div className="metric-header">
        <div className="metric-icon">
          {Icon && <Icon size={24} />}
        </div>
        <div className="metric-info">
          <h3 className="metric-title">{title}</h3>
          <div className="metric-value">
            {value}
            {total && <span className="metric-total">/ {total}</span>}
          </div>
          {trend && <div className="metric-trend">{trend}</div>}
        </div>
      </div>
    </div>
  );
};

// Seat Card Component
const SeatCard = ({ seat, isSelected, onSelect, onAction }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'pending':
        return 'status-pending';
      case 'suspended':
        return 'status-suspended';
      default:
        return 'status-default';
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`seat-card ${isSelected ? 'seat-card-selected' : ''}`}>
      {/* Seat Header */}
      <div className="seat-header">
        <div className="seat-selection">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="seat-checkbox"
          />
          <div className="seat-info">
            <h3 className="seat-name">{seat.name}</h3>
            <p className="seat-admin">{seat.adminName}</p>
          </div>
        </div>
        <div className={`seat-status ${getStatusColor(seat.status)}`}>
          {seat.status}
        </div>
      </div>

      {/* Seat Metrics */}
      <div className="seat-metrics">
        <div className="metric-row">
          <span className="metric-label">Users:</span>
          <span className="metric-value">{seat.activeUsers}/{seat.userLimit}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Compliance Score:</span>
          <span className={`metric-value ${getComplianceColor(seat.complianceScore)}`}>
            {seat.complianceScore}%
          </span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Last Activity:</span>
          <span className="metric-value">{seat.lastActivity}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Policies:</span>
          <span className="metric-value">{seat.activePolicies}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="seat-actions">
        <button
          onClick={() => onAction('manage', seat.id)}
          className="action-btn action-manage"
        >
          Manage
        </button>
        <button
          onClick={() => onAction('view-compliance', seat.id)}
          className="action-btn action-details"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

// Seat Grid Component
const SeatGrid = ({ seats, selectedSeats, onSeatSelect, onSeatAction }) => {
  const handleSeatSelection = (seatId) => {
    onSeatSelect(seatId);
  };

  return (
    <div className="seat-grid">
      {seats.map(seat => (
        <SeatCard
          key={seat.id}
          seat={seat}
          isSelected={selectedSeats.includes(seat.id)}
          onSelect={() => handleSeatSelection(seat.id)}
          onAction={onSeatAction}
        />
      ))}
    </div>
  );
};

// Main Seat Management Dashboard
export const SeatManagementDashboard = () => {
  const { currentContext, dashboardData } = useContextStore();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Load seats data
  useEffect(() => {
    if (currentContext?.type === 'enterprise') {
      loadSeats();
      loadAnalytics();
    }
  }, [currentContext]);

  const loadSeats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const seatsData = await contextApi.getEnterpriseSeats(currentContext.id);
      setSeats(seatsData.seats || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await contextApi.getSeatAnalytics(currentContext.id);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleSeatSelection = (seatId) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleSeatAction = (action, seatId) => {
    switch (action) {
      case 'manage':
        // Navigate to seat management page
        window.location.href = `/enterprise/seats/${seatId}/manage`;
        break;
      case 'view-compliance':
        // Open compliance report modal
        window.location.href = `/enterprise/seats/${seatId}/compliance`;
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleBulkPolicyAssignment = () => {
    setShowBulkModal(true);
  };

  const handleSeatCreated = (newSeat) => {
    setSeats(prev => [...prev, newSeat]);
    setShowCreateModal(false);
  };

  const handleBulkAssignment = async (policyIds, options) => {
    try {
      await contextApi.bulkAssignPolicies(
        currentContext.id,
        selectedSeats,
        policyIds,
        options
      );
      setShowBulkModal(false);
      setSelectedSeats([]);
      // Reload seats to reflect changes
      loadSeats();
    } catch (err) {
      console.error('Bulk assignment failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="seat-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading seat management dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seat-management-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to load seat data</h3>
        <p>{error}</p>
        <button 
          className="btn-primary"
          onClick={loadSeats}
        >
          Retry
        </button>
      </div>
    );
  }

  const activeSeats = seats.filter(s => s.status === 'active');
  const avgComplianceScore = seats.length > 0 
    ? Math.round(seats.reduce((sum, seat) => sum + seat.complianceScore, 0) / seats.length)
    : 0;
  const violations = seats.reduce((sum, seat) => sum + (seat.violations || 0), 0);
  const monthlyCost = seats.length * 150; // $150 per seat

  return (
    <div className="seat-management-dashboard">
      {/* Seat Overview Cards */}
      <div className="seat-overview">
        <SeatMetricCard 
          title="Active Seats" 
          value={activeSeats.length}
          total={currentContext?.maxSeats}
          icon="👥"
          trend={`+${seats.filter(s => s.status === 'pending').length} pending`}
        />
        <SeatMetricCard 
          title="Avg Compliance Score" 
          value={`${avgComplianceScore}%`}
          icon="📈"
          trend={`${avgComplianceScore > 85 ? '+' : ''}${avgComplianceScore - 85}% vs target`}
          variant={avgComplianceScore >= 90 ? 'success' : avgComplianceScore >= 70 ? 'warning' : 'danger'}
        />
        <SeatMetricCard 
          title="Policy Violations" 
          value={violations}
          icon="⚠️"
          trend="2 resolved this week"
          variant={violations > 5 ? 'danger' : violations > 0 ? 'warning' : 'success'}
        />
        <SeatMetricCard 
          title="Monthly Cost" 
          value={`$${monthlyCost.toLocaleString()}`}
          icon="💰"
          trend="$150 per additional seat"
        />
      </div>

      {/* Seat Management Actions */}
      <div className="seat-management-header">
        <div className="header-left">
          <h2 className="section-title">Agency Seats</h2>
          <p className="section-subtitle">
            Manage {seats.length} seats across your enterprise
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={selectedSeats.length === 0}
            className="btn-success"
          >
            Assign Policies ({selectedSeats.length})
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <span className="btn-icon">+</span>
            Create Seat
          </button>
        </div>
      </div>

      {/* Seat Grid */}
      {seats.length > 0 ? (
        <SeatGrid 
          seats={seats}
          selectedSeats={selectedSeats}
          onSeatSelect={handleSeatSelection}
          onSeatAction={handleSeatAction}
        />
      ) : (
        <div className="no-seats-state">
          <div className="no-seats-icon">🏢</div>
          <h3>No seats created yet</h3>
          <p>Create your first agency seat to get started with seat management.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your First Seat
          </button>
        </div>
      )}

      {/* Create Seat Modal */}
      {showCreateModal && (
        <CreateSeatModal 
          onClose={() => setShowCreateModal(false)}
          onSeatCreated={handleSeatCreated}
          enterpriseId={currentContext.id}
        />
      )}

      {/* Bulk Policy Assignment Modal */}
      {showBulkModal && (
        <BulkPolicyAssignmentModal 
          selectedSeats={selectedSeats}
          onClose={() => setShowBulkModal(false)}
          onAssign={handleBulkAssignment}
          enterpriseId={currentContext.id}
        />
      )}
    </div>
  );
};

export default SeatManagementDashboard; 