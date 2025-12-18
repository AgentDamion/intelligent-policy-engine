import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RFPDistribution {
  id: string;
  created_at: string;
  details: {
    workspace_count: number;
    rfp_metadata: any;
  };
}

interface RFPResponse {
  id: string;
  submitted_at: string;
  compliance_score: number;
  workspace: { name: string };
}

export function GovernanceEvidenceCenter() {
  const [distributions, setDistributions] = useState<RFPDistribution[]>([]);
  const [responses, setResponses] = useState<RFPResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    try {
      // Load RFP distributions
      const { data: distData } = await supabase
        .from('audit_events')
        .select('*')
        .eq('event_type', 'RFP_DISTRIBUTED')
        .order('created_at', { ascending: false })
        .limit(10);

      setDistributions((distData || []) as any);

      // Load RFP responses
      const { data: respData } = await supabase
        .from('submissions')
        .select(`
          id,
          submitted_at,
          compliance_score,
          workspaces:workspace_id (name)
        `)
        .eq('submission_type', 'rfp_response')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(10);

      setResponses(respData as any || []);
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportEvidence = async () => {
    setExporting(true);
    try {
      // Get enterprise context
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      const { data: enterpriseMember } = await supabase
        .from('enterprise_members')
        .select('enterprise_id')
        .eq('user_id', profile?.id)
        .single();

      if (!enterpriseMember) {
        throw new Error('No enterprise context found');
      }

      // Call export function
      const { data, error } = await supabase.functions.invoke('export-governance-evidence', {
        body: {
          enterprise_id: enterpriseMember.enterprise_id,
          start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        }
      });

      if (error) throw error;

      toast({
        title: "Evidence Package Generated",
        description: `Export includes ${data.summary.distributions} distributions and ${data.summary.responses} responses`,
      });

      // Trigger download
      if (data.export_url) {
        window.open(data.export_url, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const avgScore = responses.length > 0
    ? responses.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / responses.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            Governance Evidence Center
          </h2>
          <p className="text-muted-foreground mt-1">
            Complete audit trail for regulatory compliance and policy operationalization
          </p>
        </div>
        <Button
          onClick={handleExportEvidence}
          disabled={exporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Generating...' : 'Export Evidence Package'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{distributions.length}</div>
              <div className="text-xs text-muted-foreground">RFP Distributions</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-secondary/20 bg-secondary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{responses.length}</div>
              <div className="text-xs text-muted-foreground">Partner Responses</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-brand-green/20 bg-brand-green/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-green/10">
              <CheckCircle className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-green">{avgScore.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Avg Compliance</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-brand-teal/20 bg-brand-teal/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-teal/10">
              <Calendar className="h-5 w-5 text-brand-teal" />
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-teal">
                {distributions.length + responses.length}
              </div>
              <div className="text-xs text-muted-foreground">Audit Events</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          RFP Distribution Timeline
        </h3>
        <div className="space-y-3">
          {distributions.slice(0, 5).map((dist) => (
            <div
              key={dist.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="text-sm font-medium">
                    Policy Operationalized as RFP
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(dist.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                {dist.details?.workspace_count || 0} partners
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Response Compliance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-brand-green" />
          Partner Compliance Responses
        </h3>
        <div className="space-y-3">
          {responses.slice(0, 5).map((resp) => (
            <div
              key={resp.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${
                  resp.compliance_score >= 80 ? 'bg-brand-green' : 
                  resp.compliance_score >= 60 ? 'bg-brand-orange' : 'bg-destructive'
                }`} />
                <div>
                  <div className="text-sm font-medium">{resp.workspace?.name || 'Partner'}</div>
                  <div className="text-xs text-muted-foreground">
                    Submitted {format(new Date(resp.submitted_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={resp.compliance_score >= 80 ? 'default' : 'secondary'}
                  className={
                    resp.compliance_score >= 80 ? 'bg-brand-green text-white' :
                    resp.compliance_score >= 60 ? 'bg-brand-orange text-white' : 'bg-destructive text-white'
                  }
                >
                  {resp.compliance_score}% Compliant
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
