import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PolicyInheritanceService } from '@/lib/governance/policyInheritanceService';
import type { Scope, PolicyInheritanceMode } from '@/types/policy-inheritance';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const policyFormSchema = z.object({
  policy_name: z.string().min(3, 'Policy name must be at least 3 characters'),
  inheritance_mode: z.enum(['replace', 'merge', 'append']),
  rules: z.string().min(2, 'Rules are required'),
  override_rules: z.string().optional(),
});

type PolicyFormData = z.infer<typeof policyFormSchema>;

interface CreatePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedScope: Scope | null;
  enterpriseId: string;
  onSuccess: () => void;
}

export const CreatePolicyDialog: React.FC<CreatePolicyDialogProps> = ({
  open,
  onOpenChange,
  selectedScope,
  enterpriseId,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const policyService = new PolicyInheritanceService();

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      policy_name: '',
      inheritance_mode: 'merge',
      rules: '{\n  "min_approvals": 3,\n  "audit_trail_required": true\n}',
      override_rules: '',
    },
  });

  const handleSubmit = async (data: PolicyFormData) => {
    if (!selectedScope) {
      toast.error('No scope selected');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate JSON
      let rulesObject: Record<string, any>;
      let overrideRulesObject: Record<string, any> | undefined;

      try {
        rulesObject = JSON.parse(data.rules);
      } catch (e) {
        toast.error('Rules must be valid JSON');
        setIsSubmitting(false);
        return;
      }

      if (data.override_rules && data.override_rules.trim()) {
        try {
          overrideRulesObject = JSON.parse(data.override_rules);
        } catch (e) {
          toast.error('Override rules must be valid JSON');
          setIsSubmitting(false);
          return;
        }
      }

      const policyId = await PolicyInheritanceService.createScopedPolicy({
        scope_id: selectedScope.id,
        policy_name: data.policy_name,
        inheritance_mode: data.inheritance_mode as PolicyInheritanceMode,
        rules: rulesObject,
        override_rules: overrideRulesObject,
        enterprise_id: enterpriseId,
      });

      if (policyId) {
        toast.success('Policy created successfully');
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error('Failed to create policy');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inheritanceModeInfo = {
    replace: 'Completely override parent policies. Child rules take full precedence.',
    merge: 'Combine with parent policies. Child rules override matching keys.',
    append: 'Add to parent policies. All parent rules are preserved, child adds new ones.',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scoped Policy</DialogTitle>
          <DialogDescription>
            Create a new policy at the <strong>{selectedScope?.scope_type}</strong> level:{' '}
            <strong>{selectedScope?.scope_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Policy Name */}
            <FormField
              control={form.control}
              name="policy_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Regional Data Privacy Policy"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this scoped policy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inheritance Mode */}
            <FormField
              control={form.control}
              name="inheritance_mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Inheritance Mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {(['replace', 'merge', 'append'] as const).map((mode) => (
                        <div key={mode} className="flex items-center space-x-2">
                          <RadioGroupItem value={mode} id={mode} />
                          <Label htmlFor={mode} className="flex items-center gap-2 cursor-pointer">
                            <span className="capitalize font-medium">{mode}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{inheritanceModeInfo[mode]}</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    How this policy interacts with parent scope policies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Policy Rules */}
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Rules (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"min_approvals": 3, "audit_trail_required": true}'
                      className="font-mono text-sm min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Define policy rules as JSON key-value pairs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Override Rules (Optional) */}
            <FormField
              control={form.control}
              name="override_rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Override Rules (JSON, Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"allowed_tools": ["ChatGPT", "Claude"]}'
                      className="font-mono text-sm min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional override rules specific to this scope
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
