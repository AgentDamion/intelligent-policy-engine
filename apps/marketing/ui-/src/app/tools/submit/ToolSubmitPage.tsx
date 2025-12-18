import React, { useState } from 'react';
import { Button, Card, Toast, useToast } from '@/components/ui';
import { useToolSubmission } from './useToolSubmission';
import type { SubmissionStep } from './types';
import { 
  FileText, 
  Users, 
  Brain, 
  Lock, 
  Database, 
  Shield, 
  AlertCircle, 
  Eye, 
  CheckSquare, 
  Send,
  Save,
  X,
  Clock,
  CheckCircle,
  Circle
} from 'lucide-react';

// Import step components
import { ToolIdentificationStep } from './steps/01-ToolIdentification';
import { BusinessContextStep } from './steps/02-BusinessContext';
import { UseCasesStep } from './steps/03-UseCases';
import { DataPrivacyStep } from './steps/04-DataPrivacy';
import { EvidenceUploadStep } from './steps/05-EvidenceUpload';
import { TechnicalRequirementsStep } from './steps/06-TechnicalRequirements';
import { RiskComplianceStep } from './steps/07-RiskCompliance';
import { VendorAssessmentStep } from './steps/08-VendorAssessment';
import { ApprovalChainStep } from './steps/09-ApprovalChain';
import { ReviewSubmitStep } from './steps/10-ReviewSubmit';

// Import sidebar components
import { ComplianceMeter } from './components/ComplianceMeter';
import { MetaLoopAnalysis } from './components/MetaLoopAnalysis';
import { PolicyHints } from './components/PolicyHints';

const steps: SubmissionStep[] = [
  { id: 1, title: 'Tool Identification', description: 'Basic tool information and categorization', icon: FileText, component: ToolIdentificationStep },
  { id: 2, title: 'Business Context', description: 'Business justification and requirements', icon: Users, component: BusinessContextStep },
  { id: 3, title: 'Use Cases', description: 'Detailed use case scenarios', icon: Brain, component: UseCasesStep },
  { id: 4, title: 'Data Privacy', description: 'Data handling and privacy requirements', icon: Lock, component: DataPrivacyStep },
  { id: 5, title: 'Evidence Upload', description: 'Supporting documentation and evidence', icon: Database, component: EvidenceUploadStep },
  { id: 6, title: 'Technical Requirements', description: 'Technical specifications and integration', icon: Shield, component: TechnicalRequirementsStep },
  { id: 7, title: 'Risk & Compliance', description: 'Risk assessment and compliance mapping', icon: AlertCircle, component: RiskComplianceStep },
  { id: 8, title: 'Vendor Assessment', description: 'Vendor evaluation and due diligence', icon: Eye, component: VendorAssessmentStep },
  { id: 9, title: 'Approval Chain', description: 'Approval workflow and stakeholders', icon: CheckSquare, component: ApprovalChainStep },
  { id: 10, title: 'Review & Submit', description: 'Final review and submission', icon: Send, component: ReviewSubmitStep }
];

interface ToolSubmitPageProps {
  submissionId?: string;
}

export function ToolSubmitPage({ submissionId }: ToolSubmitPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const {
    id,
    data,
    analysis,
    hints,
    saving,
    error,
    isAnalyzing,
    lastSaved,
    completionPercentage,
    update,
    save,
    runPrecheck,
    submit,
    canSubmit,
    clearError
  } = useToolSubmission(submissionId);

  const currentStepData = steps.find(s => s.id === currentStep);
  const CurrentStepComponent = currentStepData?.component;

  const handleNext = () => {
    if (currentStep < steps.length) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps, current step, or next step
    if (completedSteps.includes(stepId) || stepId === currentStep || stepId === currentStep - 1) {
      setCurrentStep(stepId);
    }
  };

  const handleSaveDraft = async () => {
    await save();
    showToast({
      title: 'Draft saved',
      description: 'Your progress has been saved.',
      type: 'success'
    });
  };

  const handleSubmit = async () => {
    const success = await submit();
    if (success) {
      showToast({
        title: 'Submission successful',
        description: 'Your tool submission has been sent for review.',
        type: 'success'
      });
      // Redirect to success page or dashboard
    }
  };

  const getStepIcon = (step: SubmissionStep) => {
    const IconComponent = step.icon;
    if (completedSteps.includes(step.id)) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (currentStep === step.id) {
      return <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">New Tool Submission</h1>
              <p className="text-sm text-gray-600">
                AI Tool Approval Request {data.status === 'draft' && '• Draft'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completionPercentage}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation */}
        <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Submission Steps</h3>
            <div className="space-y-2">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  disabled={!completedSteps.includes(step.id) && step.id !== currentStep && step.id !== currentStep + 1}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                      : completedSteps.includes(step.id)
                      ? 'hover:bg-green-50 text-green-900'
                      : step.id === currentStep + 1 || step.id === currentStep - 1
                      ? 'hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {getStepIcon(step)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{step.title}</div>
                    <div className="text-xs text-gray-500 truncate">{step.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <Card className="h-full">
              {error && (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">{error}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearError}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
              
              {CurrentStepComponent && data && (
                <CurrentStepComponent
                  data={data}
                  update={update}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  saving={saving}
                  errors={errors}
                  setErrors={setErrors}
                />
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-6 space-y-6">
            <ComplianceMeter 
              score={completionPercentage}
              completedSteps={completedSteps.length}
              totalSteps={steps.length}
            />
            
            <MetaLoopAnalysis
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              onRunAnalysis={runPrecheck}
            />
            
            <PolicyHints
              hints={hints}
              category={data?.tool?.category}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
