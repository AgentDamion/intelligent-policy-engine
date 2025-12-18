import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Bot, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIToolVersion } from '@/types/aiTools';

interface SimulationWizardStep2Props {
  form: UseFormReturn<any>;
  toolVersions: AIToolVersion[];
}

export function SimulationWizardStep2({ form, toolVersions }: SimulationWizardStep2Props) {
  const selectedToolId = form.watch('tool_version_id');

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="tool_version_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select AI Tool to Test</FormLabel>
            <FormDescription className="mb-4">
              Choose which AI tool version you want to run through governance checks
            </FormDescription>
            <FormControl>
              <div className="grid gap-3">
                {toolVersions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-lg">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No tool versions available</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create an AI tool version first to run simulations
                    </p>
                  </div>
                ) : (
                  toolVersions.map((version) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => field.onChange(version.id)}
                      className={cn(
                        "relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                        "hover:border-accent hover:bg-accent/5",
                        selectedToolId === version.id
                          ? "border-accent bg-accent/10"
                          : "border-border bg-card"
                      )}
                    >
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0",
                        selectedToolId === version.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Bot className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{version.version}</h4>
                          {selectedToolId === version.id && (
                            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {version.notes || 'AI tool version for governance testing'}
                        </p>
                      </div>
                    </button>
                  ))
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
