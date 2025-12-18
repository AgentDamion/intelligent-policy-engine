import React, { useState, useEffect } from 'react';
import { contextApi } from '../services/contextApi';
import './BulkPolicyAssignmentModal.css';

// Policy Checkbox Item Component
const PolicyCheckboxItem = ({ policy, isSelected, onToggle }) => {
  return (
    <div className="policy-checkbox-item">
      <label className="policy-checkbox-label">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="policy-checkbox"
        />
        <div className="policy-info">
          <h4 className="policy-name">{policy.name}</h4>
          <p className="policy-description">{policy.description}</p>
          <div className="policy-meta">
            <span className="policy-category">{policy.category}</span>
            <span className="policy-version">v{policy.version}</span>
            <span className="policy-status">{policy.status}</span>
          </div>
        </div>
      </label>
    </div>
  );
};

// Assignment Options Component
const AssignmentOptions = ({ options, setOptions }) => {
  return (
    <div className="assignment-options">
      <h3 className="options-title">Assignment Options</h3>
      
      <div className="options-grid">
        <div className="option-group">
          <h4 className="option-group-title">Assignment Type</h4>
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="assignmentType"
                checked={options.addToExisting}
                onChange={() => setOptions({
                  ...options,
                  addToExisting: true,
                  replaceExisting: false
                })}
              />
              <div className="radio-content">
                <span className="radio-label">Add to existing policies</span>
                <span className="radio-description">
                  Keep current policies and add new ones
                </span>
              </div>
            </label>
            
            <label className="radio-item">
              <input
                type="radio"
                name="assignmentType"
                checked={options.replaceExisting}
                onChange={() => setOptions({
                  ...options,
                  addToExisting: false,
                  replaceExisting: true
                })}
              />
              <div className="radio-content">
                <span className="radio-label">Replace all existing policies</span>
                <span className="radio-description">
                  Remove current policies and assign new ones
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="option-group">
          <h4 className="option-group-title">Rollout Strategy</h4>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={options.scheduleRollout}
                onChange={(e) => setOptions({
                  ...options,
                  scheduleRollout: e.target.checked
                })}
              />
              <span>Schedule rollout for later</span>
            </label>
            
            {options.scheduleRollout && (
              <div className="schedule-inputs">
                <div className="form-group">
                  <label className="form-label">Rollout Date</label>
                  <input
                    type="datetime-local"
                    value={options.rolloutDate || ''}
                    onChange={(e) => setOptions({
                      ...options,
                      rolloutDate: e.target.value
                    })}
                    className="form-input"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="option-group">
          <h4 className="option-group-title">Notification Settings</h4>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={options.notifyAdmins}
                onChange={(e) => setOptions({
                  ...options,
                  notifyAdmins: e.target.checked
                })}
              />
              <span>Notify seat administrators</span>
            </label>
            
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={options.sendEmail}
                onChange={(e) => setOptions({
                  ...options,
                  sendEmail: e.target.checked
                })}
              />
              <span>Send email notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Bulk Policy Assignment Modal
export const BulkPolicyAssignmentModal = ({ 
  selectedSeats, 
  onClose, 
  onAssign, 
  enterpriseId 
}) => {
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [assignmentOptions, setAssignmentOptions] = useState({
    addToExisting: true,
    replaceExisting: false,
    scheduleRollout: false,
    rolloutDate: null,
    notifyAdmins: true,
    sendEmail: true
  });

  useEffect(() => {
    loadAvailablePolicies();
  }, []);

  const loadAvailablePolicies = async () => {
    try {
      const policies = await contextApi.getAvailablePolicies(enterpriseId);
      setAvailablePolicies(policies.policies || []);
    } catch (error) {
      console.error('Failed to load policies:', error);
      setErrors({ policies: 'Failed to load available policies' });
    }
  };

  const filteredPolicies = availablePolicies.filter(policy =>
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePolicySelection = (policyId) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId)
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedPolicies.length === 0) {
      newErrors.policies = 'Please select at least one policy';
    }

    if (assignmentOptions.scheduleRollout && !assignmentOptions.rolloutDate) {
      newErrors.rolloutDate = 'Please select a rollout date';
    }

    if (assignmentOptions.scheduleRollout && assignmentOptions.rolloutDate) {
      const selectedDate = new Date(assignmentOptions.rolloutDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.rolloutDate = 'Rollout date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBulkAssignment = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onAssign(selectedPolicies, assignmentOptions);
      onClose();
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedSeatsInfo = () => {
    if (selectedSeats.length === 0) return 'No seats selected';
    if (selectedSeats.length === 1) return '1 seat selected';
    return `${selectedSeats.length} seats selected`;
  };

  return (
    <div className="modal-overlay">
      <div className="bulk-assignment-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Assign Policies to Seats</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Summary */}
          <div className="assignment-summary">
            <div className="summary-item">
              <span className="summary-label">Selected Seats:</span>
              <span className="summary-value">{getSelectedSeatsInfo()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Selected Policies:</span>
              <span className="summary-value">
                {selectedPolicies.length} policy{selectedPolicies.length !== 1 ? 'ies' : ''}
              </span>
            </div>
          </div>

          {/* Policy Selection */}
          <div className="policy-selection">
            <h3 className="section-title">Select Policies</h3>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search policies by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="policies-container">
              {filteredPolicies.length > 0 ? (
                <div className="policies-list">
                  {filteredPolicies.map(policy => (
                    <PolicyCheckboxItem
                      key={policy.id}
                      policy={policy}
                      isSelected={selectedPolicies.includes(policy.id)}
                      onToggle={() => togglePolicySelection(policy.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-policies">
                  <p>No policies found matching your search.</p>
                </div>
              )}
            </div>

            {errors.policies && (
              <span className="error-message">{errors.policies}</span>
            )}
          </div>

          {/* Assignment Options */}
          <AssignmentOptions
            options={assignmentOptions}
            setOptions={setAssignmentOptions}
          />

          {errors.rolloutDate && (
            <span className="error-message">{errors.rolloutDate}</span>
          )}

          {errors.general && (
            <div className="general-error">
              <span className="error-message">{errors.general}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleBulkAssignment}
            className="btn-primary"
            disabled={isLoading || selectedPolicies.length === 0}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner-small"></div>
                Assigning...
              </>
            ) : (
              `Assign ${selectedPolicies.length} Policy${selectedPolicies.length !== 1 ? 'ies' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkPolicyAssignmentModal; 