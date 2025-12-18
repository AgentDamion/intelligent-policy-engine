import React, { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import type { StepProps } from '../types';
import { Users, Info } from 'lucide-react';

export function BusinessContextStep({ data, update, onNext, onPrev }: StepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    if (localErrors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
    }

    update({
      purpose: {
        ...data.purpose,
        [field]: value
      }
    });
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    const purpose = data.purpose || {};

    if (!purpose.businessJustification?.trim()) {
      errors.businessJustification = 'Business justification is required';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const purpose = data.purpose || {};

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Business Context</h2>
            <p className="text-gray-600">
              Describe the business justification and requirements for this AI tool.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Business Justification */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Business Justification *</label>
          <textarea
            className={`w-full min-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              localErrors.businessJustification ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Explain why this AI tool is needed and how it supports business objectives..."
            value={purpose.businessJustification || ''}
            onChange={(e) => handleInputChange('businessJustification', e.target.value)}
          />
          {localErrors.businessJustification && (
            <p className="text-sm text-red-600">{localErrors.businessJustification}</p>
          )}
        </div>

        {/* Expected Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Expected Number of Users</label>
            <Input
              type="number"
              placeholder="e.g., 50"
              value={purpose.expectedUsers || ''}
              onChange={(e) => handleInputChange('expectedUsers', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Primary Departments</label>
            <Input
              placeholder="e.g., Marketing, R&D, Clinical"
              value={purpose.departments?.join(', ') || ''}
              onChange={(e) => handleInputChange('departments', e.target.value.split(',').map(d => d.trim()).filter(Boolean))}
            />
          </div>
        </div>

        {/* Placeholder Content */}
        <Card className="bg-yellow-50 border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Step In Development</h4>
              <p className="text-sm text-yellow-800">
                This step is currently under development. Additional fields for business requirements, 
                ROI analysis, and stakeholder information will be added in the next iteration.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t mt-8">
        <Button variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button onClick={handleNext} size="lg">
          Next
        </Button>
      </div>
    </div>
  );
}
