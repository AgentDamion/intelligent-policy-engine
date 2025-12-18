import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProjectSelectorProps {
  value: { projectId: string; workspaceId: string };
  onChange: (projectId: string, workspaceId: string) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['policy-instances', value.workspaceId],
    enabled: !!value.workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_instances')
        .select('id, use_case')
        .eq('workspace_id', value.workspaceId)
        .order('use_case');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Workspace</Label>
        <Select
          value={value.workspaceId}
          onValueChange={(workspaceId) => onChange('', workspaceId)}
          disabled={workspacesLoading}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder={workspacesLoading ? 'Loading...' : 'Select workspace'} />
          </SelectTrigger>
          <SelectContent>
            {workspaces?.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.workspaceId && (
        <div>
          <Label>Project</Label>
          <Select
            value={value.projectId}
            onValueChange={(projectId) => onChange(projectId, value.workspaceId)}
            disabled={projectsLoading}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder={projectsLoading ? 'Loading...' : 'Select project'} />
            </SelectTrigger>
            <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.use_case}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
