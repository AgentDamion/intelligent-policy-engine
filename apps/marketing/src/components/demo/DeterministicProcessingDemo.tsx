/**
 * Demo Integration Component
 * Shows the deterministic processing pipeline in action
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { PolicyProcessingAPI } from '@/api/policy-processing';
import { SLOMonitor } from '@/services/monitoring/slo-monitor';
import { CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';

interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  result?: any;
}

export function DeterministicProcessingDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentContent, setDocumentContent] = useState(
    'This is a sample policy document for testing the deterministic processing pipeline. It contains standard compliance language and procedures for data handling, security protocols, and regulatory requirements.'
  );
  const [stages, setStages] = useState<ProcessingStage[]>([
    { name: 'Input Validation', status: 'pending' },
    { name: 'Document Processing', status: 'pending' },
    { name: 'AI Agent Analysis', status: 'pending' },
    { name: 'Rule Engine Validation', status: 'pending' },
    { name: 'Audit Trail Creation', status: 'pending' },
  ]);
  const [result, setResult] = useState<any>(null);
  const [sloMetrics, setSloMetrics] = useState<any>(null);

  const updateStage = (index: number, updates: Partial<ProcessingStage>) => {
    setStages(prev => prev.map((stage, i) => 
      i === index ? { ...stage, ...updates } : stage
    ));
  };

  const processDocument = async () => {
    setIsProcessing(true);
    setResult(null);
    setSloMetrics(null);
    
    // Reset all stages
    setStages(prev => prev.map(stage => ({ ...stage, status: 'pending' as const })));

    try {
      const startTime = Date.now();
      
      // Stage 1: Input Validation
      updateStage(0, { status: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const document = {
        id: `demo-${Date.now()}`,
        enterpriseId: '550e8400-e29b-41d4-a716-446655440001', // Sample enterprise ID
        title: 'Demo Policy Document',
        content: documentContent,
        mimeType: 'text/plain' as const,
        checksumSha256: Array(64).fill('a').join(''), // Sample checksum
        hasPHI: false,
      };

      // Validate document
      const validation = PolicyProcessingAPI.validateDocument(document);
      if (!validation.success) {
        updateStage(0, { status: 'failed', result: validation });
        SLOMonitor.recordSchemaValidation(false, 'PolicyDocument', validation);
        return;
      }
      
      updateStage(0, { 
        status: 'completed', 
        duration: 500,
        result: { valid: true, message: 'Document schema validation passed' }
      });
      SLOMonitor.recordSchemaValidation(true, 'PolicyDocument');

      // Stage 2: Document Processing
      updateStage(1, { status: 'processing' });
      const processingStart = Date.now();
      
      // Simulate processing stages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStage(1, { 
        status: 'completed', 
        duration: Date.now() - processingStart,
        result: { 
          method: 'ai-agent',
          confidence: 0.92,
          extractedText: documentContent,
          pages: 1,
          tablesFound: 0
        }
      });
      SLOMonitor.recordParsingAttempt(true, 'ai-agent');

      // Stage 3: AI Agent Analysis
      updateStage(2, { status: 'processing' });
      const agentStart = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const agentResult = {
        decision: 'APPROVED',
        confidence: 0.88,
        riskLevel: 'LOW',
        rationale: 'Document meets compliance standards and contains appropriate policy language'
      };
      
      updateStage(2, { 
        status: 'completed', 
        duration: Date.now() - agentStart,
        result: agentResult
      });

      // Stage 4: Rule Engine Validation
      updateStage(3, { status: 'processing' });
      const ruleStart = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const validationResult = {
        finalOutcome: 'APPROVED',
        finalConfidence: 0.89,
        ruleResults: [
          { rule: 'CONTENT_LENGTH_CHECK', outcome: 'STRICT_PASS', message: 'Document length is appropriate' },
          { rule: 'LANGUAGE_COMPLIANCE', outcome: 'STRICT_PASS', message: 'No prohibited language detected' },
          { rule: 'STRUCTURE_VALIDATION', outcome: 'STRICT_PASS', message: 'Document structure is valid' }
        ]
      };
      
      updateStage(3, { 
        status: 'completed', 
        duration: Date.now() - ruleStart,
        result: validationResult
      });
      SLOMonitor.recordRuleEngineEvaluation(true, 3);

      // Stage 5: Audit Trail Creation
      updateStage(4, { status: 'processing' });
      const auditStart = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const auditResult = {
        traceId: `trace-${Date.now()}`,
        created: true,
        message: 'Complete audit trail recorded'
      };
      
      updateStage(4, { 
        status: 'completed', 
        duration: Date.now() - auditStart,
        result: auditResult
      });

      // Set final result
      const totalTime = Date.now() - startTime;
      setResult({
        success: true,
        finalOutcome: validationResult.finalOutcome,
        confidence: validationResult.finalConfidence,
        processingTime: totalTime,
        traceId: auditResult.traceId,
      });

      // Get SLO metrics
      const metrics = SLOMonitor.calculateMetrics(1); // Last hour
      setSloMetrics(metrics);

    } catch (error) {
      console.error('Processing failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStageIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStageProgress = () => {
    const completed = stages.filter(s => s.status === 'completed').length;
    return (completed / stages.length) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deterministic Processing Pipeline Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Document Content
            </label>
            <Textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Enter policy document content..."
              rows={4}
              disabled={isProcessing}
            />
          </div>

          <div className="flex justify-between items-center">
            <Button 
              onClick={processDocument} 
              disabled={isProcessing || !documentContent.trim()}
            >
              {isProcessing ? 'Processing...' : 'Process Document'}
            </Button>
            
            {isProcessing && (
              <div className="text-sm text-muted-foreground">
                Progress: {Math.round(getStageProgress())}%
              </div>
            )}
          </div>

          {isProcessing && (
            <Progress value={getStageProgress()} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Processing Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStageIcon(stage.status)}
                  <span className="font-medium">{stage.name}</span>
                  <Badge variant={
                    stage.status === 'completed' ? 'default' :
                    stage.status === 'failed' ? 'destructive' :
                    stage.status === 'processing' ? 'secondary' : 'outline'
                  }>
                    {stage.status}
                  </Badge>
                </div>
                
                {stage.duration && (
                  <span className="text-sm text-muted-foreground">
                    {stage.duration}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              
              {result.success ? (
                <>
                  <div><span className="font-medium">Outcome:</span> {result.finalOutcome}</div>
                  <div><span className="font-medium">Confidence:</span> {(result.confidence * 100).toFixed(1)}%</div>
                  <div><span className="font-medium">Processing Time:</span> {result.processingTime}ms</div>
                  <div><span className="font-medium">Trace ID:</span> {result.traceId}</div>
                </>
              ) : (
                <div className="text-red-600">Error: {result.error}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLO Metrics */}
      {sloMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>SLO Metrics (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(sloMetrics.parsingSuccessRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Parsing Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(sloMetrics.schemaValidationPassRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Schema Validation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(sloMetrics.ruleEngineStrictPassRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Rule Engine Pass</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(sloMetrics.humanReviewRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Human Review Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}