import React from 'react';
import { cn } from '@/lib/utils';
import { Check, User, FileText, ClipboardList, Search, Trophy } from 'lucide-react';

interface AssessmentStepperProps {
  currentStep: number;
  totalSteps: number;
}

const stepConfig = [
  { icon: User, label: 'Intent', description: 'Organization type' },
  { icon: FileText, label: 'About You', description: 'Basic information' },
  { icon: ClipboardList, label: 'Assessment', description: '28 questions' },
  { icon: Search, label: 'Review', description: 'Validate responses' },
  { icon: Trophy, label: 'Results', description: 'Your score' }
];

export function AssessmentStepper({ currentStep, totalSteps }: AssessmentStepperProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground mb-2">Assessment Progress</h3>
        <p className="text-sm text-muted-foreground">
          Complete all steps to get your AI Acceleration Score
        </p>
      </div>
      
      {stepConfig.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const Icon = step.icon;
        
        return (
          <div
            key={index}
            className={cn(
              'flex items-start space-x-3 p-3 rounded-lg transition-all',
              isActive && 'bg-brand-teal/10 border border-brand-teal/20',
              isCompleted && 'opacity-75'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                isCompleted && 'bg-brand-teal text-primary-foreground',
                isActive && !isCompleted && 'bg-brand-teal/20 text-brand-teal border-2 border-brand-teal',
                !isActive && !isCompleted && 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  isActive && 'text-primary',
                  isCompleted && 'text-foreground',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
      
      {/* Help Section */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium text-foreground mb-2">Need Help?</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Assessment takes 10-15 minutes to complete thoroughly.
        </p>
        <button className="text-xs text-primary hover:text-primary/80 font-medium">
          View Assessment Guide
        </button>
      </div>
    </div>
  );
}