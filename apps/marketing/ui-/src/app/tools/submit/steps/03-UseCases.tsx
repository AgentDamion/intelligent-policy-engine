import React, { useState } from 'react';
import { Button, Input, Card, Toggle } from '@/components/ui';
import type { StepProps } from '../types';
import { Brain, Info } from 'lucide-react';

export function UseCasesStep({ data, update, onNext, onPrev }: StepProps) {
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

    if (!purpose.description?.trim()) {
      errors.description = 'Use case description is required';
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
          <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Use Cases</h2>
            <p className="text-gray-600">
              Define specific use cases and scenarios for this AI tool.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Use Case Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Use Case Description *</label>
          <textarea
            className={`w-full min-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              localErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe specific use cases, workflows, and scenarios where this AI tool will be used..."
            value={purpose.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          {localErrors.description && (
            <p className="text-sm text-red-600">{localErrors.description}</p>
          )}
        </div>

        {/* Data Handling Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700">Handles Personal Data</span>
              <p className="text-xs text-gray-500">Will this tool process personally identifiable information?</p>
            </div>
            <Toggle
              checked={purpose.handlesPersonalData || false}
              onChange={(checked) => handleInputChange('handlesPersonalData', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700">Generates Regulated Content</span>
              <p className="text-xs text-gray-500">Will this tool generate content subject to regulations?</p>
            </div>
            <Toggle
              checked={purpose.generatesRegulatedContent || false}
              onChange={(checked) => handleInputChange('generatesRegulatedContent', checked)}
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
                This step is currently under development. Additional fields for detailed use case scenarios, 
                workflow diagrams, and integration points will be added in the next iteration.
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
