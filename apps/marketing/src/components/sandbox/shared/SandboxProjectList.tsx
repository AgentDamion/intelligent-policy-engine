import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Play, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSandboxProjects } from '@/hooks/useSandboxProjects';

interface SandboxProjectListProps {
  workspaceId: string;
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

export function SandboxProjectList({
  workspaceId,
  selectedProjectId,
  onProjectSelect,
}: SandboxProjectListProps) {
  const { projects, loading } = useSandboxProjects(workspaceId);

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No sandbox projects yet. Create one to organize your testing.
      </div>
    );
  }

  const handleProjectClick = (projectId: string) => {
    if (selectedProjectId === projectId) {
      onProjectSelect('');
    } else {
      onProjectSelect(projectId);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sandbox Projects
        </h3>
        {selectedProjectId && (
          <button
            onClick={() => onProjectSelect('')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {projects.map((project) => (
          <Card
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={cn(
              'p-3 cursor-pointer transition-all hover:shadow-sm hover:bg-accent/50',
              selectedProjectId === project.id && 'bg-accent border-primary'
            )}
          >
            <div className="flex items-start gap-2">
              <FolderKanban className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {project.project_name}
                </div>
                
                {project.project_description && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {project.project_description}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    {project.total_runs} runs
                  </Badge>
                  
                  {project.passed_runs > 0 && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {project.passed_runs}
                    </Badge>
                  )}
                  
                  {project.failed_runs > 0 && (
                    <Badge variant="outline" className="text-xs text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      {project.failed_runs}
                    </Badge>
                  )}

                  {project.status === 'completed' && (
                    <Badge variant="default" className="text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
