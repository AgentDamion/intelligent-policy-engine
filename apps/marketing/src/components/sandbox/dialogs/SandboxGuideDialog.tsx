import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface SandboxGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const guideSteps = [
  {
    title: 'Welcome to Policy Sandbox',
    content: 'Test AI governance policies in a safe environment before deploying them to production. The sandbox lets you validate policy logic, detect edge cases, and generate proof bundles for compliance.',
    visual: '🎯'
  },
  {
    title: 'The Meta-Loop Process',
    content: 'Every sandbox run follows the Meta-Loop:\n\n1️⃣ Observe - Input test data\n2️⃣ Analyze - Execute policy logic\n3️⃣ Validate - Check outcomes\n4️⃣ Improve - Refine policies',
    visual: '🔄'
  },
  {
    title: 'Creating Your First Run',
    content: 'Step-by-step:\n\n1. Select a policy from your workspace\n2. Configure test scenario (input data, expected outcome)\n3. Set control level (strict, moderate, permissive)\n4. Run simulation\n5. Review proof bundle with detailed logs',
    visual: '🧪'
  },
  {
    title: 'Understanding Results',
    content: '✅ Passed - Policy logic executed correctly\n\n⚠️ Flagged - Edge cases or bias signals detected\n\n❌ Failed - Policy validation errors or exceptions\n\nEach result includes a cryptographically signed proof bundle for audit trails.',
    visual: '📊'
  }
];

export function SandboxGuideDialog({ open, onOpenChange }: SandboxGuideDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartTesting = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  const step = guideSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sandbox Guide</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-8'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Visual */}
          <div className="flex items-center justify-center">
            <div className="text-8xl">{step.visual}</div>
          </div>

          {/* Content */}
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} / {guideSteps.length}
            </div>

            {currentStep === guideSteps.length - 1 ? (
              <Button onClick={handleStartTesting} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Got It!
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
