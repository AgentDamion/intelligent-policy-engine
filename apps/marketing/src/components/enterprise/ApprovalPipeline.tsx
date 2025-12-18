import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  ArrowRight,
  FileText 
} from 'lucide-react';

interface ApprovalStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignee?: string;
  completedAt?: string;
  feedback?: string;
  estimatedDuration: number; // hours
}

interface ApprovalPipelineProps {
  submissionId: string;
}

export const ApprovalPipeline: React.FC<ApprovalPipelineProps> = ({ submissionId }) => {
  const [stages, setStages] = useState<ApprovalStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovalStages();
  }, [submissionId]);

  const loadApprovalStages = async () => {
    // Mock data for now - would be replaced with actual API call
    const mockStages: ApprovalStage[] = [
      {
        id: '1',
        name: 'Initial Review',
        status: 'completed',
        assignee: 'John Smith',
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        feedback: 'Documentation looks good, proceeding to technical review.',
        estimatedDuration: 4
      },
      {
        id: '2',
        name: 'Technical Validation',
        status: 'in_progress',
        assignee: 'Jane Doe',
        estimatedDuration: 8
      },
      {
        id: '3',
        name: 'Compliance Check',
        status: 'pending',
        estimatedDuration: 6
      },
      {
        id: '4',
        name: 'Final Approval',
        status: 'pending',
        estimatedDuration: 2
      }
    ];

    setStages(mockStages);
    setLoading(false);
  };

  const getStageIcon = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedStages / stages.length) * 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approval Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Approval Pipeline
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {completedStages}/{stages.length} stages completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStageIcon(stage.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{stage.name}</h4>
                    <Badge className={getStageColor(stage.status)}>
                      {stage.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    {stage.assignee && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{stage.assignee}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      Est. duration: {stage.estimatedDuration}h
                      {stage.completedAt && (
                        <span className="ml-2">
                          • Completed {new Date(stage.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {stage.feedback && (
                      <div className="text-sm bg-muted/50 p-2 rounded mt-2">
                        <strong>Feedback:</strong> {stage.feedback}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {index < stages.length - 1 && (
                <div className="flex justify-center mt-2 mb-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};