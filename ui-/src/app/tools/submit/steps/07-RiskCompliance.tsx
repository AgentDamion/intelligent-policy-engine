import React, { useState } from 'react';
import { Button, Input, Select, Card, Toggle } from '@/components/ui';
import type { StepProps } from '../types';
import { AlertCircle, Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const riskLevels = [
  { value: 'low', label: 'Low Risk', color: 'green' },
  { value: 'medium', label: 'Medium Risk', color: 'yellow' },
  { value: 'high', label: 'High Risk', color: 'red' }
];

const complianceFrameworks = [
  'GDPR (General Data Protection Regulation)',
  'HIPAA (Health Insurance Portability and Accountability Act)',
  'SOX (Sarbanes-Oxley Act)',
  'FDA 21 CFR Part 11',
  'ISO 27001',
  'SOC 2 Type II',
  'NIST Cybersecurity Framework',
  'PCI DSS',
  'FISMA',
  'Other'
];

const riskCategories = [
  { id: 'bias', label: 'Algorithmic Bias', description: 'Risk of discriminatory or unfair outcomes' },
  { id: 'privacy', label: 'Data Privacy', description: 'Risk to personal or sensitive data' },
  { id: 'security', label: 'Security Vulnerabilities', description: 'Risk of data breaches or system compromise' },
  { id: 'accuracy', label: 'Output Accuracy', description: 'Risk of incorrect or misleading information' },
  { id: 'regulatory', label: 'Regulatory Compliance', description: 'Risk of non-compliance with regulations' },
  { id: 'operational', label: 'Operational Risk', description: 'Risk to business operations or continuity' }
];

export function RiskComplianceStep({ data, update, onNext, onPrev }: StepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(
    data.risk?.regulatoryRequirements || []
  );
  const [identifiedRisks, setIdentifiedRisks] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    if (localErrors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
    }

    update({
      risk: {
        ...data.risk,
        [field]: value
      }
    });
  };

  const handleFrameworkToggle = (framework: string) => {
    const newFrameworks = selectedFrameworks.includes(framework)
      ? selectedFrameworks.filter(f => f !== framework)
      : [...selectedFrameworks, framework];
    
    setSelectedFrameworks(newFrameworks);
    handleInputChange('regulatoryRequirements', newFrameworks);
  };

  const handleRiskToggle = (riskId: string) => {
    const newRisks = identifiedRisks.includes(riskId)
      ? identifiedRisks.filter(r => r !== riskId)
      : [...identifiedRisks, riskId];
    
    setIdentifiedRisks(newRisks);
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    const risk = data.risk || {};

    if (!risk.level) {
      errors.level = 'Risk level assessment is required';
    }
    if (!risk.mitigations?.trim()) {
      errors.mitigations = 'Risk mitigation plan is required';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const risk = data.risk || {};
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'high': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Risk & Compliance</h2>
            <p className="text-gray-600">
              Assess risks and ensure compliance with relevant frameworks and regulations.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* Risk Assessment */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Risk Assessment
          </h3>

          {/* Overall Risk Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Overall Risk Level *</label>
            <div className="grid grid-cols-3 gap-3">
              {riskLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleInputChange('level', level.value)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    risk.level === level.value
                      ? getRiskColor(level.value)
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                </button>
              ))}
            </div>
            {localErrors.level && (
              <p className="text-sm text-red-600">{localErrors.level}</p>
            )}
          </div>

          {/* Risk Categories */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Identified Risk Categories</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {riskCategories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    identifiedRisks.includes(category.id)
                      ? 'bg-orange-50 border-orange-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRiskToggle(category.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.label}</span>
                    {identifiedRisks.includes(category.id) && (
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Known Risks */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Known Risks & Concerns</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe any known risks, limitations, or concerns with this AI tool..."
              value={risk.knownRisks || ''}
              onChange={(e) => handleInputChange('knownRisks', e.target.value)}
            />
          </div>

          {/* Risk Mitigation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Risk Mitigation Plan *</label>
            <textarea
              className={`w-full min-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                localErrors.mitigations ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe how identified risks will be monitored, controlled, or mitigated..."
              value={risk.mitigations || ''}
              onChange={(e) => handleInputChange('mitigations', e.target.value)}
            />
            {localErrors.mitigations && (
              <p className="text-sm text-red-600">{localErrors.mitigations}</p>
            )}
          </div>
        </div>

        {/* Compliance Frameworks */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Compliance Requirements
          </h3>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Applicable Compliance Frameworks</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {complianceFrameworks.map((framework) => (
                <div
                  key={framework}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Toggle
                    checked={selectedFrameworks.includes(framework)}
                    onChange={() => handleFrameworkToggle(framework)}
                  />
                  <span className="text-sm">{framework}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Assessment Summary */}
        {risk.level && (
          <Card className={`p-4 ${getRiskColor(risk.level)}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium mb-1">Risk Assessment Summary</h4>
                <p className="text-sm">
                  This tool has been assessed as <strong>{risk.level?.toUpperCase()} RISK</strong>.
                  {risk.level === 'high' && ' Additional approvals and monitoring measures will be required.'}
                  {risk.level === 'medium' && ' Standard monitoring and periodic reviews will be implemented.'}
                  {risk.level === 'low' && ' Standard governance procedures will apply.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Compliance Guidance */}
        <Card className="bg-blue-50 border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Compliance Guidance</h4>
              <p className="text-sm text-blue-800">
                Ensure all selected compliance frameworks are properly addressed. High-risk tools may require 
                additional documentation, regular audits, and specialized approval processes. Consider consulting 
                with your compliance team for framework-specific requirements.
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
