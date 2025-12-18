import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { title: string; description: string }[];
}

export function WizardProgress({ currentStep, totalSteps, steps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all flex-shrink-0',
                      isCompleted && 'bg-accent border-accent text-accent-foreground',
                      isCurrent && 'border-accent text-accent bg-accent/10',
                      isUpcoming && 'border-border text-muted-foreground bg-background'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{stepNumber}</span>
                    )}
                  </div>
                  {stepNumber < totalSteps && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-2 transition-all',
                        isCompleted ? 'bg-accent' : 'bg-border'
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isCurrent && 'text-accent',
                      isCompleted && 'text-foreground',
                      isUpcoming && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
