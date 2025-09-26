import React, { useState } from 'react';
import { Button, Input, Select, Card } from '@/components/ui';
import type { StepProps } from '../types';
import { FileText, HelpCircle, Info } from 'lucide-react';

const categoryOptions = [
  { value: 'generative-ai', label: 'Generative AI' },
  { value: 'data-analytics', label: 'Data Analytics' },
  { value: 'machine-learning', label: 'Machine Learning' },
  { value: 'natural-language', label: 'Natural Language Processing' },
  { value: 'computer-vision', label: 'Computer Vision' },
  { value: 'automation', label: 'Process Automation' },
  { value: 'other', label: 'Other' }
];

const licenseOptions = [
  { value: 'oss', label: 'Free/Open Source' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'one_time', label: 'One-time Purchase' },
  { value: 'usage', label: 'Usage-based' },
  { value: 'enterprise', label: 'Enterprise License' }
];

export function ToolIdentificationStep({ data, update, onNext, onPrev }: StepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    // Clear local error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Update the tool section
    update({
      tool: {
        ...data.tool,
        [field]: value
      }
    });
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    const tool = data.tool || {};

    if (!tool.name?.trim()) {
      errors.name = 'Tool name is required';
    }
    if (!tool.vendor?.trim()) {
      errors.vendor = 'Vendor/Provider is required';
    }
    if (!tool.category) {
      errors.category = 'Category is required';
    }
    if (!tool.description?.trim()) {
      errors.description = 'Description is required';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const tool = data.tool || {};

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tool Identification</h2>
            <p className="text-gray-600">
              Provide basic information about the AI tool you want to submit for approval.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tool Name *</label>
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Enter the official name of the AI tool or system
                  </div>
                </div>
              </div>
            </div>
            <Input
              placeholder="e.g., ChatGPT, Notion AI, GitHub Copilot"
              value={tool.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={localErrors.name ? 'border-red-500' : ''}
            />
            {localErrors.name && (
              <p className="text-sm text-red-600">{localErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Vendor/Provider *</label>
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Company or organization that develops the AI tool
                  </div>
                </div>
              </div>
            </div>
            <Input
              placeholder="e.g., OpenAI, Notion Labs, GitHub"
              value={tool.vendor || ''}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              className={localErrors.vendor ? 'border-red-500' : ''}
            />
            {localErrors.vendor && (
              <p className="text-sm text-red-600">{localErrors.vendor}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Category *</label>
            <Select
              options={categoryOptions}
              value={tool.category || ''}
              onChange={(value) => handleInputChange('category', value)}
              placeholder="Select category"
              className={localErrors.category ? 'border-red-500' : ''}
            />
            {localErrors.category && (
              <p className="text-sm text-red-600">{localErrors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Version</label>
            <Input
              placeholder="e.g., GPT-4, v2.1 Latest"
              value={tool.version || ''}
              onChange={(e) => handleInputChange('version', e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Description/Documentation *</label>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap max-w-xs">
                  Describe what the tool does and how it will be used in your organization
                </div>
              </div>
            </div>
          </div>
          <textarea
            className={`w-full min-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              localErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the AI tool's functionality, capabilities, and intended use cases..."
            value={tool.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          {localErrors.description && (
            <p className="text-sm text-red-600">{localErrors.description}</p>
          )}
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Website/Documentation</label>
            <Input
              placeholder="https://..."
              value={tool.site || ''}
              onChange={(e) => handleInputChange('site', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Monthly Cost (USD)</label>
            <Input
              type="number"
              placeholder="e.g., 5000"
              value={tool.costUsd || ''}
              onChange={(e) => handleInputChange('costUsd', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Licensing Model */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Licensing Model</label>
          <Select
            options={licenseOptions}
            value={tool.license || ''}
            onChange={(value) => handleInputChange('license', value)}
            placeholder="Select licensing model"
          />
        </div>

        {/* Governance Hint */}
        <Card className="bg-blue-50 border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Governance Hint</h4>
              <p className="text-sm text-blue-800">
                For generative AI tools like GPT-4, additional bias testing and output monitoring requirements may apply. 
                Ensure you have documentation on data training sources and content filtering capabilities.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t mt-8">
        <div></div>
        <Button onClick={handleNext} size="lg">
          Next
        </Button>
      </div>
    </div>
  );
}
