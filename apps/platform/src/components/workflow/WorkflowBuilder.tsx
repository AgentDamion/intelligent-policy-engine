import React, { useState, useEffect } from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card';
import { AICOMPLYRButton } from '../ui/aicomplyr-button';
import { StatusBadge } from '../ui/status-badge';
import { ApprovalChainStep } from './ApprovalChainStep';
import { workflowService, type WorkflowConfig, type WorkflowConfigInput } from '@/services/workflow/workflowService';
import { useRoleArchetypes } from '@/hooks/useRoleArchetypes';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { Plus, Save } from 'lucide-react';
import { Input } from '../ui/Input';
import { RoleSelector } from './RoleSelector';

interface WorkflowBuilderProps {
  agencyEnterpriseId: string;
  clientEnterpriseId: string;
  brandId?: string;
  workflowId?: string;
  onSave?: (config: WorkflowConfig) => void;
  onCancel?: () => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  agencyEnterpriseId,
  clientEnterpriseId,
  brandId,
  workflowId,
  onSave,
  onCancel,
}) => {
  const { archetypes } = useRoleArchetypes();
  const { currentEnterprise } = useEnterprise();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [approvalChain, setApprovalChain] = useState<string[]>(['team_lead', 'client_owner']);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [parallelApprovals, setParallelApprovals] = useState(false);
  const [skipPreapproval, setSkipPreapproval] = useState(false);
  const [escalationTimeoutHours, setEscalationTimeoutHours] = useState(24);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [requireComplianceReview, setRequireComplianceReview] = useState(false);
  const [requireLegalReview, setRequireLegalReview] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Load existing workflow if editing
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflow = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await workflowService.getWorkflowConfig(id);
      if (error || !data) {
        console.error('Failed to load workflow:', error);
        return;
      }

      setWorkflowName(data.workflow_name || '');
      setDescription(data.description || '');
      setApprovalChain(data.config.approval_chain || []);
      setParallelApprovals(data.config.parallel_approvals || false);
      setSkipPreapproval(data.config.skip_preapproval || false);
      setEscalationTimeoutHours(data.config.escalation_timeout_hours || 24);
      setAutoApproveLowRisk(data.config.auto_approve_low_risk || false);
      setRequireComplianceReview(data.config.require_compliance_review || false);
      setRequireLegalReview(data.config.require_legal_review || false);
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = (roleId?: string) => {
    if (roleId) {
      setApprovalChain([...approvalChain, roleId]);
    } else {
      setShowRoleSelector(true);
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setApprovalChain([...approvalChain, roleId]);
    setShowRoleSelector(false);
  };

  const handleRemoveStep = (index: number) => {
    const newChain = approvalChain.filter((_, i) => i !== index);
    setApprovalChain(newChain);
    if (selectedStepIndex === index) {
      setSelectedStepIndex(null);
    } else if (selectedStepIndex !== null && selectedStepIndex > index) {
      setSelectedStepIndex(selectedStepIndex - 1);
    }
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newChain = [...approvalChain];
    if (direction === 'up' && index > 0) {
      [newChain[index - 1], newChain[index]] = [newChain[index], newChain[index - 1]];
      setSelectedStepIndex(index - 1);
    } else if (direction === 'down' && index < newChain.length - 1) {
      [newChain[index], newChain[index + 1]] = [newChain[index + 1], newChain[index]];
      setSelectedStepIndex(index + 1);
    }
    setApprovalChain(newChain);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: WorkflowConfigInput = {
        agency_enterprise_id: agencyEnterpriseId,
        client_enterprise_id: clientEnterpriseId,
        brand_id: brandId,
        workflow_name: workflowName || undefined,
        description: description || undefined,
        config: {
          approval_chain: approvalChain,
          parallel_approvals: parallelApprovals,
          skip_preapproval: skipPreapproval,
          escalation_timeout_hours: escalationTimeoutHours,
          auto_approve_low_risk: autoApproveLowRisk,
          require_compliance_review: requireComplianceReview,
          require_legal_review: requireLegalReview,
        },
        is_active: true,
      };

      let result;
      if (workflowId) {
        result = await workflowService.updateWorkflowConfig(workflowId, config);
      } else {
        result = await workflowService.createWorkflowConfig(config);
      }

      if (result.error) {
        console.error('Failed to save workflow:', result.error);
        alert('Failed to save workflow. Please try again.');
        return;
      }

      if (result.data && onSave) {
        onSave(result.data);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('An error occurred while saving the workflow.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <EdgeCard>
        <EdgeCardBody>
          <div className="text-center py-8 text-neutral-500">Loading workflow...</div>
        </EdgeCardBody>
      </EdgeCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <EdgeCard>
        <EdgeCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-aicomplyr-black mb-1">
                {workflowId ? 'Edit Workflow' : 'Create Workflow'}
              </h2>
              <p className="text-sm text-neutral-600">
                Configure approval chain and workflow settings
              </p>
            </div>
            <StatusBadge variant={workflowId ? 'approved' : 'pending'}>
              {workflowId ? 'Active' : 'Draft'}
            </StatusBadge>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Workflow Name
            </label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g., Standard Approval Workflow"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when this workflow applies..."
              className="w-full"
            />
          </div>
          {brandId && (
            <div className="text-sm text-neutral-600">
              <span className="font-semibold">Brand Scope:</span> {brandId}
            </div>
          )}
        </EdgeCardBody>
      </EdgeCard>

      {/* Approval Chain Builder */}
      <EdgeCard>
        <EdgeCardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-aicomplyr-black">Approval Chain</h3>
            <AICOMPLYRButton
              variant="secondary-light"
              onClick={() => handleAddStep()}
              className="text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </AICOMPLYRButton>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody>
          {approvalChain.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p className="mb-4">No approval steps configured</p>
              <AICOMPLYRButton variant="secondary" onClick={() => handleAddStep()}>
                <Plus className="w-4 h-4" />
                Add First Step
              </AICOMPLYRButton>
            </div>
          ) : (
            <div className="space-y-0">
              {approvalChain.map((roleId, index) => {
                const archetype = archetypes.find((a) => a.id === roleId);
                return (
                  <ApprovalChainStep
                    key={`${roleId}-${index}`}
                    stepNumber={index + 1}
                    roleArchetypeId={roleId}
                    roleName={archetype?.name}
                    isSelected={selectedStepIndex === index}
                    isParallel={parallelApprovals}
                    canMoveUp={index > 0}
                    canMoveDown={index < approvalChain.length - 1}
                    onMoveUp={() => handleMoveStep(index, 'up')}
                    onMoveDown={() => handleMoveStep(index, 'down')}
                    onRemove={() => handleRemoveStep(index)}
                    onSelect={() => setSelectedStepIndex(index)}
                  />
                );
              })}
            </div>
          )}
        </EdgeCardBody>
      </EdgeCard>

      {/* Workflow Settings */}
      <EdgeCard>
        <EdgeCardHeader>
          <h3 className="text-lg font-semibold text-aicomplyr-black">Workflow Settings</h3>
        </EdgeCardHeader>
        <EdgeCardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-aicomplyr-black">
                Parallel Approvals
              </label>
              <p className="text-xs text-neutral-500">
                Allow multiple approvers to review simultaneously
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parallelApprovals}
                onChange={(e) => setParallelApprovals(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-aicomplyr-yellow rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-aicomplyr-yellow"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-aicomplyr-black">
                Skip Preapproval
              </label>
              <p className="text-xs text-neutral-500">
                Allow contributors to skip internal approval steps
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={skipPreapproval}
                onChange={(e) => setSkipPreapproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-aicomplyr-yellow rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-aicomplyr-yellow"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-aicomplyr-black mb-2">
              Escalation Timeout (hours)
            </label>
            <Input
              type="number"
              min="1"
              max="168"
              value={escalationTimeoutHours}
              onChange={(e) => setEscalationTimeoutHours(parseInt(e.target.value) || 24)}
              className="w-32"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-aicomplyr-black">
                Auto-Approve Low Risk
              </label>
              <p className="text-xs text-neutral-500">
                Automatically approve submissions with risk score &lt; 0.3
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoApproveLowRisk}
                onChange={(e) => setAutoApproveLowRisk(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-aicomplyr-yellow rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-aicomplyr-yellow"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-aicomplyr-black">
                Require Compliance Review
              </label>
              <p className="text-xs text-neutral-500">
                Always add compliance reviewer to approval chain
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireComplianceReview}
                onChange={(e) => setRequireComplianceReview(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-aicomplyr-yellow rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-aicomplyr-yellow"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-aicomplyr-black">
                Require Legal Review
              </label>
              <p className="text-xs text-neutral-500">
                Always add legal counsel to approval chain
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireLegalReview}
                onChange={(e) => setRequireLegalReview(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-aicomplyr-yellow rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-aicomplyr-yellow"></div>
            </label>
          </div>
        </EdgeCardBody>
      </EdgeCard>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <AICOMPLYRButton variant="secondary-light" onClick={onCancel}>
            Cancel
          </AICOMPLYRButton>
        )}
        <AICOMPLYRButton
          variant="primary-yellow"
          onClick={handleSave}
          disabled={saving || approvalChain.length === 0}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Workflow'}
        </AICOMPLYRButton>
      </div>

      {/* Role Selector Modal */}
      {showRoleSelector && (
        <RoleSelector
          onSelect={handleRoleSelect}
          onClose={() => setShowRoleSelector(false)}
          excludeRoles={approvalChain}
        />
      )}
    </div>
  );
};

