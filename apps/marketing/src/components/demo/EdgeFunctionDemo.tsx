import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const EdgeFunctionDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [policyVersionId, setPolicyVersionId] = useState('');
  const [workspaceIds, setWorkspaceIds] = useState('');
  const [outcome, setOutcome] = useState<'approved' | 'restricted' | 'rejected'>('approved');
  const [conditions, setConditions] = useState('');
  const [entity, setEntity] = useState<'policy' | 'submission' | 'decision' | 'audit_pack'>('submission');
  const [entityId, setEntityId] = useState('');
  const { toast } = useToast();

  const testComputeScore = async () => {
    if (!submissionId) {
      toast({ title: "Error", description: "Please enter a submission ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('compute_score', {
        body: { 
          submission_id: submissionId, 
          run_mode: 'fast' 
        }
      });

      if (error) throw error;

      toast({
        title: "Score Computed",
        description: `Overall score: ${data.overall}%`
      });
      
      console.log('Score result:', data);
    } catch (error) {
      console.error('Error computing score:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to compute score",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testDistributePolicy = async () => {
    if (!policyVersionId) {
      toast({ title: "Error", description: "Please enter a policy version ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const workspaceArray = workspaceIds ? workspaceIds.split(',').map(id => id.trim()) : [];
      
      const { data, error } = await supabase.functions.invoke('distribute_policy', {
        body: { 
          policy_version_id: policyVersionId,
          workspace_ids: workspaceArray.length > 0 ? workspaceArray : undefined,
          note: 'Test distribution via demo'
        }
      });

      if (error) throw error;

      toast({
        title: "Policy Distributed",
        description: `Created ${data.distributions_created} distributions`
      });
      
      console.log('Distribution result:', data);
    } catch (error) {
      console.error('Error distributing policy:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to distribute policy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testIssueDecision = async () => {
    if (!submissionId) {
      toast({ title: "Error", description: "Please enter a submission ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('issue_decision', {
        body: { 
          submission_id: submissionId,
          outcome,
          conditions: conditions || undefined,
          notify: true
        }
      });

      if (error) throw error;

      toast({
        title: "Decision Issued",
        description: `Decision ${data.outcome} for submission`
      });
      
      console.log('Decision result:', data);
    } catch (error) {
      console.error('Error issuing decision:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to issue decision",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testExportPdf = async () => {
    if (!entityId) {
      toast({ title: "Error", description: "Please enter an entity ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('export_pdf', {
        body: { 
          entity,
          entity_id: entityId
        }
      });

      if (error) throw error;

      toast({
        title: "PDF Generated",
        description: "Check console for download URL"
      });
      
      console.log('Export result:', data);
      
      // Open download URL in new tab
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to export PDF",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testVirusScan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('virus_scan', {
        body: { 
          bucket: 'evidence',
          path: 'test/sample.txt'
        }
      });

      if (error) throw error;

      toast({
        title: "File Scanned",
        description: `Status: ${data.status}`
      });
      
      console.log('Scan result:', data);
    } catch (error) {
      console.error('Error scanning file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to scan file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Compute Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="submissionId">Submission ID</Label>
            <Input
              id="submissionId"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="UUID of submission to score"
            />
          </div>
          <Button onClick={testComputeScore} disabled={loading} className="w-full">
            Test Compute Score
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribute Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="policyVersionId">Policy Version ID</Label>
            <Input
              id="policyVersionId"
              value={policyVersionId}
              onChange={(e) => setPolicyVersionId(e.target.value)}
              placeholder="UUID of policy version"
            />
          </div>
          <div>
            <Label htmlFor="workspaceIds">Workspace IDs (comma-separated)</Label>
            <Input
              id="workspaceIds"
              value={workspaceIds}
              onChange={(e) => setWorkspaceIds(e.target.value)}
              placeholder="uuid1, uuid2, uuid3"
            />
          </div>
          <Button onClick={testDistributePolicy} disabled={loading} className="w-full">
            Test Distribute Policy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="outcome">Outcome</Label>
            <Select value={outcome} onValueChange={(value: 'approved' | 'restricted' | 'rejected') => setOutcome(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="conditions">Conditions (optional)</Label>
            <Textarea
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Any conditions or requirements"
            />
          </div>
          <Button onClick={testIssueDecision} disabled={loading} className="w-full">
            Test Issue Decision
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="entity">Entity Type</Label>
            <Select value={entity} onValueChange={(value: 'policy' | 'submission' | 'decision' | 'audit_pack') => setEntity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="submission">Submission</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="audit_pack">Audit Pack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="entityId">Entity ID</Label>
            <Input
              id="entityId"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="UUID of entity to export"
            />
          </div>
          <Button onClick={testExportPdf} disabled={loading} className="w-full">
            Test Export PDF
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Virus Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tests virus scanning with a mock file path
          </p>
          <Button onClick={testVirusScan} disabled={loading} className="w-full">
            Test Virus Scan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};