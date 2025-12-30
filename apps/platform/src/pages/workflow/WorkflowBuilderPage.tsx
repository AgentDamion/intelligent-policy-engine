import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { BrandOverrideManager } from '@/components/workflow/BrandOverrideManager';
import { WorkflowPreview } from '@/components/workflow/WorkflowPreview';
import { workflowService, type WorkflowConfig } from '@/services/workflow/workflowService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useBoundaryContext } from '@/hooks/useBoundaryContext';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '@/components/ui/edge-card';
import { AICOMPLYRButton } from '@/components/ui/aicomplyr-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

export default function WorkflowBuilderPage() {
  const { agencyId, clientId, brandId, workflowId } = useParams<{
    agencyId?: string;
    clientId?: string;
    brandId?: string;
    workflowId?: string;
  }>();
  const navigate = useNavigate();
  const { currentEnterprise } = useEnterprise();
  const boundaryContext = useBoundaryContext();

  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'create'>('list');
  const [editingBrandId, setEditingBrandId] = useState<string | undefined>(brandId);

  // Mock brands for now - in production, fetch from API
  const brands = [
    { id: 'nexium', name: 'Nexium' },
    { id: 'crestor', name: 'Crestor' },
    { id: 'symbicort', name: 'Symbicort' },
  ];

  useEffect(() => {
    if (agencyId && clientId) {
      loadWorkflows();
    }
  }, [agencyId, clientId]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflows = async () => {
    if (!agencyId || !clientId) return;
    setLoading(true);
    try {
      const { data, error } = await workflowService.getWorkflowConfigs(agencyId, clientId);
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

  const loadWorkflow = async (id: string) => {
    try {
      const { data, error } = await workflowService.getWorkflowConfig(id);
      if (error || !data) {
        console.error('Failed to load workflow:', error);
        return;
      }
      setSelectedWorkflow(data);
      setViewMode('edit');
      setEditingBrandId(data.brand_id || undefined);
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };

  const handleCreateWorkflow = (brandId?: string) => {
    setEditingBrandId(brandId);
    setSelectedWorkflow(null);
    setViewMode('create');
  };

  const handleEditWorkflow = (id: string, brandId?: string) => {
    setEditingBrandId(brandId);
    loadWorkflow(id);
  };

  const handleSaveWorkflow = (config: WorkflowConfig) => {
    setSelectedWorkflow(config);
    setViewMode('list');
    loadWorkflows();
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedWorkflow(null);
    setEditingBrandId(undefined);
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      const { error } = await workflowService.deleteWorkflowConfig(id);
      if (error) {
        console.error('Failed to delete workflow:', error);
        alert('Failed to delete workflow.');
      } else {
        loadWorkflows();
        if (selectedWorkflow?.id === id) {
          setSelectedWorkflow(null);
          setViewMode('list');
        }
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('An error occurred while deleting the workflow.');
    }
  };

  const handleToggleActive = async (workflow: WorkflowConfig) => {
    try {
      const { error } = await workflowService.updateWorkflowConfig(workflow.id, {
        is_active: !workflow.is_active,
      });
      if (error) {
        console.error('Failed to update workflow:', error);
        alert('Failed to update workflow status.');
      } else {
        loadWorkflows();
        if (selectedWorkflow?.id === workflow.id) {
          loadWorkflow(workflow.id);
        }
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('An error occurred while updating the workflow.');
    }
  };

  // Use params or current enterprise context
  const effectiveAgencyId = agencyId || (boundaryContext ? 'agency-id' : currentEnterprise?.id || '');
  const effectiveClientId = clientId || currentEnterprise?.id || '';

  if (!effectiveAgencyId || !effectiveClientId) {
    return (
      <div className="min-h-screen bg-neutral-100 p-6">
        <EdgeCard>
          <EdgeCardBody>
            <div className="text-center py-8 text-neutral-500">
              Please select an agency-client relationship to configure workflows.
            </div>
          </EdgeCardBody>
        </EdgeCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-l-4 border-l-aicomplyr-black bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display text-aicomplyr-black mb-2">Workflow Builder</h1>
              <p className="text-lg text-neutral-600">
                Configure approval chains and workflow settings for agency-client relationships
              </p>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === 'list' && (
                <AICOMPLYRButton
                  variant="secondary-light"
                  onClick={() => navigate(`/msa/visibility/${effectiveAgencyId}/${effectiveClientId}`)}
                  className="text-sm"
                >
                  MSA Visibility
                </AICOMPLYRButton>
              )}
              {viewMode !== 'list' && (
                <AICOMPLYRButton variant="secondary-light" onClick={handleCancel}>
                  <ArrowLeft className="w-4 h-4" />
                  Back to List
                </AICOMPLYRButton>
              )}
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Workflow List */}
            <div className="lg:col-span-2 space-y-6">
              <EdgeCard>
                <EdgeCardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-aicomplyr-black">Workflows</h2>
                    <AICOMPLYRButton
                      variant="primary-yellow"
                      onClick={() => handleCreateWorkflow()}
                    >
                      <Plus className="w-4 h-4" />
                      Create Workflow
                    </AICOMPLYRButton>
                  </div>
                </EdgeCardHeader>
                <EdgeCardBody>
                  {loading ? (
                    <div className="text-center py-8 text-neutral-500">Loading workflows...</div>
                  ) : workflows.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">No workflows configured</p>
                      <AICOMPLYRButton variant="secondary" onClick={() => handleCreateWorkflow()}>
                        <Plus className="w-4 h-4" />
                        Create First Workflow
                      </AICOMPLYRButton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workflows.map((workflow) => (
                        <div
                          key={workflow.id}
                          className="border-l-4 border-l-aicomplyr-black bg-white p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-semibold text-sm text-aicomplyr-black">
                                {workflow.workflow_name || 'Unnamed Workflow'}
                              </span>
                              <StatusBadge
                                variant={workflow.is_active ? 'approved' : 'pending'}
                              >
                                {workflow.is_active ? 'Active' : 'Inactive'}
                              </StatusBadge>
                            </div>
                            <div className="text-xs text-neutral-500">
                              {workflow.brand_id
                                ? `Brand: ${workflow.brand_id}`
                                : 'Default workflow'}
                              {' • '}
                              {workflow.config.approval_chain.length} steps
                            </div>
                            {workflow.description && (
                              <div className="text-sm text-neutral-600 mt-1">
                                {workflow.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <AICOMPLYRButton
                              variant="tertiary"
                              onClick={() => handleEditWorkflow(workflow.id, workflow.brand_id || undefined)}
                              className="text-xs"
                            >
                              <Edit className="w-3 h-3" />
                            </AICOMPLYRButton>
                            <button
                              onClick={() => handleToggleActive(workflow)}
                              className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
                              aria-label={workflow.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {workflow.is_active ? 'Pause' : 'Play'}
                            </button>
                            <button
                              onClick={() => handleDeleteWorkflow(workflow.id)}
                              className="p-1.5 hover:bg-red-50 text-red-600 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </EdgeCardBody>
              </EdgeCard>

              {/* Brand Override Manager */}
              <BrandOverrideManager
                agencyEnterpriseId={effectiveAgencyId}
                clientEnterpriseId={effectiveClientId}
                brands={brands}
                onEditWorkflow={handleEditWorkflow}
                onCreateWorkflow={handleCreateWorkflow}
              />
            </div>

            {/* Right: Preview (if workflow selected) */}
            {selectedWorkflow && (
              <div>
                <WorkflowPreview workflow={selectedWorkflow} />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main: Workflow Builder */}
            <div className="lg:col-span-2">
              <WorkflowBuilder
                agencyEnterpriseId={effectiveAgencyId}
                clientEnterpriseId={effectiveClientId}
                brandId={editingBrandId}
                workflowId={selectedWorkflow?.id}
                onSave={handleSaveWorkflow}
                onCancel={handleCancel}
              />
            </div>

            {/* Right: Preview */}
            {selectedWorkflow && (
              <div>
                <WorkflowPreview workflow={selectedWorkflow} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

