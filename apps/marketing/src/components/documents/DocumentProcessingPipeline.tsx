import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Cpu, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Eye,
  Download,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  duration?: number;
  result?: any;
  error?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DocumentProcessingPipelineProps {
  stages: ProcessingStage[];
  onStageClick?: (stage: ProcessingStage) => void;
  onRetry?: () => void;
  className?: string;
}

export function DocumentProcessingPipeline({
  stages,
  onStageClick,
  onRetry,
  className
}: DocumentProcessingPipelineProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Update current stage based on processing status
  useEffect(() => {
    const processingIndex = stages.findIndex(s => s.status === 'processing');
    let lastCompletedIndex = -1;
    
    // Find last completed stage (manual implementation for compatibility)
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].status === 'completed') {
        lastCompletedIndex = i;
        break;
      }
    }
    
    if (processingIndex !== -1) {
      setCurrentStageIndex(processingIndex);
    } else if (lastCompletedIndex !== -1) {
      setCurrentStageIndex(Math.min(lastCompletedIndex + 1, stages.length - 1));
    }
  }, [stages]);

  const getStageIcon = (stage: ProcessingStage) => {
    const IconComponent = stage.icon;
    
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStageProgress = () => {
    const completed = stages.filter(s => s.status === 'completed').length;
    const failed = stages.filter(s => s.status === 'failed').length;
    const processing = stages.filter(s => s.status === 'processing').length;
    
    if (failed > 0) {
      return (completed / stages.length) * 100;
    }
    
    if (processing > 0) {
      const processingStage = stages.find(s => s.status === 'processing');
      const baseProgress = (completed / stages.length) * 100;
      const currentProgress = (processingStage?.progress || 0) / stages.length;
      return baseProgress + currentProgress;
    }
    
    return (completed / stages.length) * 100;
  };

  const getStatusBadgeVariant = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      case 'skipped': return 'outline';
      default: return 'outline';
    }
  };

  const isProcessing = stages.some(s => s.status === 'processing');
  const hasErrors = stages.some(s => s.status === 'failed');
  const isComplete = stages.every(s => s.status === 'completed' || s.status === 'skipped');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Processing Pipeline
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasErrors && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
            
            <Badge variant={
              isComplete ? 'default' : 
              hasErrors ? 'destructive' : 
              isProcessing ? 'secondary' : 'outline'
            }>
              {isComplete ? 'Complete' : 
               hasErrors ? 'Failed' : 
               isProcessing ? 'Processing' : 'Ready'}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={getStageProgress()} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Progress: {Math.round(getStageProgress())}%
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-lg border transition-all",
                stage.status === 'processing' && "bg-primary/5 border-primary",
                stage.status === 'completed' && "bg-green-50 border-green-200",
                stage.status === 'failed' && "bg-destructive/5 border-destructive",
                onStageClick && "cursor-pointer hover:bg-muted/50",
                index === currentStageIndex && "ring-2 ring-primary/20"
              )}
              onClick={() => onStageClick?.(stage)}
            >
              {/* Connection Line */}
              {index < stages.length - 1 && (
                <div className={cn(
                  "absolute left-6 top-12 w-0.5 h-8 transition-colors",
                  stage.status === 'completed' ? "bg-green-300" : "bg-border"
                )} />
              )}
              
              {/* Stage Icon */}
              <div className={cn(
                "flex-shrink-0 p-2 rounded-full transition-colors",
                stage.status === 'processing' && "bg-primary/10",
                stage.status === 'completed' && "bg-green-100",
                stage.status === 'failed' && "bg-destructive/10"
              )}>
                {getStageIcon(stage)}
              </div>
              
              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm">{stage.name}</h3>
                  <div className="flex items-center gap-2">
                    {stage.duration && (
                      <span className="text-xs text-muted-foreground">
                        {stage.duration}ms
                      </span>
                    )}
                    <Badge variant={getStatusBadgeVariant(stage.status)} className="text-xs">
                      {stage.status}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {stage.description}
                </p>
                
                {/* Stage Progress */}
                {stage.status === 'processing' && stage.progress !== undefined && (
                  <Progress value={stage.progress} className="h-1 mb-2" />
                )}
                
                {/* Stage Results */}
                {stage.result && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <pre className="whitespace-pre-wrap">
                      {typeof stage.result === 'string' 
                        ? stage.result 
                        : JSON.stringify(stage.result, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Error Messages */}
                {stage.status === 'failed' && stage.error && (
                  <div className="text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/20">
                    {stage.error}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {onStageClick && stage.result && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {/* Summary */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Processing Complete</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              All stages completed successfully. Document is ready for review.
            </p>
          </div>
        )}
        
        {hasErrors && (
          <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Processing Failed</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">
              One or more stages failed. Please review the errors and retry.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default stages configuration
export const defaultProcessingStages: ProcessingStage[] = [
  {
    id: 'validation',
    name: 'Input Validation',
    description: 'Validating document format and structure',
    status: 'pending',
    icon: ShieldCheck,
  },
  {
    id: 'parsing',
    name: 'Document Parsing',
    description: 'Extracting text and metadata from document',
    status: 'pending',
    icon: FileText,
  },
  {
    id: 'analysis',
    name: 'AI Analysis',
    description: 'Analyzing content with AI agents',
    status: 'pending',
    icon: Cpu,
  },
  {
    id: 'compliance',
    name: 'Compliance Check',
    description: 'Validating against compliance rules',
    status: 'pending',
    icon: ShieldCheck,
  },
];