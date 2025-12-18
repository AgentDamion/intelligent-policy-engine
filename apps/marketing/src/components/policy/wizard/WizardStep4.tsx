/**
 * Wizard Step 4: Enhanced Approval Pipeline
 * Enterprise-grade approval workflow with collaboration features
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ApprovalPipeline } from '@/components/collaboration/ApprovalPipeline';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  FileText, 
  Brain, 
  Shield, 
  Target,
  Send,
  Download,
  Copy,
  Clock,
  User,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface WizardStep4Props {
  wizardState: {
    documentData: {
      title: string;
      description: string;
      content: string;
      uploadedFiles: File[];
      inputMethod: 'upload' | 'paste' | 'template';
    };
    analysisResult: any;
    validatedData: {
      toolName: string;
      vendor: string;
      approvalStatus: string;
      riskLevel: string;
      useCases: string[];
      restrictions: string[];
      confidence: Record<string, number>;
    };
    submissionResult: any;
  };
  enterpriseId: string;
  onComplete: (result: any) => void;
}

export const WizardStep4: React.FC<WizardStep4Props> = ({
  wizardState,
  enterpriseId,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [showApprovalPipeline, setShowApprovalPipeline] = useState(false);
  const { toast } = useToast();

  // Create initial approval workflow when component loads
  useEffect(() => {
    const initializeApprovalWorkflow = async () => {
      if (!wizardState.submissionResult && !workflowId) {
        try {
          const documentId = `policy-${Date.now()}`;
          
          // Get intelligent stage assignments based on policy content
          const { data: assignments, error: assignError } = await supabase
            .rpc('assign_reviewers_by_expertise', {
              policy_content: wizardState.documentData.content,
              enterprise_id_param: enterpriseId,
              workflow_type: 'standard'
            });

          if (assignError) {
            console.warn('Failed to get intelligent assignments:', assignError);
          }

          const intelligentStages = (assignments as any)?.stages || [
            {
              name: 'Initial Review',
              assignees: ['system'],
              estimatedDuration: 24,
              status: 'pending',
              required_approvals: 1
            },
            {
              name: 'Technical Validation', 
              assignees: ['system'],
              estimatedDuration: 48,
              status: 'pending',
              required_approvals: 1
            },
            {
              name: 'Compliance Check',
              assignees: ['system'],
              estimatedDuration: 72,
              status: 'pending',
              required_approvals: 1
            },
            {
              name: 'Final Approval',
              assignees: ['system'],
              estimatedDuration: 24,
              status: 'pending',
              required_approvals: 1
            }
          ];

          const workflowData = {
            document_id: documentId,
            document_type: 'policy',
            enterprise_id: enterpriseId,
            workflow_name: `${wizardState.documentData.title} - Approval Pipeline`,
            current_stage: intelligentStages[0].name,
            stages: intelligentStages,
            assignees: intelligentStages[0].assignees,
            progress_percentage: 0,
            priority_level: wizardState.validatedData.riskLevel === 'high' ? 'urgent' : 'normal',
            sla_hours: wizardState.validatedData.riskLevel === 'high' ? 24 : 48,
            auto_assignment_rules: assignments || {},
            escalation_rules: {
              auto_escalate_hours: wizardState.validatedData.riskLevel === 'high' ? 12 : 24,
              escalation_roles: ['owner', 'admin']
            }
          };

          const { data: workflow, error } = await supabase
            .from('approval_workflows')
            .insert(workflowData)
            .select()
            .single();

          if (error) throw error;

          setWorkflowId(workflow.id);
          setShowApprovalPipeline(true);

          // Log workflow creation
          await supabase.from('audit_events').insert({
            event_type: 'approval_workflow_created',
            entity_type: 'approval_workflow',
            entity_id: workflow.id,
            enterprise_id: enterpriseId,
            details: {
              policy_title: wizardState.documentData.title,
              risk_level: wizardState.validatedData.riskLevel,
              total_stages: intelligentStages.length,
              priority: workflowData.priority_level
            }
          });

          toast({
            title: "Approval Workflow Created",
            description: `Enterprise approval pipeline initiated with ${intelligentStages.length} stages.`,
          });

        } catch (error) {
          console.error('Failed to create approval workflow:', error);
          toast({
            title: "Workflow Setup Error",
            description: "Could not initialize approval pipeline. You can still submit manually.",
            variant: "destructive"
          });
        }
      }
    };

    initializeApprovalWorkflow();
  }, [wizardState, enterpriseId, workflowId]);

  const handleFinalSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      // If we have an approval workflow, advance it to completion
      if (workflowId) {
        const { error: workflowError } = await supabase
          .from('approval_workflows')
          .update({
            current_stage: 'Final Approval',
            progress_percentage: 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflowId);

        if (workflowError) {
          console.warn('Failed to update workflow:', workflowError);
        }
      }

      const submissionResult = {
        id: workflowId || `policy-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'submitted',
        data: {
          ...wizardState.documentData,
          ...wizardState.validatedData,
          analysisResult: wizardState.analysisResult,
          enterpriseId,
          workflowId
        }
      };

      // Log final submission
      await supabase.from('audit_events').insert({
        event_type: 'policy_submitted',
        entity_type: 'policy',
        entity_id: submissionResult.id,
        enterprise_id: enterpriseId,
        details: {
          policy_title: wizardState.documentData.title,
          approval_status: wizardState.validatedData.approvalStatus,
          risk_level: wizardState.validatedData.riskLevel,
          workflow_id: workflowId,
          submission_method: 'wizard_completion'
        }
      });

      onComplete(submissionResult);

      toast({
        title: "Policy Successfully Submitted",
        description: "Your AI policy has been processed and submitted through the approval pipeline.",
      });

    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your policy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReport = () => {
    const report = generateComplianceReport();
    downloadFile(report, `${wizardState.documentData.title}-compliance-report.json`);
    
    toast({
      title: "Report Downloaded",
      description: "Compliance report has been downloaded to your device.",
    });
  };

  const handleCopyData = async () => {
    const structuredData = JSON.stringify(wizardState.validatedData, null, 2);
    await navigator.clipboard.writeText(structuredData);
    
    toast({
      title: "Data Copied",
      description: "Structured policy data has been copied to clipboard.",
    });
  };

  const generateComplianceReport = () => {
    return {
      policyTitle: wizardState.documentData.title,
      analysisDate: new Date().toISOString(),
      aiAnalysisResult: wizardState.analysisResult,
      extractedData: wizardState.validatedData,
      complianceStatus: wizardState.validatedData.approvalStatus,
      riskAssessment: wizardState.validatedData.riskLevel,
      enterpriseId,
      processingMethod: 'AI-Assisted Analysis',
      confidenceScores: wizardState.validatedData.confidence,
    };
  };

  const downloadFile = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const overallConfidence = Object.values(wizardState.validatedData.confidence)
    .reduce((a, b) => a + b, 0) / Object.values(wizardState.validatedData.confidence).length;

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-brand-green bg-brand-green/10';
      case 'medium': return 'text-brand-orange bg-brand-orange/10';
      case 'high': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-brand-green bg-brand-green/10';
      case 'denied': return 'text-destructive bg-destructive/10';
      case 'pending': return 'text-brand-orange bg-brand-orange/10';
      case 'conditional': return 'text-brand-blue bg-brand-blue/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-brand-green" />
            Review & Submit Policy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review the complete analysis and submit your AI policy to the compliance system
          </p>
        </CardHeader>
      </Card>

      {/* Document Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-teal" />
            Document Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Title:</span>
              <p className="font-medium">{wizardState.documentData.title}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Input Method:</span>
              <Badge variant="outline" className="ml-2 capitalize">
                {wizardState.documentData.inputMethod}
              </Badge>
            </div>
          </div>
          
          {wizardState.documentData.description && (
            <div>
              <span className="text-sm text-muted-foreground">Description:</span>
              <p className="text-sm mt-1">{wizardState.documentData.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-teal">
                {wizardState.documentData.content.length}
              </p>
              <p className="text-xs text-muted-foreground">Characters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-purple">
                {Math.round(overallConfidence * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">AI Confidence</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-green">
                {wizardState.validatedData.useCases.length + wizardState.validatedData.restrictions.length}
              </p>
              <p className="text-xs text-muted-foreground">Rules Extracted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-brand-purple" />
            AI Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">AI Tool</Label>
              <p className="font-medium">{wizardState.validatedData.toolName || 'Not specified'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Vendor</Label>
              <p className="font-medium">{wizardState.validatedData.vendor || 'Not specified'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Badge className={getStatusColor(wizardState.validatedData.approvalStatus)}>
                {wizardState.validatedData.approvalStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Risk Level</Label>
              <Badge className={getRiskColor(wizardState.validatedData.riskLevel)}>
                {wizardState.validatedData.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Rules */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-green" />
              Approved Use Cases ({wizardState.validatedData.useCases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wizardState.validatedData.useCases.length > 0 ? (
              <ul className="space-y-2">
                {wizardState.validatedData.useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-brand-green mt-0.5 flex-shrink-0" />
                    {useCase}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No use cases extracted</p>
            )}
          </CardContent>
        </Card>

        {/* Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              Restrictions ({wizardState.validatedData.restrictions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wizardState.validatedData.restrictions.length > 0 ? (
              <ul className="space-y-2">
                {wizardState.validatedData.restrictions.map((restriction, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Shield className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    {restriction}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No restrictions extracted</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processing Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Processed</p>
                <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Method</p>
                <p className="text-muted-foreground">AI-Assisted Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Enterprise</p>
                <p className="text-muted-foreground">{enterpriseId.substring(0, 8)}...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Approval Pipeline */}
      {showApprovalPipeline && workflowId && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Enterprise Approval Pipeline
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track your policy through enterprise-grade approval workflow with intelligent assignment and bottleneck detection
            </p>
          </CardHeader>
          <CardContent>
            <ApprovalPipeline
              documentId={workflowId}
              documentType="policy"
              enterpriseId={enterpriseId}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!showApprovalPipeline ? (
          <Button
            onClick={() => setShowApprovalPipeline(true)}
            variant="outline"
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Start Approval Workflow
          </Button>
        ) : (
          <Button
            onClick={handleFinalSubmission}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Finalizing Submission...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Complete Approval & Submit
              </>
            )}
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyData}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Data
          </Button>
        </div>
      </div>

      {/* Submission Success */}
      {wizardState.submissionResult && (
        <Card className="border-brand-green">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-brand-green">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Successfully Submitted</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Policy ID: {wizardState.submissionResult.id}
            </p>
            <p className="text-sm text-muted-foreground">
              Submitted: {new Date(wizardState.submissionResult.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};