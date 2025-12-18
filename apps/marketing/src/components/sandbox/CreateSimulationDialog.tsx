import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useResponsiveSandbox } from '@/hooks/useResponsiveSandbox';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { executeSandboxRun, waitForSimulationCompletion } from '@/services/sandboxService';
import { useToast } from '@/hooks/use-toast';
import { AIToolsService } from '@/services/aiToolsService';
import { usePolicyInstances } from '@/hooks/usePolicyInstances';
import type { AIToolVersion } from '@/types/aiTools';
import { SimulationWizardStep1 } from './dialogs/wizard/SimulationWizardStep1';
import { SimulationWizardStep2 } from './dialogs/wizard/SimulationWizardStep2';
import { SimulationWizardStep3 } from './dialogs/wizard/SimulationWizardStep3';
import { SimulationWizardStep4 } from './dialogs/wizard/SimulationWizardStep4';
import { WizardProgress } from './dialogs/wizard/WizardProgress';

const formSchema = z.object({
  simulation_name: z.string().min(3, 'Name must be at least 3 characters'),
  simulation_purpose: z.string().optional(),
  tool_version_id: z.string().uuid('Must select a tool version'),
  policy_instance_ids: z.array(z.string().uuid()).min(1, 'Select at least one policy'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  expected_outcome: z.enum(['approve', 'reject', 'conditional']),
  control_level: z.enum(['strict', 'standard', 'permissive']),
});

const WIZARD_STEPS = [
  { title: 'Name', description: 'Give your simulation a name' },
  { title: 'AI Tool', description: 'Select tool to test' },
  { title: 'Policies', description: 'Choose policies to validate' },
  { title: 'Configure', description: 'Set test parameters' },
];

interface CreateSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  enterpriseId: string;
  onRunCreated?: (runId?: string) => void;
  selectedProjectId?: string | null;
  projectMode?: 'tool_evaluation' | 'policy_adaptation' | 'partner_governance';
}

export function CreateSimulationDialog({
  open,
  onOpenChange,
  workspaceId,
  enterpriseId,
  onRunCreated,
  projectMode = 'tool_evaluation',
}: CreateSimulationDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [searchParams] = useSearchParams();
  const [toolVersions, setToolVersions] = useState<AIToolVersion[]>([]);
  const [isFirstSimulation, setIsFirstSimulation] = useState(false);
  const { isMobile } = useResponsiveSandbox();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      control_level: 'standard',
      expected_outcome: 'approve',
      policy_instance_ids: [],
    },
  });

  const selectedToolVersionId = form.watch('tool_version_id');
  const simulationName = form.watch('simulation_name');
  const selectedPolicyIds = form.watch('policy_instance_ids') || [];

  const { instances } = usePolicyInstances({
    enterpriseId,
    workspaceId,
    toolVersionId: selectedToolVersionId,
    status: 'approved',
    autoLoad: !!selectedToolVersionId,
  });

  // Load tool versions on open
  useEffect(() => {
    if (open) {
      const loadVersions = async () => {
        const tools = await AIToolsService.getTools();
        setToolVersions([]);
      };
      loadVersions();
    }
  }, [open]);

  // Pre-fill form if policy_instance_id in URL
  useEffect(() => {
    const instanceIdFromUrl = searchParams.get('policy_instance_id');
    if (instanceIdFromUrl && open) {
      form.setValue('policy_instance_ids', [instanceIdFromUrl]);
    }
  }, [searchParams, open, form]);

  // Reset wizard on dialog open/close
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setAutoRunning(false);
    }
  }, [open]);

  const triggerConfetti = async () => {
    await confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2CCCC3', '#FF7A59', '#34D399'],
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      // Execute simulation for first policy
      const result = await executeSandboxRun({
        policy_id: values.policy_instance_ids[0],
        test_scenario: {
          description: values.description,
          inputs: {
            test_mode: true,
            timestamp: new Date().toISOString(),
            simulation_name: values.simulation_name,
            simulation_purpose: values.simulation_purpose,
          },
          expected_outcome: values.expected_outcome,
        },
        control_level: values.control_level,
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
      } as any);

      const runId = result.run_id;

      toast({
        title: 'Simulation created',
        description: 'Running your first simulation...',
      });

      // Auto-run for first simulation
      if (isFirstSimulation) {
        setAutoRunning(true);
        
        try {
          // Wait for completion
          await waitForSimulationCompletion(runId);
          
          // Trigger celebration
          await triggerConfetti();
          
          toast({
            title: '🎉 First simulation complete!',
            description: 'Check the results in the right panel',
          });
          
          // Auto-open results
          onRunCreated?.(runId);
        } catch (error) {
          console.error('Auto-run error:', error);
          toast({
            title: 'Simulation running',
            description: 'Taking longer than expected. Check back soon.',
          });
          onRunCreated?.(runId);
        } finally {
          setAutoRunning(false);
        }
      } else {
        onRunCreated?.(runId);
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to start simulation',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = await form.trigger(['simulation_name']);
        break;
      case 2:
        isValid = await form.trigger(['tool_version_id']);
        break;
      case 3:
        isValid = await form.trigger(['policy_instance_ids']);
        break;
      case 4:
        isValid = await form.trigger(['description', 'expected_outcome', 'control_level']);
        break;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!simulationName && simulationName.length >= 3;
      case 2:
        return !!selectedToolVersionId;
      case 3:
        return selectedPolicyIds.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[700px] max-h-[90vh]",
          isMobile && "w-full h-full max-w-none rounded-none"
        )}
        role="dialog"
        aria-labelledby="simulation-dialog-title"
        aria-describedby="simulation-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="simulation-dialog-title">Create New Simulation</DialogTitle>
          <DialogDescription id="simulation-dialog-description">
            Test AI tools against governance policies in a controlled environment
          </DialogDescription>
        </DialogHeader>

        <WizardProgress 
          currentStep={currentStep} 
          totalSteps={4} 
          steps={WIZARD_STEPS}
          aria-label={`Step ${currentStep} of 4`}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="min-h-[300px]">
              {currentStep === 1 && <SimulationWizardStep1 form={form} />}
              {currentStep === 2 && <SimulationWizardStep2 form={form} toolVersions={toolVersions} />}
              {currentStep === 3 && (
                <SimulationWizardStep3 
                  form={form} 
                  policyInstances={instances}
                  selectedToolVersionId={selectedToolVersionId}
                />
              )}
              {currentStep === 4 && (
                <SimulationWizardStep4 
                  form={form}
                  simulationName={simulationName}
                  selectedPolicyCount={selectedPolicyIds.length}
                />
              )}
            </div>

            {/* Loading overlay for auto-run */}
            {autoRunning && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-md">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-accent" />
                  <h3 className="text-lg font-semibold mb-2">Running Your First Simulation</h3>
                  <p className="text-sm text-muted-foreground">
                    Testing AI tool against governance policies...
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => onOpenChange(false) : handleBack}
                disabled={loading || autoRunning}
              >
                {currentStep === 1 ? (
                  'Cancel'
                ) : (
                  <>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                {currentStep === 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || autoRunning}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext() || loading}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading || autoRunning}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create & Run
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
