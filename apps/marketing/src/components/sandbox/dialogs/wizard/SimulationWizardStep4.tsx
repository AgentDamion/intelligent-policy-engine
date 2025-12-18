import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

interface SimulationWizardStep4Props {
  form: UseFormReturn<any>;
  simulationName: string;
  selectedPolicyCount: number;
}

export function SimulationWizardStep4({ form, simulationName, selectedPolicyCount }: SimulationWizardStep4Props) {
  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <h4 className="font-medium text-sm text-foreground mb-3">Simulation Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{simulationName || 'Untitled'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Policies to test:</span>
            <span className="font-medium">{selectedPolicyCount} selected</span>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What do you want to test? *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the specific scenario you want to validate..."
                rows={4}
                {...field}
                className="resize-none"
              />
            </FormControl>
            <FormDescription>
              Detailed description of your test scenario (minimum 10 characters)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expected_outcome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What should happen?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="approve" id="approve" />
                  <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Approve</div>
                      <div className="text-xs text-muted-foreground">Policy should allow this action</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="reject" id="reject" />
                  <Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer flex-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <div>
                      <div className="font-medium">Reject</div>
                      <div className="text-xs text-muted-foreground">Policy should block this action</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="conditional" id="conditional" />
                  <Label htmlFor="conditional" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MinusCircle className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Conditional</div>
                      <div className="text-xs text-muted-foreground">Policy should require additional checks</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="control_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Policy Enforcement Level</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select enforcement level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="strict">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Strict</span>
                    <span className="text-xs text-muted-foreground">Maximum validation, no exceptions</span>
                  </div>
                </SelectItem>
                <SelectItem value="standard">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Standard</span>
                    <span className="text-xs text-muted-foreground">Balanced enforcement with warnings</span>
                  </div>
                </SelectItem>
                <SelectItem value="permissive">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Permissive</span>
                    <span className="text-xs text-muted-foreground">Minimal restrictions, audit only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How strictly should policies be enforced in this simulation?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
