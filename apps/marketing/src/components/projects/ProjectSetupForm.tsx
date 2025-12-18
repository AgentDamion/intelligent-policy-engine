import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Activity } from 'lucide-react';
import { routes } from '@/lib/routes';

const projectSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  brand: z.string().min(1, 'Brand is required'),
  project_name: z.string().min(1, 'Project name is required'),
  project_description: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  workspace_id: z.string().min(1, 'Workspace ID is required'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectSetupFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export const ProjectSetupForm: React.FC<ProjectSetupFormProps> = ({ workspaceId, onSuccess }) => {
  const { createProject } = useProjects();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      client_name: '',
      brand: '',
      project_name: '',
      project_description: '',
      expected_delivery_date: '',
      workspace_id: workspaceId,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await createProject({
        client_name: data.client_name,
        brand: data.brand,
        project_name: data.project_name,
        workspace_id: data.workspace_id,
        project_description: data.project_description || '',
        expected_delivery_date: data.expected_delivery_date || '',
      });
      toast({
        title: 'Success',
        description: 'Project created successfully!',
      });
      form.reset();
      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Project Created Successfully!</h3>
          <p className="text-muted-foreground mb-6">
            Your project has been set up. You can now start logging AI tool usage for this project.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              Create Another Project
            </Button>
            <Button onClick={() => navigate(routes.agency.aiToolTracking)} className="gap-2">
              <Activity className="h-4 w-4" />
              Log AI Tool Usage
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>
          Start a new project by filling out the details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter brand name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the project objectives and scope"
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
              name="expected_delivery_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};