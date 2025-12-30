import React, { useState, useEffect } from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card';
import { AICOMPLYRButton } from '../ui/aicomplyr-button';
import { StatusBadge } from '../ui/status-badge';
import { workflowService, type WorkflowConfig } from '@/services/workflow/workflowService';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface BrandOverrideManagerProps {
  agencyEnterpriseId: string;
  clientEnterpriseId: string;
  brands: Array<{ id: string; name: string }>;
  onEditWorkflow?: (workflowId: string, brandId?: string) => void;
  onCreateWorkflow?: (brandId?: string) => void;
}

export const BrandOverrideManager: React.FC<BrandOverrideManagerProps> = ({
  agencyEnterpriseId,
  clientEnterpriseId,
  brands,
  onEditWorkflow,
  onCreateWorkflow,
}) => {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, [agencyEnterpriseId, clientEnterpriseId]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const { data, error } = await workflowService.getWorkflowConfigs(
        agencyEnterpriseId,
        clientEnterpriseId
      );
      if (error) {
        console.error('Failed to load workflows:', error);
      } else {
        setWorkflows(data || []);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverride = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this brand override?')) {
      return;
    }

    try {
      const { error } = await workflowService.deleteWorkflowConfig(workflowId);
      if (error) {
        console.error('Failed to delete workflow:', error);
        alert('Failed to delete workflow override.');
      } else {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('An error occurred while deleting the workflow.');
    }
  };

  const getWorkflowForBrand = (brandId: string | null) => {
    if (brandId === null) {
      return workflows.find((w) => w.brand_id === null);
    }
    return workflows.find((w) => w.brand_id === brandId);
  };

  if (loading) {
    return (
      <EdgeCard>
        <EdgeCardBody>
          <div className="text-center py-8 text-neutral-500">Loading brand overrides...</div>
        </EdgeCardBody>
      </EdgeCard>
    );
  }

  const defaultWorkflow = getWorkflowForBrand(null);

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-aicomplyr-black">Brand Overrides</h3>
          <AICOMPLYRButton
            variant="secondary-light"
            onClick={() => onCreateWorkflow && onCreateWorkflow()}
            className="text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Default
          </AICOMPLYRButton>
        </div>
      </EdgeCardHeader>
      <EdgeCardBody className="space-y-4">
        {/* Default Workflow */}
        <div className="border-l-4 border-l-aicomplyr-black bg-neutral-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-semibold text-sm text-aicomplyr-black">Default Workflow</div>
              <div className="text-xs text-neutral-500">Applies to all brands without overrides</div>
            </div>
            <StatusBadge variant={defaultWorkflow?.is_active ? 'approved' : 'pending'}>
              {defaultWorkflow ? 'Active' : 'Not Set'}
            </StatusBadge>
          </div>
          {defaultWorkflow ? (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-neutral-600">
                {defaultWorkflow.workflow_name || 'Unnamed Workflow'}
              </span>
              {onEditWorkflow && (
                <AICOMPLYRButton
                  variant="tertiary"
                  onClick={() => onEditWorkflow(defaultWorkflow.id)}
                  className="text-xs"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </AICOMPLYRButton>
              )}
            </div>
          ) : (
            <AICOMPLYRButton
              variant="secondary-light"
              onClick={() => onCreateWorkflow && onCreateWorkflow()}
              className="mt-3 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Default Workflow
            </AICOMPLYRButton>
          )}
        </div>

        {/* Brand-Specific Workflows */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Brand-Specific Overrides
          </div>
          {brands.length === 0 ? (
            <div className="text-sm text-neutral-500 py-4">
              No brands configured for this relationship
            </div>
          ) : (
            brands.map((brand) => {
              const workflow = getWorkflowForBrand(brand.id);
              return (
                <div
                  key={brand.id}
                  className="border-l-4 border-l-neutral-300 bg-white p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-aicomplyr-black">{brand.name}</div>
                    {workflow ? (
                      <div className="text-xs text-neutral-500 mt-1">
                        {workflow.workflow_name || 'Unnamed Workflow'}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-400 mt-1">Uses default workflow</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {workflow ? (
                      <>
                        <StatusBadge variant={workflow.is_active ? 'approved' : 'pending'}>
                          Active
                        </StatusBadge>
                        {onEditWorkflow && (
                          <AICOMPLYRButton
                            variant="tertiary"
                            onClick={() => onEditWorkflow(workflow.id, brand.id)}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3" />
                          </AICOMPLYRButton>
                        )}
                        <button
                          onClick={() => handleDeleteOverride(workflow.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 transition-colors"
                          aria-label="Delete override"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <AICOMPLYRButton
                        variant="secondary-light"
                        onClick={() => onCreateWorkflow && onCreateWorkflow(brand.id)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        Create Override
                      </AICOMPLYRButton>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </EdgeCardBody>
    </EdgeCard>
  );
};

