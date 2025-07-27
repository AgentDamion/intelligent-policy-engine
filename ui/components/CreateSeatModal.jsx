import React, { useState, useEffect } from 'react';
import { contextApi } from '../services/contextApi';
import './CreateSeatModal.css';

// Step Components
const BasicInfoStep = ({ seatData, setSeatData, errors }) => {
  return (
    <div className="step-content">
      <h3 className="step-title">Basic Information</h3>
      <p className="step-description">
        Provide the essential details for your new agency seat.
      </p>

      <div className="form-group">
        <label htmlFor="seatName" className="form-label">
          Seat Name *
        </label>
        <input
          type="text"
          id="seatName"
          value={seatData.name}
          onChange={(e) => setSeatData({ ...seatData, name: e.target.value })}
          className={`form-input ${errors.name ? 'form-input-error' : ''}`}
          placeholder="e.g., Ogilvy Health - Digital Team"
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          value={seatData.description}
          onChange={(e) => setSeatData({ ...seatData, description: e.target.value })}
          className="form-textarea"
          placeholder="Brief description of this seat's purpose and responsibilities"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="adminEmail" className="form-label">
          Admin Email *
        </label>
        <input
          type="email"
          id="adminEmail"
          value={seatData.adminEmail}
          onChange={(e) => setSeatData({ ...seatData, adminEmail: e.target.value })}
          className={`form-input ${errors.adminEmail ? 'form-input-error' : ''}`}
          placeholder="admin@agency.com"
        />
        {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
        <small className="form-help">
          This person will be the primary administrator for this seat.
        </small>
      </div>
    </div>
  );
};

const PolicyAssignmentStep = ({ seatData, setSeatData, availablePolicies, errors }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPolicies = availablePolicies.filter(policy =>
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePolicy = (policyId) => {
    const isSelected = seatData.selectedPolicies.includes(policyId);
    setSeatData({
      ...seatData,
      selectedPolicies: isSelected
        ? seatData.selectedPolicies.filter(id => id !== policyId)
        : [...seatData.selectedPolicies, policyId]
    });
  };

  return (
    <div className="step-content">
      <h3 className="step-title">Policy Assignment</h3>
      <p className="step-description">
        Select which policies will be automatically applied to this seat.
      </p>

      <div className="form-group">
        <label htmlFor="policySearch" className="form-label">
          Search Policies
        </label>
        <input
          type="text"
          id="policySearch"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          placeholder="Search policies by name or description..."
        />
      </div>

      <div className="policies-list">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map(policy => (
            <div key={policy.id} className="policy-item">
              <label className="policy-checkbox">
                <input
                  type="checkbox"
                  checked={seatData.selectedPolicies.includes(policy.id)}
                  onChange={() => togglePolicy(policy.id)}
                />
                <div className="policy-info">
                  <h4 className="policy-name">{policy.name}</h4>
                  <p className="policy-description">{policy.description}</p>
                  <div className="policy-meta">
                    <span className="policy-category">{policy.category}</span>
                    <span className="policy-version">v{policy.version}</span>
                  </div>
                </div>
              </label>
            </div>
          ))
        ) : (
          <div className="no-policies">
            <p>No policies found matching your search.</p>
          </div>
        )}
      </div>

      {errors.selectedPolicies && (
        <span className="error-message">{errors.selectedPolicies}</span>
      )}
    </div>
  );
};

const PermissionsStep = ({ seatData, setSeatData, errors }) => {
  return (
    <div className="step-content">
      <h3 className="step-title">Permissions & Limits</h3>
      <p className="step-description">
        Configure user limits and permission settings for this seat.
      </p>

      <div className="form-group">
        <label htmlFor="userLimit" className="form-label">
          User Limit *
        </label>
        <input
          type="number"
          id="userLimit"
          value={seatData.userLimit}
          onChange={(e) => setSeatData({ ...seatData, userLimit: parseInt(e.target.value) })}
          className={`form-input ${errors.userLimit ? 'form-input-error' : ''}`}
          min="1"
          max="100"
        />
        {errors.userLimit && <span className="error-message">{errors.userLimit}</span>}
        <small className="form-help">
          Maximum number of users that can be added to this seat.
        </small>
      </div>

      <div className="form-group">
        <label className="form-label">Permission Settings</label>
        <div className="permissions-grid">
          <label className="permission-item">
            <input
              type="checkbox"
              checked={seatData.permissions.canCreatePolicies}
              onChange={(e) => setSeatData({ 
                ...seatData, 
                permissions: { 
                  ...seatData.permissions, 
                  canCreatePolicies: e.target.checked 
                }
              })}
            />
            <span>Can create custom policies</span>
          </label>

          <label className="permission-item">
            <input
              type="checkbox"
              checked={seatData.permissions.canInviteUsers}
              onChange={(e) => setSeatData({ 
                ...seatData, 
                permissions: { 
                  ...seatData.permissions, 
                  canInviteUsers: e.target.checked 
                }
              })}
            />
            <span>Can invite new users</span>
          </label>

          <label className="permission-item">
            <input
              type="checkbox"
              checked={seatData.permissions.canViewAnalytics}
              onChange={(e) => setSeatData({ 
                ...seatData, 
                permissions: { 
                  ...seatData.permissions, 
                  canViewAnalytics: e.target.checked 
                }
              })}
            />
            <span>Can view analytics and reports</span>
          </label>

          <label className="permission-item">
            <input
              type="checkbox"
              checked={seatData.permissions.canManageCompliance}
              onChange={(e) => setSeatData({ 
                ...seatData, 
                permissions: { 
                  ...seatData.permissions, 
                  canManageCompliance: e.target.checked 
                }
              })}
            />
            <span>Can manage compliance settings</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Custom Branding</label>
        <label className="custom-branding-toggle">
          <input
            type="checkbox"
            checked={seatData.customBranding}
            onChange={(e) => setSeatData({ ...seatData, customBranding: e.target.checked })}
          />
          <span>Enable custom branding for this seat</span>
        </label>
        <small className="form-help">
          Allow this seat to use custom logos and colors.
        </small>
      </div>
    </div>
  );
};

const ReviewStep = ({ seatData, availablePolicies }) => {
  const selectedPolicies = availablePolicies.filter(policy => 
    seatData.selectedPolicies.includes(policy.id)
  );

  return (
    <div className="step-content">
      <h3 className="step-title">Review & Create</h3>
      <p className="step-description">
        Review your seat configuration before creating.
      </p>

      <div className="review-sections">
        <div className="review-section">
          <h4 className="review-section-title">Basic Information</h4>
          <div className="review-item">
            <span className="review-label">Seat Name:</span>
            <span className="review-value">{seatData.name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Description:</span>
            <span className="review-value">{seatData.description || 'No description'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Admin Email:</span>
            <span className="review-value">{seatData.adminEmail}</span>
          </div>
        </div>

        <div className="review-section">
          <h4 className="review-section-title">Policy Assignment</h4>
          {selectedPolicies.length > 0 ? (
            <div className="selected-policies">
              {selectedPolicies.map(policy => (
                <div key={policy.id} className="selected-policy">
                  <span className="policy-name">{policy.name}</span>
                  <span className="policy-category">{policy.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-policies-selected">No policies selected</p>
          )}
        </div>

        <div className="review-section">
          <h4 className="review-section-title">Permissions & Limits</h4>
          <div className="review-item">
            <span className="review-label">User Limit:</span>
            <span className="review-value">{seatData.userLimit} users</span>
          </div>
          <div className="review-item">
            <span className="review-label">Custom Branding:</span>
            <span className="review-value">{seatData.customBranding ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Permissions:</span>
            <div className="permissions-list">
              {Object.entries(seatData.permissions).map(([key, value]) => (
                <span key={key} className={`permission-badge ${value ? 'enabled' : 'disabled'}`}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main CreateSeatModal Component
export const CreateSeatModal = ({ onClose, onSeatCreated, enterpriseId }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [errors, setErrors] = useState({});
  
  const [seatData, setSeatData] = useState({
    name: '',
    description: '',
    adminEmail: '',
    userLimit: 5,
    selectedPolicies: [],
    customBranding: false,
    permissions: {
      canCreatePolicies: false,
      canInviteUsers: true,
      canViewAnalytics: true,
      canManageCompliance: false
    }
  });

  const steps = [
    { title: 'Basic Information', component: BasicInfoStep },
    { title: 'Policy Assignment', component: PolicyAssignmentStep },
    { title: 'Permissions & Limits', component: PermissionsStep },
    { title: 'Review & Create', component: ReviewStep }
  ];

  useEffect(() => {
    loadAvailablePolicies();
  }, []);

  const loadAvailablePolicies = async () => {
    try {
      const policies = await contextApi.getAvailablePolicies(enterpriseId);
      setAvailablePolicies(policies.policies || []);
    } catch (error) {
      console.error('Failed to load policies:', error);
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    switch (currentStep) {
      case 1:
        if (!seatData.name.trim()) {
          newErrors.name = 'Seat name is required';
        }
        if (!seatData.adminEmail.trim()) {
          newErrors.adminEmail = 'Admin email is required';
        } else if (!/\S+@\S+\.\S+/.test(seatData.adminEmail)) {
          newErrors.adminEmail = 'Please enter a valid email address';
        }
        break;
      case 2:
        if (seatData.selectedPolicies.length === 0) {
          newErrors.selectedPolicies = 'Please select at least one policy';
        }
        break;
      case 3:
        if (seatData.userLimit < 1 || seatData.userLimit > 100) {
          newErrors.userLimit = 'User limit must be between 1 and 100';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreateSeat = async () => {
    if (!validateStep(step)) return;

    setIsLoading(true);
    try {
      const newSeat = await contextApi.createSeat(enterpriseId, seatData);
      onSeatCreated(newSeat);
    } catch (error) {
      console.error('Failed to create seat:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[step - 1].component;

  return (
    <div className="modal-overlay">
      <div className="create-seat-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create New Agency Seat</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          {steps.map((stepInfo, index) => (
            <div key={index} className="progress-step">
              <div className={`progress-circle ${step > index + 1 ? 'completed' : step === index + 1 ? 'current' : 'pending'}`}>
                {step > index + 1 ? '✓' : index + 1}
              </div>
              <span className="progress-label">{stepInfo.title}</span>
              {index < steps.length - 1 && (
                <div className={`progress-line ${step > index + 1 ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="modal-content">
          <CurrentStepComponent
            seatData={seatData}
            setSeatData={setSeatData}
            availablePolicies={availablePolicies}
            errors={errors}
          />

          {errors.general && (
            <div className="general-error">
              <span className="error-message">{errors.general}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            onClick={step > 1 ? handleBack : onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={step < steps.length ? handleNext : handleCreateSeat}
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner-small"></div>
                Creating...
              </>
            ) : step < steps.length ? 'Next' : 'Create Seat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSeatModal; 