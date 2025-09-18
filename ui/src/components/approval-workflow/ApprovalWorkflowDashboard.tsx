import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Progress, Select } from '@/components/ui';
import { 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { ApprovalTimeTracker } from './ApprovalTimeTracker';

interface ApprovalRequest {
  id: string;
  title: string;
  submitter: string;
  submitterRole: string;
  department: string;
  toolName: string;
  vendor: string;
  category: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: Date;
  currentStage: string;
  timeInStage: number; // hours
  expectedCompletion: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number;
  documents: number;
  reviewers: string[];
  lastActivity: Date;
}

interface WorkflowMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedToday: number;
  averageProcessingTime: number; // hours
  accelerationFactor: number;
  complianceRate: number;
  timeSaved: number; // hours
}

interface ApprovalWorkflowDashboardProps {
  className?: string;
}

export function ApprovalWorkflowDashboard({ className = '' }: ApprovalWorkflowDashboardProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedToday: 0,
    averageProcessingTime: 0,
    accelerationFactor: 0,
    complianceRate: 0,
    timeSaved: 0
  });
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    department: 'all',
    riskLevel: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation
  useEffect(() => {
    const generateMockRequests = (): ApprovalRequest[] => {
      const departments = ['Marketing', 'R&D', 'Sales', 'Operations', 'IT'];
      const tools = ['ChatGPT', 'Claude', 'Midjourney', 'DALL-E', 'Custom AI'];
      const vendors = ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Custom'];
      const categories = ['LLM', 'Vision', 'Multimodal', 'Code Generation', 'Content Creation'];
      const statuses: ApprovalRequest['status'][] = ['pending', 'in_review', 'approved', 'rejected', 'needs_info'];
      const priorities: ApprovalRequest['priority'][] = ['low', 'medium', 'high', 'urgent'];
      const riskLevels: ApprovalRequest['riskLevel'][] = ['low', 'medium', 'high', 'critical'];

      return Array.from({ length: 25 }, (_, i) => {
        const submittedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        
        return {
          id: `req-${i + 1}`,
          title: `AI Tool Approval Request #${i + 1}`,
          submitter: `User ${i + 1}`,
          submitterRole: 'Marketing Manager',
          department: departments[Math.floor(Math.random() * departments.length)],
          toolName: tools[Math.floor(Math.random() * tools.length)],
          vendor: vendors[Math.floor(Math.random() * vendors.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          status,
          priority,
          submittedAt,
          currentStage: getCurrentStage(status),
          timeInStage: Math.random() * 48, // 0-48 hours
          expectedCompletion: new Date(submittedAt.getTime() + (4 * 24 * 60 * 60 * 1000)), // 4 days
          riskLevel,
          complianceScore: Math.random() * 40 + 60, // 60-100
          documents: Math.floor(Math.random() * 5) + 1,
          reviewers: ['John Doe', 'Jane Smith'].slice(0, Math.floor(Math.random() * 2) + 1),
          lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        };
      });
    };

    const getCurrentStage = (status: ApprovalRequest['status']): string => {
      switch (status) {
        case 'pending': return 'Initial Review';
        case 'in_review': return 'AI Analysis';
        case 'approved': return 'Completed';
        case 'rejected': return 'Rejected';
        case 'needs_info': return 'Awaiting Info';
        default: return 'Unknown';
      }
    };

    const generateMockMetrics = (requests: ApprovalRequest[]): WorkflowMetrics => {
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_review').length;
      const approvedToday = requests.filter(r => 
        r.status === 'approved' && 
        r.submittedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;
      
      const averageProcessingTime = requests
        .filter(r => r.status === 'approved')
        .reduce((acc, r) => acc + (Date.now() - r.submittedAt.getTime()) / (1000 * 60 * 60), 0) / 
        Math.max(approvedToday, 1);
      
      const accelerationFactor = 47 * 24 / 4; // 47 days to 4 days
      const complianceRate = requests.reduce((acc, r) => acc + r.complianceScore, 0) / totalRequests;
      const timeSaved = totalRequests * (47 * 24 - 4 * 24); // hours saved

      return {
        totalRequests,
        pendingRequests,
        approvedToday,
        averageProcessingTime,
        accelerationFactor,
        complianceRate,
        timeSaved
      };
    };

    // Simulate loading
    setTimeout(() => {
      const mockRequests = generateMockRequests();
      setRequests(mockRequests);
      setMetrics(generateMockMetrics(mockRequests));
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    if (filters.priority !== 'all' && request.priority !== filters.priority) return false;
    if (filters.department !== 'all' && request.department !== filters.department) return false;
    if (filters.riskLevel !== 'all' && request.riskLevel !== filters.riskLevel) return false;
    return true;
  });

  const getStatusColor = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_review': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'needs_info': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: ApprovalRequest['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: ApprovalRequest['riskLevel']) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.pendingRequests}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.approvedToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(metrics.averageProcessingTime)}h
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Acceleration Metrics */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">Acceleration Impact</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {Math.round(metrics.accelerationFactor)}x
            </div>
            <p className="text-sm text-gray-600">Faster than Traditional</p>
            <p className="text-xs text-gray-500">47 days → 4 days</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {Math.round(metrics.complianceRate)}%
            </div>
            <p className="text-sm text-gray-600">Compliance Rate</p>
            <p className="text-xs text-gray-500">Average across all requests</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {Math.round(metrics.timeSaved / 24)}d
            </div>
            <p className="text-sm text-gray-600">Time Saved</p>
            <p className="text-xs text-gray-500">Total hours saved</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <Select
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_review', label: 'In Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'needs_info', label: 'Needs Info' }
            ]}
          />
          
          <Select
            value={filters.priority}
            onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            options={[
              { value: 'all', label: 'All Priority' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' }
            ]}
          />
          
          <Select
            value={filters.department}
            onChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
            options={[
              { value: 'all', label: 'All Departments' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'R&D', label: 'R&D' },
              { value: 'Sales', label: 'Sales' },
              { value: 'Operations', label: 'Operations' },
              { value: 'IT', label: 'IT' }
            ]}
          />
        </div>
      </Card>

      {/* Requests List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Approval Requests ({filteredRequests.length})
            </h3>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="space-y-3">
            {filteredRequests.slice(0, 10).map((request) => (
              <div
                key={request.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedRequest === request.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedRequest(
                  selectedRequest === request.id ? null : request.id
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {request.title}
                      </h4>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <span>{request.toolName} • {request.vendor}</span>
                      <span>{request.department}</span>
                      <span>{formatTimeAgo(request.submittedAt)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getRiskColor(request.riskLevel)}>
                        {request.riskLevel} risk
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {request.documents} docs
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-gray-500">
                    <div>{request.currentStage}</div>
                    <div>{Math.round(request.timeInStage)}h in stage</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Selected Request Details */}
        {selectedRequest && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Full
              </Button>
            </div>
            
            {(() => {
              const request = requests.find(r => r.id === selectedRequest);
              if (!request) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {request.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Tool:</span>
                        <span className="ml-2 font-medium">{request.toolName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Vendor:</span>
                        <span className="ml-2 font-medium">{request.vendor}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <span className="ml-2 font-medium">{request.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Department:</span>
                        <span className="ml-2 font-medium">{request.department}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Progress</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Current Stage: {request.currentStage}</span>
                        <span>{Math.round(request.timeInStage)}h in stage</span>
                      </div>
                      <Progress value={request.complianceScore} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Compliance Score: {Math.round(request.complianceScore)}%</span>
                        <span>Expected: {request.expectedCompletion.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Reviewers</h5>
                    <div className="flex flex-wrap gap-2">
                      {request.reviewers.map((reviewer, index) => (
                        <Badge key={index} variant="outline">
                          {reviewer}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>
        )}
      </div>

      {/* Time Tracker for Selected Request */}
      {selectedRequest && (
        <ApprovalTimeTracker
          submissionId={selectedRequest}
          onTimeUpdate={(metrics) => {
            console.log('Time metrics updated:', metrics);
          }}
        />
      )}
    </div>
  );
}