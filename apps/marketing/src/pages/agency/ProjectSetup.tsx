import React, { useState } from 'react';
import { ProjectSetupForm } from '@/components/projects/ProjectSetupForm';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Building2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock workspace ID - in real app this would come from auth context
const MOCK_WORKSPACE_ID = 'workspace-1';

const ProjectSetup = () => {
  const [showForm, setShowForm] = useState(false);
  const { projects, loading } = useProjects(MOCK_WORKSPACE_ID);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Project Setup</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your agency projects
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ProjectSetupForm
            workspaceId={MOCK_WORKSPACE_ID}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Projects</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start tracking AI tool usage
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {project.project_name}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4" />
                      {project.client_name}
                    </div>
                    <Badge variant="secondary">{project.brand}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.project_description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {project.project_description}
                    </p>
                  )}
                  {project.expected_delivery_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(project.expected_delivery_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSetup;