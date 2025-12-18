import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { CheckCircle2, Circle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { PolicyInstance } from '@/types/policyInstance';

interface SimulationWizardStep3Props {
  form: UseFormReturn<any>;
  policyInstances: PolicyInstance[];
  selectedToolVersionId?: string;
}

export function SimulationWizardStep3({ form, policyInstances, selectedToolVersionId }: SimulationWizardStep3Props) {
  const selectedPolicies = form.watch('policy_instance_ids') || [];
  const [selectAll, setSelectAll] = useState(false);

  const handleTogglePolicy = (policyId: string) => {
    const current = selectedPolicies as string[];
    if (current.includes(policyId)) {
      form.setValue('policy_instance_ids', current.filter(id => id !== policyId));
    } else {
      form.setValue('policy_instance_ids', [...current, policyId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      form.setValue('policy_instance_ids', []);
      setSelectAll(false);
    } else {
      form.setValue('policy_instance_ids', policyInstances.map(p => p.id));
      setSelectAll(true);
    }
  };

  if (!selectedToolVersionId) {
    return (
      <div className="p-8 text-center border border-dashed rounded-lg">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Select an AI tool first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <FormLabel>Select Active Policies to Test</FormLabel>
          <FormDescription className="mt-1">
            Choose which governance policies to validate against
          </FormDescription>
        </div>
        {policyInstances.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectAll ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      <FormField
        control={form.control}
        name="policy_instance_ids"
        render={() => (
          <FormItem>
            <FormControl>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {policyInstances.length === 0 ? (
                  <div className="p-6 text-center border border-dashed rounded-lg">
                    <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No approved policies found for this tool
                    </p>
                  </div>
                ) : (
                  policyInstances.map((policy) => {
                    const isSelected = selectedPolicies.includes(policy.id);
                    return (
                      <button
                        key={policy.id}
                        type="button"
                        onClick={() => handleTogglePolicy(policy.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                          "hover:border-accent hover:bg-accent/5",
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm text-foreground">
                            {policy.use_case}
                          </h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            Status: {policy.status}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
