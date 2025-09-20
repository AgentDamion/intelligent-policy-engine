import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Progress } from '@/components/ui';
import { 
  Activity, 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  Shield,
  TrendingUp,
  Eye,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';

interface GovernanceEvent {
  id: string;
  timestamp: Date;
  type: 'approval' | 'rejection' | 'processing' | 'compliance' | 'error' | 'milestone';
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  status: 'success' | 'warning' | 'error' | 'info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: {
    submissionId?: string;
    processingTime?: number;
    confidence?: number;
    riskLevel?: string;
    complianceScore?: number;
    accelerationFactor?: number;
    timeSaved?: number;
    [key: string]: any;
  };
  impact: {
    approvalsAccelerated: number;
    timeSaved: number;
    complianceRate: number;
    riskReduction: number;
  };
}

interface LiveGovernanceFeedProps {
  isLive?: boolean;
  onEventClick?: (event: GovernanceEvent) => void;
  className?: string;
}

export function LiveGovernanceFeed({ 
  isLive = true, 
  onEventClick,
  className = '' 
}: LiveGovernanceFeedProps) {
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    approvalsToday: 0,
    timeSaved: 0,
    complianceRate: 0,
    accelerationFactor: 0
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock governance events
  const generateMockEvent = (): GovernanceEvent => {
    const eventTypes: GovernanceEvent['type'][] = [
      'approval', 'rejection', 'processing', 'compliance', 'error', 'milestone'
    ];
    const actors = ['John Doe', 'Jane Smith', 'AI Agent', 'System', 'Compliance Officer'];
    const actorRoles = ['User', 'Admin', 'AI Agent', 'System', 'Compliance Officer'];
    const statuses: GovernanceEvent['status'][] = ['success', 'warning', 'error', 'info'];
    const priorities: GovernanceEvent['priority'][] = ['low', 'medium', 'high', 'urgent'];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const actor = actors[Math.floor(Math.random() * actors.length)];
    const actorRole = actorRoles[Math.floor(Math.random() * actorRoles.length)];

    const eventTemplates = {
      approval: {
        title: 'AI Tool Approved',
        description: 'Request approved with 95% compliance score',
        metadata: {
          submissionId: `sub-${Math.floor(Math.random() * 1000)}`,
          processingTime: Math.floor(Math.random() * 5000) + 1000,
          confidence: 0.95,
          riskLevel: 'low',
          complianceScore: 95,
          accelerationFactor: 47,
          timeSaved: 43
        }
      },
      rejection: {
        title: 'Request Rejected',
        description: 'Compliance violation detected during review',
        metadata: {
          submissionId: `sub-${Math.floor(Math.random() * 1000)}`,
          processingTime: Math.floor(Math.random() * 3000) + 500,
          confidence: 0.88,
          riskLevel: 'high',
          complianceScore: 45,
          accelerationFactor: 47,
          timeSaved: 0
        }
      },
      processing: {
        title: 'Document Processing Complete',
        description: 'Triple-failover parsing completed successfully',
        metadata: {
          submissionId: `sub-${Math.floor(Math.random() * 1000)}`,
          processingTime: Math.floor(Math.random() * 8000) + 2000,
          confidence: 0.92,
          riskLevel: 'medium',
          complianceScore: 88,
          accelerationFactor: 47,
          timeSaved: 2
        }
      },
      compliance: {
        title: 'Compliance Check Passed',
        description: 'FDA 21 CFR Part 11 validation completed',
        metadata: {
          submissionId: `sub-${Math.floor(Math.random() * 1000)}`,
          processingTime: Math.floor(Math.random() * 2000) + 1000,
          confidence: 0.98,
          riskLevel: 'low',
          complianceScore: 98,
          accelerationFactor: 47,
          timeSaved: 5
        }
      },
      error: {
        title: 'Processing Error',
        description: 'AI agent encountered an error, fallback activated',
        metadata: {
          submissionId: `sub-${Math.floor(Math.random() * 1000)}`,
          processingTime: Math.floor(Math.random() * 1000) + 500,
          confidence: 0.75,
          riskLevel: 'medium',
          complianceScore: 70,
          accelerationFactor: 47,
          timeSaved: 0
        }
      },
      milestone: {
        title: 'Milestone Achieved',
        description: '1000th approval processed this month',
        metadata: {
          submissionId: `sub-${Math.floor(Math.random() * 1000)}`,
          processingTime: 0,
          confidence: 1.0,
          riskLevel: 'low',
          complianceScore: 100,
          accelerationFactor: 47,
          timeSaved: 1000
        }
      }
    };

    const template = eventTemplates[eventType];
    const timestamp = new Date();

    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type: eventType,
      title: template.title,
      description: template.description,
      actor,
      actorRole,
      status,
      priority,
      metadata: template.metadata,
      impact: {
        approvalsAccelerated: Math.floor(Math.random() * 100) + 1,
        timeSaved: Math.floor(Math.random() * 1000) + 100,
        complianceRate: Math.floor(Math.random() * 20) + 80,
        riskReduction: Math.floor(Math.random() * 30) + 70
      }
    };
  };

  // Start/stop live feed
  useEffect(() => {
    if (isLive && !isPaused) {
      intervalRef.current = setInterval(() => {
        const newEvent = generateMockEvent();
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
        
        // Update stats
        setStats(prev => ({
          totalEvents: prev.totalEvents + 1,
          approvalsToday: prev.approvalsToday + (newEvent.type === 'approval' ? 1 : 0),
          timeSaved: prev.timeSaved + (newEvent.metadata.timeSaved || 0),
          complianceRate: Math.round((prev.complianceRate + newEvent.metadata.complianceScore) / 2),
          accelerationFactor: newEvent.metadata.accelerationFactor || prev.accelerationFactor
        }));
      }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, isPaused]);

  const getEventIcon = (type: GovernanceEvent['type']) => {
    switch (type) {
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'rejection': return <XCircle className="h-4 w-4" />;
      case 'processing': return <Zap className="h-4 w-4" />;
      case 'compliance': return <Shield className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'milestone': return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: GovernanceEvent['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: GovernanceEvent['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: GovernanceEvent['type']) => {
    switch (type) {
      case 'approval': return 'text-green-600';
      case 'rejection': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      case 'compliance': return 'text-purple-600';
      case 'error': return 'text-red-600';
      case 'milestone': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setEvents([]);
    setStats({
      totalEvents: 0,
      approvalsToday: 0,
      timeSaved: 0,
      complianceRate: 0,
      accelerationFactor: 0
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Live Governance Feed</h3>
          <p className="text-sm text-gray-600">
            Real-time AI governance events and approvals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isLive && !isPaused ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600">
              {isLive && !isPaused ? 'Live' : 'Paused'}
            </span>
          </div>
          <Button
            onClick={handlePauseToggle}
            variant="outline"
            size="sm"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approvals Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvalsToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.timeSaved}h</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.complianceRate}%</p>
            </div>
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Live Feed */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Live Events</h4>
          <Badge className="text-green-600 bg-green-50 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            {events.length} Events
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No events yet. Start the live feed to see governance events.</p>
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                  index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      event.status === 'success' ? 'bg-green-100' :
                      event.status === 'warning' ? 'bg-yellow-100' :
                      event.status === 'error' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {getEventIcon(event.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          {event.title}
                        </h5>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                        <span className={`text-xs font-medium ${getTypeColor(event.type)}`}>
                          {event.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(event.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{event.actor} ({event.actorRole})</span>
                      </div>
                      {event.metadata.submissionId && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{event.metadata.submissionId}</span>
                        </div>
                      )}
                      {event.metadata.processingTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.metadata.processingTime}ms</span>
                        </div>
                      )}
                      {event.metadata.complianceScore && (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>{event.metadata.complianceScore}% compliance</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Impact Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Live Impact Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.accelerationFactor}x
            </div>
            <div className="text-sm text-gray-600">Acceleration Factor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.approvalsToday}
            </div>
            <div className="text-sm text-gray-600">Approvals Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.timeSaved}h
            </div>
            <div className="text-sm text-gray-600">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {stats.complianceRate}%
            </div>
            <div className="text-sm text-gray-600">Compliance Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
}