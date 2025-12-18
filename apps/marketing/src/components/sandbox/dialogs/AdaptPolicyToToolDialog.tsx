import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePolicyInstances } from '@/hooks/usePolicyInstances';
import { AIToolsService } from '@/services/aiToolsService';
import { PolicyTemplateService, PolicyTemplate } from '@/services/PolicyTemplateService';
import { PolicyAdaptationService } from '@/services/PolicyAdaptationService';
import type { AIToolVersion } from '@/types/aiTools';
import type { PolicyObjectModel } from '@/types/policyObjectModel';

const formSchema = z.object({
  template_id: z.string().uuid('Must select a policy template'),
  tool_version_id: z.string().uuid('Must select a tool version'),
  use_case: z.string().min(10, 'Use case must be at least 10 characters'),
  jurisdiction: z.array(z.string()).min(1, 'Select at least one jurisdiction'),
  audience: z.array(z.string()).min(1, 'Select at least one audience'),
  pom_edits: z.string().optional(),
});

interface AdaptPolicyToToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterpriseId: string;
  workspaceId: string;
  templateId?: string;
  onInstanceCreated?: (instanceId: string) => void;
}

export function AdaptPolicyToToolDialog({
  open,
  onOpenChange,
  enterpriseId,
  workspaceId,
  templateId,
  onInstanceCreated,
}: AdaptPolicyToToolDialogProps) {
  const { toast } = useToast();
  const { createInstance, submitForApproval } = usePolicyInstances();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [toolVersions, setToolVersions] = useState<AIToolVersion[]>([]);
  const [generatedPOM, setGeneratedPOM] = useState<PolicyObjectModel | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = PolicyTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load templates',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: templateId || '',
      jurisdiction: [],
      audience: [],
    },
  });

  const selectedToolVersionId = form.watch('tool_version_id');

  // Load tool versions when template is selected
  const loadToolVersions = async () => {
    try {
      setLoading(true);
      const versions = await AIToolsService.getAllToolVersions();
      setToolVersions(versions);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load tool versions',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      loadToolVersions();
    }
    if (step === 3) {
      // Get template and tool version to adapt POM
      const template = templates.find(t => t.id === form.getValues('template_id'));
      const toolVersion = toolVersions.find(v => v.id === selectedToolVersionId);
      
      if (template && toolVersion) {
        const adaptedPOM = PolicyAdaptationService.adaptPOM(
          template.template as PolicyObjectModel,
          toolVersion,
          form.getValues('use_case') || 'General AI usage',
          form.getValues('jurisdiction') || [],
          form.getValues('audience') || []
        );
        setGeneratedPOM(adaptedPOM);
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      // Get the selected template
      const template = templates.find(t => t.id === values.template_id);
      if (!template) {
        toast({
          variant: 'destructive',
          title: 'Template not found',
        });
        return;
      }

      // Apply manual POM edits if any, otherwise use template
      let finalPOM = template.template as PolicyObjectModel;
      if (values.pom_edits) {
        try {
          finalPOM = JSON.parse(values.pom_edits);
        } catch {
          toast({
            variant: 'destructive',
            title: 'Invalid POM JSON',
            description: 'Could not parse manual edits',
          });
          return;
        }
      }

      const instance = await createInstance({
        template_id: values.template_id,
        tool_version_id: values.tool_version_id,
        use_case: values.use_case,
        jurisdiction: values.jurisdiction,
        audience: values.audience,
        pom: finalPOM,
        enterprise_id: enterpriseId,
        workspace_id: workspaceId,
      });

      // Submit for approval
      await submitForApproval(instance.id);

      toast({
        title: 'Policy adapted successfully',
        description: 'Instance submitted for approval',
      });

      onInstanceCreated?.(instance.id);
      onOpenChange(false);
      form.reset();
      setStep(1);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create instance',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adapt Policy to Tool</DialogTitle>
          <DialogDescription>
            Create a policy instance tailored for a specific AI tool version
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Select Template (if not pre-filled) */}
            {step === 1 && !templateId && (
              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Template</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Base policy framework to adapt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 2: Select Tool Version */}
            {step === 2 && (
              <FormField
                control={form.control}
                name="tool_version_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Tool Version</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tool version" />
                        </SelectTrigger>
                      </FormControl>
                    <SelectContent className="bg-background z-50">
                        {toolVersions.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No tool versions available</div>
                        ) : (
                          toolVersions.map((version) => (
                            <SelectItem key={version.id} value={version.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{(version as any).tool?.name || 'Unknown Tool'}</span>
                                <span className="text-xs text-muted-foreground">v{version.version}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                    </SelectContent>
                    </Select>
                    <FormDescription>
                      Specific version to create policy for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 3: Define Use Case */}
            {step === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="use_case"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Use Case Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe how this tool will be used..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurisdiction</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {['US', 'EU', 'UK', 'APAC'].map((region) => (
                          <Badge
                            key={region}
                            variant={field.value?.includes(region) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = field.value || [];
                              const updated = current.includes(region)
                                ? current.filter((r) => r !== region)
                                : [...current, region];
                              field.onChange(updated);
                            }}
                          >
                            {region}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {['internal', 'partners', 'vendors', 'public'].map((aud) => (
                          <Badge
                            key={aud}
                            variant={field.value?.includes(aud) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = field.value || [];
                              const updated = current.includes(aud)
                                ? current.filter((a) => a !== aud)
                                : [...current, aud];
                              field.onChange(updated);
                            }}
                          >
                            {aud}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 4: Review Generated POM */}
            {step === 4 && generatedPOM && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Generated Policy Object Model</h3>
                  <pre className="text-xs overflow-auto max-h-64 bg-background p-2 rounded">
                    {JSON.stringify(generatedPOM, null, 2)}
                  </pre>
                </div>

                <FormField
                  control={form.control}
                  name="pom_edits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manual Edits (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste modified JSON here to override..."
                          rows={6}
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Advanced: Directly edit the POM JSON
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 5: Submit for Approval */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-primary/5">
                  <h3 className="font-medium mb-2">Ready to Submit</h3>
                  <p className="text-sm text-muted-foreground">
                    This policy instance will be submitted for approval. The PolicyAgent
                    will review it and generate a proof bundle upon approval.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Tool:</span> {selectedToolVersionId}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Use Case:</span> {form.watch('use_case')}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Jurisdiction:</span>{' '}
                    {form.watch('jurisdiction')?.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || loading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Approval
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
