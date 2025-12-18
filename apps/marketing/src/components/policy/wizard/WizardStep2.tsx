/**
 * Wizard Step 2: AI Analysis with Real-time Progress
 * Shows Cursor AI processing with detailed progress tracking
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCursorAIIntegration } from '@/hooks/useCursorAIIntegration';
import { 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  FileSearch,
  Sparkles,
  Activity
} from 'lucide-react';

interface WizardStep2Props {
  documentData: {
    title: string;
    description: string;
    content: string;
    uploadedFiles: File[];
    inputMethod: 'upload' | 'paste' | 'template';
  };
  enterpriseId: string;
  onAnalysisComplete: (result: any) => void;
}

// Processing stages for visual feedback
const PROCESSING_STAGES = [
  {
    id: 'parsing',
    name: 'Document Parsing',
    description: 'Extracting and structuring document content',
    icon: FileSearch,
    duration: 2000,
  },
  {
    id: 'analysis',
    name: 'AI Analysis',
    description: 'Cursor AI agents analyzing policy content',
    icon: Brain,
    duration: 3000,
  },
  {
    id: 'extraction',
    name: 'Data Extraction',
    description: 'Identifying key policy elements and metadata',
    icon: Target,
    duration: 2000,
  },
  {
    id: 'validation',
    name: 'Compliance Validation',
    description: 'Checking against regulatory requirements',
    icon: CheckCircle,
    duration: 1500,
  },
];

export const WizardStep2: React.FC<WizardStep2Props> = ({
  documentData,
  enterpriseId,
  onAnalysisComplete
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const { submitPolicyToCursor, processing, lastResult } = useCursorAIIntegration();

  // Auto-start analysis when component mounts
  useEffect(() => {
    if (!hasStarted && documentData.content) {
      startAnalysis();
    }
  }, [documentData.content, hasStarted]);

  // Handle analysis results
  useEffect(() => {
    if (lastResult && !isComplete) {
      setIsComplete(true);
      onAnalysisComplete(lastResult);
    }
  }, [lastResult, isComplete, onAnalysisComplete]);

  const startAnalysis = async () => {
    setHasStarted(true);
    
    // Simulate progressive stages for better UX
    for (let i = 0; i < PROCESSING_STAGES.length; i++) {
      setCurrentStage(i);
      setStageProgress(0);
      
      // Animate progress for current stage
      const stage = PROCESSING_STAGES[i];
      const progressInterval = setInterval(() => {
        setStageProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + (100 / (stage.duration / 100));
        });
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      setStageProgress(100);
    }

    // Start actual AI processing
    try {
      await submitPolicyToCursor({
        document: {
          title: documentData.title,
          content: documentData.content,
          enterpriseId,
          metadata: {
            description: documentData.description,
            inputMethod: documentData.inputMethod,
            submittedAt: new Date().toISOString(),
          }
        },
        options: {
          timeoutMs: 30000,
          forceReprocess: true
        }
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const retryAnalysis = () => {
    setCurrentStage(0);
    setStageProgress(0);
    setHasStarted(false);
    setIsComplete(false);
  };

  const overallProgress = isComplete ? 100 : 
    ((currentStage * 100) + stageProgress) / PROCESSING_STAGES.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-brand-teal" />
            AI Analysis in Progress
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cursor AI is analyzing your policy document for compliance patterns and key information
          </p>
        </CardHeader>
      </Card>

      {/* Document Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analyzing Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Title:</span>
            <span className="text-sm font-medium">{documentData.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Content Length:</span>
            <span className="text-sm font-medium">{documentData.content.length} characters</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Input Method:</span>
            <Badge variant="outline" className="capitalize">
              {documentData.inputMethod}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Processing Progress</h3>
              <span className="text-sm text-muted-foreground">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Stage Details */}
          <div className="space-y-4">
            {PROCESSING_STAGES.map((stage, index) => {
              const isCurrentStage = index === currentStage && !isComplete;
              const isCompleted = index < currentStage || isComplete;
              const isPending = index > currentStage && !isComplete;

              return (
                <div 
                  key={stage.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                    isCurrentStage ? 'bg-brand-teal/5 border border-brand-teal/20' :
                    isCompleted ? 'bg-brand-green/5' :
                    'bg-muted/30'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    isCurrentStage ? 'bg-brand-teal text-white animate-pulse' :
                    isCompleted ? 'bg-brand-green text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <stage.icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{stage.name}</h4>
                      {isCurrentStage && (
                        <Badge className="bg-brand-teal animate-pulse">
                          Processing...
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-brand-green">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                    
                    {isCurrentStage && (
                      <Progress value={stageProgress} className="h-1 mt-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Processing Activity */}
          {processing && (
            <Card className="border-brand-teal/20 bg-brand-teal/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-brand-teal animate-pulse" />
                  <div>
                    <h4 className="font-medium text-brand-teal">Cursor AI Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI agents are now analyzing your policy document...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Preview */}
          {lastResult && isComplete && (
            <Card className="border-brand-green">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-green">
                  <Sparkles className="h-5 w-5" />
                  Analysis Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green" />
                      <div>
                        <h4 className="font-medium">
                          Analysis Result: {lastResult.data?.finalOutcome?.toUpperCase() || 'PROCESSED'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {lastResult.data?.reasoning || 'Policy successfully analyzed'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <Badge variant="secondary">
                        Confidence: {Math.round((lastResult.data?.confidence || 0.8) * 100)}%
                      </Badge>
                      <Badge variant="outline" className={
                        lastResult.data?.riskLevel === 'low' ? 'text-brand-green' :
                        lastResult.data?.riskLevel === 'medium' ? 'text-brand-orange' :
                        'text-destructive'
                      }>
                        Risk: {lastResult.data?.riskLevel || 'Low'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <h4 className="font-medium text-destructive">Analysis Failed</h4>
                      <p className="text-sm text-muted-foreground">
                        {lastResult.error || 'Unknown error occurred'}
                      </p>
                    </div>
                  </div>
                )}

                {!lastResult.success && (
                  <Button 
                    onClick={retryAnalysis}
                    variant="outline"
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Retry Analysis
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-purple" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• AI extracts key policy elements (tool names, vendors, restrictions)</p>
          <p>• Compliance requirements are automatically identified</p>
          <p>• Risk assessment is performed based on content analysis</p>
          <p>• You'll review and validate the extracted information in the next step</p>
        </CardContent>
      </Card>
    </div>
  );
};