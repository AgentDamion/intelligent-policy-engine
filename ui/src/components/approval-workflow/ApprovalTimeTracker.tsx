import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Badge } from '@/components/ui';
import { 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Target,
  Timer,
  Activity,
  Users,
  FileText
} from 'lucide-react';

interface ApprovalMetrics {
  currentTime: number; // in hours
  targetTime: number; // in hours (4 days = 96 hours)
  traditionalTime: number; // in hours (47 days = 1128 hours)
  accelerationFactor: number;
  timeSaved: number; // in hours
  stages: ApprovalStage[];
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

interface ApprovalStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in hours
  expectedDuration: number; // in hours
  assignee?: string;
  description: string;
}

interface ApprovalTimeTrackerProps {
  submissionId: string;
  onTimeUpdate?: (metrics: ApprovalMetrics) => void;
  className?: string;
}

export function ApprovalTimeTracker({ 
  submissionId, 
  onTimeUpdate,
  className = '' 
}: ApprovalTimeTrackerProps) {
  const [metrics, setMetrics] = useState<ApprovalMetrics>({
    currentTime: 0,
    targetTime: 96, // 4 days
    traditionalTime: 1128, // 47 days
    accelerationFactor: 0,
    timeSaved: 0,
    status: 'on_track',
    stages: [
      {
        id: 'submission',
        name: 'Initial Submission',
        status: 'completed',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        duration: 0.5,
        expectedDuration: 2,
        assignee: 'System',
        description: 'Document uploaded and validated'
      },
      {
        id: 'ai_analysis',
        name: 'AI Agent Analysis',
        status: 'in_progress',
        startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        expectedDuration: 4,
        assignee: 'AI Agent',
        description: 'Context, Policy, and Risk agents processing'
      },
      {
        id: 'compliance_check',
        name: 'Compliance Validation',
        status: 'pending',
        expectedDuration: 8,
        assignee: 'Compliance Officer',
        description: 'Regulatory compliance verification'
      },
      {
        id: 'stakeholder_review',
        name: 'Stakeholder Review',
        status: 'pending',
        expectedDuration: 12,
        assignee: 'Legal Team',
        description: 'Legal and business stakeholder approval'
      },
      {
        id: 'final_approval',
        name: 'Final Approval',
        status: 'pending',
        expectedDuration: 2,
        assignee: 'CISO',
        description: 'Final security and governance approval'
      }
    ]
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const now = new Date();
        const submissionTime = prev.stages[0].startTime!;
        const currentTime = (now.getTime() - submissionTime.getTime()) / (1000 * 60 * 60); // hours
        
        const accelerationFactor = prev.traditionalTime / prev.targetTime;
        const timeSaved = prev.traditionalTime - currentTime;
        
        let status: ApprovalMetrics['status'] = 'on_track';
        if (currentTime > prev.targetTime) {
          status = 'delayed';
        } else if (currentTime > prev.targetTime * 0.8) {
          status = 'at_risk';
        }
        
        const updated = {
          ...prev,
          currentTime,
          accelerationFactor,
          timeSaved,
          status
        };
        
        onTimeUpdate?.(updated);
        return updated;
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  const getStatusColor = (status: ApprovalMetrics['status']) => {
    switch (status) {
      case 'on_track':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'delayed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'completed':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStageStatusIcon = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStageStatusColor = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'blocked':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  const progressPercentage = Math.min((metrics.currentTime / metrics.targetTime) * 100, 100);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(metrics.currentTime)}
              </p>
            </div>
            <Timer className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Target Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(metrics.targetTime)}
              </p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(metrics.timeSaved)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acceleration</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(metrics.accelerationFactor)}x
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Status and Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Approval Progress</h3>
          <Badge className={getStatusColor(metrics.status)}>
            {metrics.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress to Target</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Time Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Traditional Process</p>
              <p className="text-lg font-bold text-gray-900">
                {formatTime(metrics.traditionalTime)}
              </p>
              <p className="text-xs text-gray-500">47 days average</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">AIComply Process</p>
              <p className="text-lg font-bold text-blue-900">
                {formatTime(metrics.currentTime)} / {formatTime(metrics.targetTime)}
              </p>
              <p className="text-xs text-blue-500">4 days target</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Stages */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Stages</h3>
        <div className="space-y-3">
          {metrics.stages.map((stage, index) => (
            <div key={stage.id} className={`p-4 rounded-lg border ${getStageStatusColor(stage.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStageStatusIcon(stage.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {stage.name}
                      </h4>
                      {stage.assignee && (
                        <span className="text-xs text-gray-500">
                          • {stage.assignee}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {stage.description}
                    </p>
                    
                    {/* Stage Timing */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Expected: {formatTime(stage.expectedDuration)}</span>
                      {stage.duration && (
                        <span>Actual: {formatTime(stage.duration)}</span>
                      )}
                      {stage.startTime && (
                        <span>
                          Started: {stage.startTime.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stage Progress */}
                {stage.status === 'in_progress' && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Progress</div>
                    <Progress value={75} className="h-2 w-20" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Acceleration Metrics */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">Acceleration Impact</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {Math.round(metrics.accelerationFactor)}x
            </div>
            <p className="text-sm text-gray-600">Faster Processing</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {Math.round((metrics.timeSaved / metrics.traditionalTime) * 100)}%
            </div>
            <p className="text-sm text-gray-600">Time Reduction</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatTime(metrics.timeSaved)}
            </div>
            <p className="text-sm text-gray-600">Time Saved</p>
          </div>
        </div>
      </Card>
    </div>
  );
}