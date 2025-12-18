import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAIToolUsage } from '@/hooks/useAIToolUsage';
import { useToast } from '@/hooks/use-toast';

const toolUsageSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  tool_name: z.string().min(1, 'Tool name is required'),
  how_it_was_used: z.string().min(1, 'Usage description is required'),
  files_created: z.array(z.string()).default([]),
  date_used: z.string().min(1, 'Date used is required'),
  workspace_id: z.string().min(1, 'Workspace ID is required'),
});

type ToolUsageFormData = z.infer<typeof toolUsageSchema>;

interface AIToolTrackingFormProps {
  projectId: string;
  workspaceId: string;
  onSuccess?: () => void;
}

const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
  'GitHub Copilot',
  'Jasper',
  'Copy.ai',
  'Runway ML',
  'Luma AI',
  'Other',
];

export const AIToolTrackingForm: React.FC<AIToolTrackingFormProps> = ({ 
  projectId, 
  workspaceId, 
  onSuccess 
}) => {
  const { createToolUsage } = useAIToolUsage();
  const { toast } = useToast();

  const form = useForm<ToolUsageFormData>({
    resolver: zodResolver(toolUsageSchema),
    defaultValues: {
      project_id: projectId,
      tool_name: '',
      how_it_was_used: '',
      files_created: [],
      date_used: new Date().toISOString().split('T')[0],
      workspace_id: workspaceId,
    },
  });

  const onSubmit = async (data: ToolUsageFormData) => {
    try {
      // Convert files_created string to array if it's not empty
      const filesArray = data.files_created.length > 0 && typeof data.files_created[0] === 'string' 
        ? data.files_created[0].split(',').map(f => f.trim()).filter(f => f.length > 0)
        : [];
      
      await createToolUsage({
        project_id: data.project_id,
        tool_name: data.tool_name,
        how_it_was_used: data.how_it_was_used,
        date_used: data.date_used,
        workspace_id: data.workspace_id,
        files_created: filesArray,
      });
      
      toast({
        title: 'Success',
        description: 'AI tool usage logged successfully!',
      });
      form.reset();
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to log AI tool usage. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Log AI Tool Usage</CardTitle>
        <CardDescription>
          Track how AI tools were used in this project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tool_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an AI tool" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AI_TOOLS.map((tool) => (
                        <SelectItem key={tool} value={tool}>
                          {tool}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="how_it_was_used"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How It Was Used</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe how the AI tool was used in this project"
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
              name="files_created"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Files Created</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter file names separated by commas"
                      onChange={(e) => field.onChange([e.target.value])}
                      value={field.value.join(', ')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_used"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Used</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Logging...' : 'Log AI Tool Usage'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};