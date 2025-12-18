import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Eye,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProcessingJob {
  id: string;
  documentName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStage: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
  results?: any;
  estimatedCompletion?: Date;
}

interface ProcessingStatusTrackerProps {
  jobs: ProcessingJob[];
  onViewResults?: (job: ProcessingJob) => void;
  onDownloadResults?: (job: ProcessingJob) => void;
  onRetry?: (job: ProcessingJob) => void;
  onCancel?: (job: ProcessingJob) => void;
  className?: string;
}

export function ProcessingStatusTracker({
  jobs,
  onViewResults,
  onDownloadResults,
  onRetry,
  onCancel,
  className
}: ProcessingStatusTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live duration updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      case 'queued': return 'outline';
      case 'cancelled': return 'outline';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || currentTime;
    const durationMs = end.getTime() - startTime.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatEstimatedCompletion = (estimatedCompletion: Date) => {
    const now = new Date();
    const diff = estimatedCompletion.getTime() - now.getTime();
    
    if (diff <= 0) return 'Any moment';
    
    const minutes = Math.ceil(diff / 60000);
    if (minutes < 60) return `~${minutes}m`;
    
    const hours = Math.ceil(minutes / 60);
    return `~${hours}h`;
  };

  const activeJobs = jobs.filter(j => j.status === 'processing' || j.status === 'queued');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed' || j.status === 'cancelled');

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Processing Jobs</h3>
          <p className="text-muted-foreground">
            Upload documents to start processing them through the pipeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Processing Status
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeJobs.length} Active
            </Badge>
            <Badge variant="default" className="text-xs">
              {completedJobs.length} Complete
            </Badge>
            {failedJobs.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {failedJobs.length} Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                "p-4 border rounded-lg space-y-3 transition-all",
                job.status === 'processing' && "bg-blue-50 border-blue-200",
                job.status === 'completed' && "bg-green-50 border-green-200",
                job.status === 'failed' && "bg-destructive/5 border-destructive/20"
              )}
            >
              {/* Job Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h3 className="font-medium text-sm">{job.documentName}</h3>
                    <p className="text-xs text-muted-foreground">
                      ID: {job.id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(job.status)} className="text-xs">
                    {job.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(job.startTime, job.endTime)}
                  </span>
                </div>
              </div>

              {/* Current Stage & Progress */}
              {(job.status === 'processing' || job.status === 'queued') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {job.status === 'queued' ? 'Queued for processing' : job.currentStage}
                    </span>
                    {job.estimatedCompletion && (
                      <span className="text-xs text-muted-foreground">
                        ETA: {formatEstimatedCompletion(job.estimatedCompletion)}
                      </span>
                    )}
                  </div>
                  
                  {job.status === 'processing' && (
                    <Progress value={job.progress} className="h-2" />
                  )}
                </div>
              )}

              {/* Error Message */}
              {job.status === 'failed' && job.error && (
                <div className="text-sm text-destructive bg-destructive/5 p-2 rounded border border-destructive/20">
                  {job.error}
                </div>
              )}

              {/* Results Summary */}
              {job.status === 'completed' && job.results && (
                <div className="text-sm bg-green-50 p-2 rounded border border-green-200">
                  <div className="text-green-700 font-medium mb-1">Processing Complete</div>
                  <div className="text-green-600 text-xs">
                    Confidence: {((job.results.confidence || 0) * 100).toFixed(1)}% • 
                    Outcome: {job.results.outcome || 'Unknown'}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {job.status === 'completed' && onViewResults && (
                  <Button variant="outline" size="sm" onClick={() => onViewResults(job)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View Results
                  </Button>
                )}
                
                {job.status === 'completed' && onDownloadResults && (
                  <Button variant="outline" size="sm" onClick={() => onDownloadResults(job)}>
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
                
                {job.status === 'failed' && onRetry && (
                  <Button variant="outline" size="sm" onClick={() => onRetry(job)}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                
                {(job.status === 'processing' || job.status === 'queued') && onCancel && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onCancel(job)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}