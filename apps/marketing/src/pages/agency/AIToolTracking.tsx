import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIToolTrackingForm } from '@/components/projects/AIToolTrackingForm';
import { useProjects } from '@/hooks/useProjects';
import { useAIToolUsage } from '@/hooks/useAIToolUsage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Wrench, FileText, FolderPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/routes';

// Mock workspace ID - in real app this would come from auth context
const MOCK_WORKSPACE_ID = 'workspace-1';

const AIToolTracking = () => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const { projects, loading: projectsLoading } = useProjects(MOCK_WORKSPACE_ID);
  const { toolUsage, loading: usageLoading } = useAIToolUsage(selectedProjectId);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Tool Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Log and track AI tool usage across your projects
          </p>
        </div>
        {selectedProjectId && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Log Tool Usage
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
            <CardDescription>
              Choose a project to track AI tool usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-4">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No projects found. Create a project first to start tracking AI tool usage.</p>
                <Button onClick={() => navigate(routes.agency.projectSetup)} className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create Project
                </Button>
              </div>
            ) : (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name} - {project.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {showForm && selectedProjectId && (
          <AIToolTrackingForm
            projectId={selectedProjectId}
            workspaceId={MOCK_WORKSPACE_ID}
            onSuccess={() => setShowForm(false)}
          />
        )}

        {selectedProject && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project: {selectedProject.project_name}</CardTitle>
                <CardDescription>
                  Client: {selectedProject.client_name} | Brand: {selectedProject.brand}
                </CardDescription>
              </CardHeader>
            </Card>

            <div>
              <h2 className="text-2xl font-semibold mb-4">AI Tool Usage History</h2>
              
              {usageLoading ? (
                <div className="text-center py-8">Loading usage history...</div>
              ) : toolUsage.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No AI tool usage logged yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking AI tool usage for this project
                    </p>
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Log First Usage
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {toolUsage.map((usage) => (
                    <Card key={usage.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          {usage.tool_name}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(usage.date_used).toLocaleDateString()}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {usage.how_it_was_used}
                        </p>
                        {usage.files_created.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm font-medium">Files Created:</span>
                            </div>
                            <div className="space-y-1">
                              {usage.files_created.slice(0, 3).map((file, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {file}
                                </Badge>
                              ))}
                              {usage.files_created.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{usage.files_created.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIToolTracking;