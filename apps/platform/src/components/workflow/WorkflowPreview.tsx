import React, { useState } from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card';
import { StatusBadge } from '../ui/status-badge';
import { Input } from '../ui/Input';
import { AICOMPLYRButton } from '../ui/aicomplyr-button';
import { workflowService, type WorkflowConfig, type SampleSubmission } from '@/services/workflow/workflowService';
import { CheckCircle, XCircle, Clock, SkipForward } from 'lucide-react';
import { useRoleArchetypes } from '@/hooks/useRoleArchetypes';
import { DEFAULT_ROLE_ARCHETYPES } from '@/services/workflow/roleArchetypeService';
import * as LucideIcons from 'lucide-react';

interface WorkflowPreviewProps {
  workflow: WorkflowConfig;
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.User;
  return IconComponent;
};

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ workflow }) => {
  const { archetypes } = useRoleArchetypes();
  const [sampleSubmission, setSampleSubmission] = useState<SampleSubmission>({
    risk_score: 0.5,
    requestor_role: 'contributor',
    tool_type: 'midjourney',
    use_case: 'hcp_campaign',
  });
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await workflowService.testWorkflowConfig(workflow, sampleSubmission);
      setPreviewResult(result);
    } catch (error) {
      console.error('Error testing workflow:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStepStatus = (stepId: string) => {
    if (!previewResult) return 'pending';
    if (previewResult.skippedSteps.includes(stepId)) return 'skipped';
    if (previewResult.triggeredSteps.includes(stepId)) return 'triggered';
    return 'pending';
  };

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <h3 className="text-lg font-semibold text-aicomplyr-black">Workflow Preview</h3>
      </EdgeCardHeader>
      <EdgeCardBody className="space-y-6">
        {/* Sample Submission Inputs */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Test Scenario
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">
              Risk Score
            </label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={sampleSubmission.risk_score}
              onChange={(e) =>
                setSampleSubmission({
                  ...sampleSubmission,
                  risk_score: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">
              Requestor Role
            </label>
            <Input
              value={sampleSubmission.requestor_role}
              onChange={(e) =>
                setSampleSubmission({
                  ...sampleSubmission,
                  requestor_role: e.target.value,
                })
              }
              className="w-full"
            />
          </div>
          <AICOMPLYRButton
            variant="primary-yellow"
            onClick={handleTest}
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Workflow'}
          </AICOMPLYRButton>
        </div>

        {/* Preview Results */}
        {previewResult && (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Execution Flow
            </div>
            <div className="space-y-2">
              {workflow.config.approval_chain.map((roleId, index) => {
                const status = getStepStatus(roleId);
                const archetype =
                  archetypes.find((a) => a.id === roleId) ||
                  DEFAULT_ROLE_ARCHETYPES[roleId] || {
                    name: roleId,
                    icon: 'user',
                  };
                const IconComponent = getIconComponent(archetype.icon || 'user');

                return (
                  <div key={roleId} className="relative">
                    <div
                      className={`border-l-4 p-3 ${
                        status === 'triggered'
                          ? 'border-l-status-approved bg-green-50'
                          : status === 'skipped'
                          ? 'border-l-neutral-300 bg-neutral-100'
                          : 'border-l-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-white border-2 border-aicomplyr-black flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </div>
                          <IconComponent className="w-4 h-4 text-aicomplyr-black" />
                          <span className="text-sm font-semibold text-aicomplyr-black">
                            {archetype.name || roleId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {status === 'triggered' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-status-approved" />
                              <span className="text-xs text-status-approved font-semibold">
                                Required
                              </span>
                            </>
                          )}
                          {status === 'skipped' && (
                            <>
                              <SkipForward className="w-4 h-4 text-neutral-400" />
                              <span className="text-xs text-neutral-400 font-semibold">
                                Skipped
                              </span>
                            </>
                          )}
                          {status === 'pending' && (
                            <>
                              <Clock className="w-4 h-4 text-neutral-400" />
                              <span className="text-xs text-neutral-400 font-semibold">
                                Pending
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < workflow.config.approval_chain.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-3 bg-neutral-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Steps Triggered:</span>
                <span className="font-semibold text-aicomplyr-black">
                  {previewResult.triggeredSteps.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Steps Skipped:</span>
                <span className="font-semibold text-neutral-600">
                  {previewResult.skippedSteps.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Estimated Time:</span>
                <span className="font-semibold text-aicomplyr-black">
                  {previewResult.estimatedTime} hours
                </span>
              </div>
            </div>
          </div>
        )}

        {!previewResult && (
          <div className="text-center py-8 text-neutral-400 text-sm">
            Configure test scenario and click "Test Workflow" to preview execution
          </div>
        )}
      </EdgeCardBody>
    </EdgeCard>
  );
};

