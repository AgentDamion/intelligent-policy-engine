import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { rfpService } from '@/services/rfp/rfpService';

interface PolicyDistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyId: string;
  policyVersionId: string;
  policyTitle: string;
  enterpriseId: string;
}

interface Workspace {
  id: string;
  name: string;
}

export const PolicyDistributionModal: React.FC<PolicyDistributionModalProps> = ({
  open,
  onOpenChange,
  policyId,
  policyVersionId,
  policyTitle,
  enterpriseId,
}) => {
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [includeAutoScoring, setIncludeAutoScoring] = useState(true);
  const { toast } = useToast();

  // Load partner workspaces when modal opens
  useEffect(() => {
    if (open && enterpriseId) {
      loadPartnerWorkspaces();
    }
  }, [open, enterpriseId]);

  const loadPartnerWorkspaces = async () => {
    try {
      setLoading(true);
      
      // Fetch all partner workspaces related to this enterprise
      // @ts-ignore - Supabase types can cause circular reference issues
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('workspace_type', 'agency_client')
        .order('name');

      if (error) throw error;

      setWorkspaces((data as Workspace[]) || []);
    } catch (err) {
      console.error('Error loading partner workspaces:', err);
      toast({
        title: 'Error',
        description: 'Failed to load partner workspaces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async () => {
    if (selectedWorkspaces.length === 0) {
      toast({
        title: 'No Partners Selected',
        description: 'Please select at least one partner to send the policy request to',
        variant: 'destructive',
      });
      return;
    }

    if (!deadline) {
      toast({
        title: 'Deadline Required',
        description: 'Please set a response deadline',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      await rfpService.distributeAsRFP(
        policyVersionId,
        {
          workspace_ids: selectedWorkspaces,
          response_deadline: deadline,
          include_auto_scoring: includeAutoScoring,
          custom_message: customMessage || undefined,
        }
      );

      toast({
        title: 'Policy Request Sent',
        description: `Successfully distributed policy "${policyTitle}" to ${selectedWorkspaces.length} partner${selectedWorkspaces.length > 1 ? 's' : ''}`,
      });

      // Reset form and close modal
      setSelectedWorkspaces([]);
      setDeadline('');
      setCustomMessage('');
      onOpenChange(false);
    } catch (err) {
      console.error('Error distributing policy request:', err);
      toast({
        title: 'Distribution Failed',
        description: err instanceof Error ? err.message : 'Failed to distribute policy request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaces(prev =>
      prev.includes(workspaceId)
        ? prev.filter(id => id !== workspaceId)
        : [...prev, workspaceId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Policy Request to Partners</DialogTitle>
          <DialogDescription>
            Distribute "{policyTitle}" as a policy request to your partner agencies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Partner Selection */}
          <div className="space-y-3">
            <Label>Select Partner Agencies</Label>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {loading && workspaces.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No partner agencies found
                </p>
              ) : (
                workspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`workspace-${workspace.id}`}
                      checked={selectedWorkspaces.includes(workspace.id)}
                      onCheckedChange={() => toggleWorkspace(workspace.id)}
                    />
                    <Label
                      htmlFor={`workspace-${workspace.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {workspace.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Response Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Response Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any specific instructions or context for this policy request..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Auto-Scoring Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-scoring"
              checked={includeAutoScoring}
              onCheckedChange={(checked) => setIncludeAutoScoring(checked as boolean)}
            />
            <Label htmlFor="auto-scoring" className="cursor-pointer font-normal">
              Include automated compliance scoring
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleDistribute} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Distribute Policy Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};