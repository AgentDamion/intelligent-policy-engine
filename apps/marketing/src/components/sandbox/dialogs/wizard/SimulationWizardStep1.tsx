import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { Lightbulb } from 'lucide-react';

interface SimulationWizardStep1Props {
  form: UseFormReturn<any>;
}

export function SimulationWizardStep1({ form }: SimulationWizardStep1Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
        <Lightbulb className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-accent-foreground">Name your simulation</p>
          <p className="text-muted-foreground mt-1">
            Give your test a clear name so you can easily find it later
          </p>
        </div>
      </div>

      <FormField
        control={form.control}
        name="simulation_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Simulation Name *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Customer Support GPT-4 Test"
                {...field}
                className="text-base"
              />
            </FormControl>
            <FormDescription>
              A descriptive name for this simulation (minimum 3 characters)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="simulation_purpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Purpose (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe what you're trying to validate with this simulation..."
                rows={3}
                {...field}
                className="resize-none"
              />
            </FormControl>
            <FormDescription>
              Optional: Help your team understand why you're running this test
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
