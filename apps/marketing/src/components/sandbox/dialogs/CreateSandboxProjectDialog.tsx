import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSandboxProjects } from '@/hooks/useSandboxProjects';
import type { SandboxProjectMode } from '@/types/sandboxProject';

interface CreateSandboxProjectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  enterpriseId: string;
}

export function CreateSandboxProjectDialog({
  open,
  onClose,
  workspaceId,
  enterpriseId,
}: CreateSandboxProjectDialogProps) {
  const { createProject } = useSandboxProjects(workspaceId);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [mode, setMode] = useState<SandboxProjectMode>('tool_evaluation');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createProject({
        project_name: projectName,
        project_description: description,
        project_goal: goal,
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
        mode,
      });

      setProjectName('');
      setDescription('');
      setGoal('');
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sandbox Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Q1 2024 GDPR Compliance Testing"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Validate all AI models for GDPR compliance requirements"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="mode">Project Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as SandboxProjectMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="tool_evaluation">Tool Evaluation</SelectItem>
                <SelectItem value="policy_adaptation">Policy Adaptation</SelectItem>
                <SelectItem value="partner_governance">Partner Governance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goal">Project Goal</Label>
            <Input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="100% policy compliance before Q1 launch"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !projectName}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
