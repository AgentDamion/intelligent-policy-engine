/**
 * AI Policy Wizard - Multi-step wizard for policy submission and AI analysis
 * Transforms basic form into guided AI-powered experience
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Brain, 
  CheckCircle, 
  Eye 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import wizard steps
import { WizardStep1 } from './WizardStep1';
import { WizardStep2 } from './WizardStep2';
import { WizardStep3 } from './WizardStep3';
import { WizardStep4 } from './WizardStep4';

interface PolicyWizardProps {
  enterpriseId: string;
  onComplete?: (result: any) => void;
}

// Wizard state management
interface WizardState {
  // Step 1: Document Input
  documentData: {
    title: string;
    description: string;
    content: string;
    uploadedFiles: File[];
    inputMethod: 'upload' | 'paste' | 'template';
  };
  
  // Step 2: AI Analysis Results
  analysisResult: any;
  
  // Step 3: Validated structured data
  validatedData: {
    toolName: string;
    vendor: string;
    approvalStatus: string;
    riskLevel: string;
    useCases: string[];
    restrictions: string[];
    confidence: Record<string, number>;
  };
  
  // Step 4: Final submission
  submissionResult: any;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Document Input',
    description: 'Upload or paste policy content',
    icon: FileText,
  },
  {
    id: 2,
    title: 'AI Analysis',
    description: 'Cursor AI processes your policy',
    icon: Brain,
  },
  {
    id: 3,
    title: 'Review & Validate',
    description: 'Verify extracted data',
    icon: CheckCircle,
  },
  {
    id: 4,
    title: 'Complete',
    description: 'Review and submit',
    icon: Eye,
  },
];

export const PolicyWizard: React.FC<PolicyWizardProps> = ({
  enterpriseId,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardState, setWizardState] = useState<WizardState>({
    documentData: {
      title: '',
      description: '',
      content: '',
      uploadedFiles: [],
      inputMethod: 'paste',
    },
    analysisResult: null,
    validatedData: {
      toolName: '',
      vendor: '',
      approvalStatus: '',
      riskLevel: '',
      useCases: [],
      restrictions: [],
      confidence: {},
    },
    submissionResult: null,
  });

  const updateWizardState = (stepData: Partial<WizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...stepData,
    }));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return wizardState.documentData.title && wizardState.documentData.content;
      case 2:
        return wizardState.analysisResult !== null;
      case 3:
        return wizardState.validatedData.toolName !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length && canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = (result: any) => {
    updateWizardState({ submissionResult: result });
    if (onComplete) {
      onComplete(result);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <WizardStep1
            data={wizardState.documentData}
            onDataChange={(data) => updateWizardState({ documentData: data })}
          />
        );
      case 2:
        return (
          <WizardStep2
            documentData={wizardState.documentData}
            enterpriseId={enterpriseId}
            onAnalysisComplete={(result) => updateWizardState({ analysisResult: result })}
          />
        );
      case 3:
        return (
          <WizardStep3
            analysisResult={wizardState.analysisResult}
            validatedData={wizardState.validatedData}
            onDataValidated={(data) => updateWizardState({ validatedData: data })}
          />
        );
      case 4:
        return (
          <WizardStep4
            wizardState={wizardState}
            enterpriseId={enterpriseId}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = WIZARD_STEPS.find(step => step.id === currentStep);
  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentStepData && (
                  <currentStepData.icon className="h-5 w-5 text-brand-teal" />
                )}
                Step {currentStep}: {currentStepData?.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStepData?.description}
              </p>
            </div>
            <Badge variant="outline">
              {currentStep} of {WIZARD_STEPS.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {WIZARD_STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    step.id <= currentStep
                      ? "bg-brand-teal text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.id <= currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="mt-1 text-center">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className="animate-fade-in">
        {renderStepContent()}
      </div>

      {/* Navigation Controls */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {WIZARD_STEPS.length}
            </span>
          </div>

          {currentStep < WIZARD_STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Badge className="bg-brand-green">
              Complete
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};