/**
 * Policy Submission Form - Connects Lovable UI to Cursor AI processing
 * Allows users to submit policies for AI analysis and compliance checking
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCursorAIIntegration } from '@/hooks/useCursorAIIntegration';
import { monitoring } from '@/utils/monitoring';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  Target
} from 'lucide-react';

interface PolicySubmissionFormProps {
  enterpriseId: string;
  onSubmissionComplete?: (result: any) => void;
}

export const PolicySubmissionForm: React.FC<PolicySubmissionFormProps> = ({
  enterpriseId,
  onSubmissionComplete
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: ''
  });
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  
  const { submitPolicyToCursor, processing, lastResult } = useCursorAIIntegration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      return;
    }

    monitoring.trackUserAction('Policy submission started', {
      title: formData.title,
      contentLength: formData.content.length,
      enterpriseId
    });

    const result = await submitPolicyToCursor({
      document: {
        title: formData.title,
        content: formData.content,
        enterpriseId,
        metadata: {
          description: formData.description,
          submittedAt: new Date().toISOString(),
          submittedBy: 'user' // Would be actual user ID in production
        }
      },
      options: {
        timeoutMs: 30000,
        forceReprocess: true
      }
    });

    setSubmissionResult(result);
    
    if (onSubmissionComplete) {
      onSubmissionComplete(result);
    }

    // Clear form on success
    if (result.success) {
      setFormData({ title: '', content: '', description: '' });
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'approved': return 'text-brand-green';
      case 'rejected': return 'text-destructive';
      case 'needs_review': return 'text-brand-orange';
      default: return 'text-muted-foreground';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'needs_review': return <Clock className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-teal" />
            Submit Policy for AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Policy Title</Label>
              <Input
                id="title"
                placeholder="e.g., AI Tool Usage Guidelines"
                value={formData.title}
                onChange={handleInputChange('title')}
                disabled={processing}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of the policy purpose"
                value={formData.description}
                onChange={handleInputChange('description')}
                disabled={processing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Policy Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your policy document content here..."
                value={formData.content}
                onChange={handleInputChange('content')}
                disabled={processing}
                required
                rows={10}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length} characters • AI will analyze for compliance patterns
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={processing || !formData.title || !formData.content}
              className="w-full"
            >
              {processing ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  Processing with Cursor AI...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Submit for AI Analysis
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-brand-teal animate-pulse" />
                <div>
                  <h3 className="font-medium">AI Processing in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Cursor AI agents are analyzing your policy document...
                  </p>
                </div>
              </div>
              <Progress value={75} className="h-2" />
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="space-y-1">
                  <CheckCircle className="h-4 w-4 mx-auto text-brand-green" />
                  <span>Document Parsed</span>
                </div>
                <div className="space-y-1">
                  <Brain className="h-4 w-4 mx-auto text-brand-teal animate-pulse" />
                  <span>AI Analysis</span>
                </div>
                <div className="space-y-1">
                  <Target className="h-4 w-4 mx-auto text-muted-foreground" />
                  <span>Compliance Check</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {submissionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-teal" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissionResult.success ? (
              <div className="space-y-4">
                {/* Main Outcome */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <div className={getOutcomeColor(submissionResult.data.finalOutcome)}>
                    {getOutcomeIcon(submissionResult.data.finalOutcome)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {submissionResult.data.finalOutcome.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {submissionResult.data.reasoning}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary">
                        Confidence: {Math.round(submissionResult.data.confidence * 100)}%
                      </Badge>
                      <Badge variant="outline" className={
                        submissionResult.data.riskLevel === 'low' ? 'text-brand-green' :
                        submissionResult.data.riskLevel === 'medium' ? 'text-brand-orange' :
                        'text-destructive'
                      }>
                        Risk: {submissionResult.data.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {submissionResult.data.recommendations && submissionResult.data.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">AI Recommendations</h4>
                    <ul className="space-y-2">
                      {submissionResult.data.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Target className="h-4 w-4 text-brand-teal mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Processing Stats */}
                {submissionResult.data.processingStats && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Processing Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Parsing Method:</span>
                        <span className="ml-2">{submissionResult.data.parsedDocument?.parsingMethod || 'AI Agent'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processing Time:</span>
                        <span className="ml-2">{submissionResult.data.processingStats?.duration || '<1s'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <h3 className="font-medium text-destructive">Processing Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {submissionResult.error || 'Unknown error occurred'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};