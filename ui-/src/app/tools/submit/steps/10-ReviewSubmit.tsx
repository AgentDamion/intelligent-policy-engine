import React, { useState } from 'react';
import { Button, Card, Toggle } from '@/components/ui';
import type { StepProps } from '../types';
import { Send, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function ReviewSubmitStep({ data, update, onPrev }: StepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleAttestationChange = (checked: boolean) => {
    if (localErrors.attest) {
      setLocalErrors(prev => ({ ...prev, attest: '' }));
    }
    update({ attest: checked });
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!data.attest) {
      errors.attest = 'Attestation is required to submit';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateStep()) {
      // This will be handled by the parent component
      console.log('Submitting for review...');
    }
  };

  // Calculate completion status
  const getCompletionStatus = () => {
    const sections = [
      { name: 'Tool Identification', completed: Boolean(data.tool?.name && data.tool?.vendor && data.tool?.category) },
      { name: 'Business Context', completed: Boolean(data.purpose?.businessJustification) },
      { name: 'Use Cases', completed: Boolean(data.purpose?.description) },
      { name: 'Data Privacy', completed: true }, // Placeholder
      { name: 'Evidence Upload', completed: Boolean(data.evidence?.files?.length) },
      { name: 'Technical Requirements', completed: true }, // Placeholder
      { name: 'Risk & Compliance', completed: Boolean(data.risk?.level && data.risk?.mitigations) },
      { name: 'Vendor Assessment', completed: true }, // Placeholder
      { name: 'Approval Chain', completed: true }, // Placeholder
    ];

    const completed = sections.filter(s => s.completed).length;
    const total = sections.length;

    return { sections, completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
            <p className="text-gray-600">Review your submission and submit for approval.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Completion Status */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Status</span>
              <span className="text-sm font-medium">{completionStatus.percentage}% Complete</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionStatus.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {completionStatus.sections.map((section, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {section.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={section.completed ? 'text-gray-900' : 'text-gray-500'}>
                    {section.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Tool Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tool Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tool Name:</span>
              <div className="font-medium">{data.tool?.name || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-gray-500">Vendor:</span>
              <div className="font-medium">{data.tool?.vendor || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>
              <div className="font-medium">{data.tool?.category || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-gray-500">Risk Level:</span>
              <div className="font-medium">{data.risk?.level || 'Not assessed'}</div>
            </div>
          </div>
        </Card>

        {/* Final Comments */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Additional Comments (Optional)</label>
          <textarea
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any additional information or comments for reviewers..."
            value={data.finalComments || ''}
            onChange={(e) => update({ finalComments: e.target.value })}
          />
        </div>

        {/* Attestation */}
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900">Submission Attestation</h4>
                <p className="text-sm text-blue-800 mt-1">
                  I attest that the information provided in this submission is accurate and complete to the best of my knowledge. 
                  I understand that this tool will undergo review and approval processes as required by organizational policies.
                </p>
              </div>
              <Toggle
                checked={data.attest || false}
                onChange={handleAttestationChange}
              />
            </div>
            {localErrors.attest && (
              <p className="text-sm text-red-600">{localErrors.attest}</p>
            )}
          </div>
        </Card>

        {/* Warning for incomplete submission */}
        {completionStatus.percentage < 80 && (
          <Card className="bg-yellow-50 border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900 mb-1">Incomplete Submission</h4>
                <p className="text-sm text-yellow-800">
                  Your submission is {completionStatus.percentage}% complete. While you can submit now, 
                  incomplete submissions may require additional information during the review process.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t mt-8">
        <Button variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button 
          onClick={handleSubmit} 
          size="lg"
          disabled={!data.attest}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit for Review
        </Button>
      </div>
    </div>
  );
}
