import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Progress, Select } from '@/components/ui';
import { 
  FileText, 
  Clock, 
  User, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  Zap,
  Shield
} from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'document_upload' | 'processing_start' | 'ai_analysis' | 'compliance_check' | 'approval' | 'rejection' | 'error';
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  status: 'success' | 'warning' | 'error';
  metadata: {
    documentId?: string;
    processingTime?: number;
    confidence?: number;
    riskLevel?: string;
    complianceScore?: number;
    [key: string]: any;
  };
  beforeState?: any;
  afterState?: any;
  changes?: AuditChange[];
}

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

interface AuditTrailVisualizationProps {
  submissionId?: string;
  onEventSelect?: (event: AuditEvent) => void;
  className?: string;
}

export function AuditTrailVisualization({ 
  submissionId, 
  onEventSelect,
  className = '' 
}: AuditTrailVisualizationProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [filters, setFilters] = useState({
    eventType: 'all',
    status: 'all',
    actor: 'all',
    dateRange: 'all'
  });
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock audit events
  useEffect(() => {
    const generateMockEvents = (): AuditEvent[] => {
      const eventTypes: AuditEvent['eventType'][] = [
        'document_upload', 'processing_start', 'ai_analysis', 
        'compliance_check', 'approval', 'rejection', 'error'
      ];
      const actors = ['John Doe', 'Jane Smith', 'AI Agent', 'System', 'Compliance Officer'];
      const actorRoles = ['User', 'Admin', 'AI Agent', 'System', 'Compliance Officer'];
      const statuses: AuditEvent['status'][] = ['success', 'warning', 'error'];

      return Array.from({ length: 50 }, (_, i) => {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        
        return {
          id: `audit-${i + 1}`,
          timestamp,
          eventType,
          actor: actors[Math.floor(Math.random() * actors.length)],
          actorRole: actorRoles[Math.floor(Math.random() * actorRoles.length)],
          action: getActionForEventType(eventType),
          description: getDescriptionForEventType(eventType),
          status,
          metadata: generateMetadataForEvent(eventType),
          beforeState: generateBeforeState(eventType),
          afterState: generateAfterState(eventType),
          changes: generateChanges(eventType)
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    const getActionForEventType = (eventType: AuditEvent['eventType']): string => {
      switch (eventType) {
        case 'document_upload': return 'Document Uploaded';
        case 'processing_start': return 'Processing Started';
        case 'ai_analysis': return 'AI Analysis Completed';
        case 'compliance_check': return 'Compliance Check';
        case 'approval': return 'Approval Granted';
        case 'rejection': return 'Rejection Issued';
        case 'error': return 'Error Occurred';
        default: return 'Unknown Action';
      }
    };

    const getDescriptionForEventType = (eventType: AuditEvent['eventType']): string => {
      switch (eventType) {
        case 'document_upload': return 'Document successfully uploaded and validated';
        case 'processing_start': return 'Document processing pipeline initiated';
        case 'ai_analysis': return 'AI agents completed analysis with confidence scoring';
        case 'compliance_check': return 'Regulatory compliance validation completed';
        case 'approval': return 'Request approved by authorized personnel';
        case 'rejection': return 'Request rejected due to compliance issues';
        case 'error': return 'Processing error occurred during execution';
        default: return 'Unknown event';
      }
    };

    const generateMetadataForEvent = (eventType: AuditEvent['eventType']) => {
      const base = {
        documentId: `doc-${Math.floor(Math.random() * 1000)}`,
        processingTime: Math.floor(Math.random() * 5000) + 1000,
        confidence: Math.random() * 0.4 + 0.6,
        riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        complianceScore: Math.floor(Math.random() * 30) + 70
      };

      switch (eventType) {
        case 'ai_analysis':
          return { ...base, model: 'claude-3.5-sonnet', tokens: Math.floor(Math.random() * 10000) };
        case 'compliance_check':
          return { ...base, regulations: ['FDA 21 CFR Part 11', 'HIPAA'], violations: Math.floor(Math.random() * 3) };
        case 'approval':
          return { ...base, approver: 'CISO', approvalLevel: 'Final' };
        case 'rejection':
          return { ...base, reason: 'Compliance violation', severity: 'High' };
        default:
          return base;
      }
    };

    const generateBeforeState = (eventType: AuditEvent['eventType']) => {
      switch (eventType) {
        case 'document_upload':
          return { status: 'pending', uploaded: false };
        case 'processing_start':
          return { status: 'uploaded', processed: false };
        case 'ai_analysis':
          return { status: 'processing', analyzed: false };
        case 'compliance_check':
          return { status: 'analyzed', compliant: null };
        case 'approval':
          return { status: 'pending_approval', approved: false };
        case 'rejection':
          return { status: 'pending_approval', rejected: false };
        default:
          return {};
      }
    };

    const generateAfterState = (eventType: AuditEvent['eventType']) => {
      switch (eventType) {
        case 'document_upload':
          return { status: 'uploaded', uploaded: true, uploadedAt: new Date() };
        case 'processing_start':
          return { status: 'processing', processed: true, processedAt: new Date() };
        case 'ai_analysis':
          return { status: 'analyzed', analyzed: true, analyzedAt: new Date() };
        case 'compliance_check':
          return { status: 'checked', compliant: true, checkedAt: new Date() };
        case 'approval':
          return { status: 'approved', approved: true, approvedAt: new Date() };
        case 'rejection':
          return { status: 'rejected', rejected: true, rejectedAt: new Date() };
        default:
          return {};
      }
    };

    const generateChanges = (eventType: AuditEvent['eventType']): AuditChange[] => {
      const changes: AuditChange[] = [];
      
      switch (eventType) {
        case 'document_upload':
          changes.push({
            field: 'status',
            oldValue: 'pending',
            newValue: 'uploaded',
            changeType: 'modified'
          });
          changes.push({
            field: 'uploaded',
            oldValue: false,
            newValue: true,
            changeType: 'modified'
          });
          break;
        case 'ai_analysis':
          changes.push({
            field: 'confidence',
            oldValue: null,
            newValue: Math.random() * 0.4 + 0.6,
            changeType: 'added'
          });
          changes.push({
            field: 'riskLevel',
            oldValue: null,
            newValue: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            changeType: 'added'
          });
          break;
        case 'approval':
          changes.push({
            field: 'status',
            oldValue: 'pending_approval',
            newValue: 'approved',
            changeType: 'modified'
          });
          changes.push({
            field: 'approved',
            oldValue: false,
            newValue: true,
            changeType: 'modified'
          });
          break;
      }
      
      return changes;
    };

    // Simulate loading
    setTimeout(() => {
      const mockEvents = generateMockEvents();
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, [submissionId]);

  // Apply filters
  useEffect(() => {
    let filtered = events;

    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    if (filters.actor !== 'all') {
      filtered = filtered.filter(event => event.actor === filters.actor);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date(now.getTime() - (parseInt(filters.dateRange) * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(event => event.timestamp >= cutoff);
    }

    setFilteredEvents(filtered);
  }, [events, filters]);

  const getEventIcon = (eventType: AuditEvent['eventType']) => {
    switch (eventType) {
      case 'document_upload': return <FileText className="h-4 w-4" />;
      case 'processing_start': return <Zap className="h-4 w-4" />;
      case 'ai_analysis': return <Activity className="h-4 w-4" />;
      case 'compliance_check': return <Shield className="h-4 w-4" />;
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'rejection': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AuditEvent['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEventTypeColor = (eventType: AuditEvent['eventType']) => {
    switch (eventType) {
      case 'document_upload': return 'text-blue-600';
      case 'processing_start': return 'text-purple-600';
      case 'ai_analysis': return 'text-indigo-600';
      case 'compliance_check': return 'text-green-600';
      case 'approval': return 'text-green-600';
      case 'rejection': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const exportAuditTrail = () => {
    const csvData = filteredEvents.map(event => ({
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      actor: event.actor,
      actorRole: event.actorRole,
      action: event.action,
      description: event.description,
      status: event.status,
      documentId: event.metadata.documentId || '',
      processingTime: event.metadata.processingTime || '',
      confidence: event.metadata.confidence || '',
      riskLevel: event.metadata.riskLevel || '',
      complianceScore: event.metadata.complianceScore || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Audit Trail</h3>
          <p className="text-sm text-gray-600">
            Complete audit log with {filteredEvents.length} events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={exportAuditTrail} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <Select
            value={filters.eventType}
            onChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}
            options={[
              { value: 'all', label: 'All Events' },
              { value: 'document_upload', label: 'Document Upload' },
              { value: 'processing_start', label: 'Processing Start' },
              { value: 'ai_analysis', label: 'AI Analysis' },
              { value: 'compliance_check', label: 'Compliance Check' },
              { value: 'approval', label: 'Approval' },
              { value: 'rejection', label: 'Rejection' },
              { value: 'error', label: 'Error' }
            ]}
          />
          
          <Select
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'success', label: 'Success' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' }
            ]}
          />
          
          <Select
            value={filters.actor}
            onChange={(value) => setFilters(prev => ({ ...prev, actor: value }))}
            options={[
              { value: 'all', label: 'All Actors' },
              { value: 'John Doe', label: 'John Doe' },
              { value: 'Jane Smith', label: 'Jane Smith' },
              { value: 'AI Agent', label: 'AI Agent' },
              { value: 'System', label: 'System' },
              { value: 'Compliance Officer', label: 'Compliance Officer' }
            ]}
          />
          
          <Select
            value={filters.dateRange}
            onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            options={[
              { value: 'all', label: 'All Time' },
              { value: '1', label: 'Last 24 Hours' },
              { value: '7', label: 'Last 7 Days' },
              { value: '30', label: 'Last 30 Days' }
            ]}
          />
        </div>
      </Card>

      {/* Event Timeline */}
      <div className="space-y-3">
        {filteredEvents.map((event, index) => (
          <Card 
            key={event.id} 
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedEvent(selectedEvent?.id === event.id ? null : event);
              onEventSelect?.(event);
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${
                  event.status === 'success' ? 'bg-green-100' :
                  event.status === 'warning' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  {getEventIcon(event.eventType)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.action}
                    </h4>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                    <span className={`text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                      {event.eventType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(event.timestamp)}</span>
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
                  {event.metadata.documentId && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{event.metadata.documentId}</span>
                    </div>
                  )}
                  {event.metadata.processingTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{event.metadata.processingTime}ms</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Event Details */}
      {selectedEvent && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Event Details</h4>
            <Button
              onClick={() => setSelectedEvent(null)}
              variant="outline"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Event Type</label>
                <p className="text-sm text-gray-900">{selectedEvent.eventType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900">{selectedEvent.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Actor</label>
                <p className="text-sm text-gray-900">{selectedEvent.actor} ({selectedEvent.actorRole})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-sm text-gray-900">{selectedEvent.timestamp.toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-sm text-gray-900">{selectedEvent.description}</p>
            </div>
            
            {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Metadata</label>
                <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded border mt-1 overflow-x-auto">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}
            
            {selectedEvent.changes && selectedEvent.changes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Changes</label>
                <div className="space-y-2 mt-1">
                  {selectedEvent.changes.map((change, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{change.field}</span>
                        <Badge className={
                          change.changeType === 'added' ? 'text-green-600 bg-green-50' :
                          change.changeType === 'modified' ? 'text-blue-600 bg-blue-50' :
                          'text-red-600 bg-red-50'
                        }>
                          {change.changeType}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <div className="text-gray-600">
                          <span className="font-medium">From:</span> {JSON.stringify(change.oldValue)}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">To:</span> {JSON.stringify(change.newValue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}