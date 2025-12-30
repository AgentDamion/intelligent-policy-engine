import React from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card';
import { Input } from '../ui/Input';
import { WorkflowConfig } from '@/services/workflow/workflowService';

interface WorkflowSettingsPanelProps {
  config: WorkflowConfig['config'];
  onConfigChange: (config: Partial<WorkflowConfig['config']>) => void;
}

export const WorkflowSettingsPanel: React.FC<WorkflowSettingsPanelProps> = ({
  config,
  onConfigChange,
}) => {
  return (
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
              checked={config.parallel_approvals}
              onChange={(e) =>
                onConfigChange({ parallel_approvals: e.target.checked })
              }
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
              checked={config.skip_preapproval}
              onChange={(e) =>
                onConfigChange({ skip_preapproval: e.target.checked })
              }
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
            value={config.escalation_timeout_hours}
            onChange={(e) =>
              onConfigChange({
                escalation_timeout_hours: parseInt(e.target.value) || 24,
              })
            }
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
              checked={config.auto_approve_low_risk}
              onChange={(e) =>
                onConfigChange({ auto_approve_low_risk: e.target.checked })
              }
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
              checked={config.require_compliance_review}
              onChange={(e) =>
                onConfigChange({ require_compliance_review: e.target.checked })
              }
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
              checked={config.require_legal_review}
              onChange={(e) =>
                onConfigChange({ require_legal_review: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-aicomplyr-yellow rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-aicomplyr-yellow"></div>
          </label>
        </div>
      </EdgeCardBody>
    </EdgeCard>
  );
};

