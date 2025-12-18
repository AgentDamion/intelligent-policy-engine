import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  SortDesc,
  Users,
  Building2,
  Zap,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { DecisionWorkbench } from './DecisionWorkbench';

interface Submission {
  id: string;
  title: string;
  submitter_name: string;
  submitter_org: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  risk_score: number;
  ai_tools_count: number;
  submitted_at: string;
  days_pending: number;
  assigned_reviewer?: string;
  tags: string[];
}

export const EnhancedSubmissionReview = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'kanban' | 'workbench'>('list');

  // Mock data
  const submissions: Submission[] = [
    {
      id: '1',
      title: 'ChatGPT Integration for Customer Support',
      submitter_name: 'John Smith',
      submitter_org: 'GlobalTech Corp',
      status: 'pending',
      priority: 'high',
      risk_score: 6,
      ai_tools_count: 2,
      submitted_at: '2024-01-15T10:00:00Z',
      days_pending: 2,
      tags: ['customer-service', 'automation']
    },
    {
      id: '2',
      title: 'Claude for Legal Document Review',
      submitter_name: 'Sarah Johnson',
      submitter_org: 'LegalPro Inc',
      status: 'under_review',
      priority: 'urgent',
      risk_score: 8,
      ai_tools_count: 1,
      submitted_at: '2024-01-14T14:30:00Z',
      days_pending: 3,
      assigned_reviewer: 'Mike Wilson',
      tags: ['legal', 'document-review']
    },
    {
      id: '3',
      title: 'Midjourney for Marketing Assets',
      submitter_name: 'Alex Chen',
      submitter_org: 'CreativeStudio',
      status: 'approved',
      priority: 'medium',
      risk_score: 3,
      ai_tools_count: 1,
      submitted_at: '2024-01-13T09:15:00Z',
      days_pending: 4,
      assigned_reviewer: 'Lisa Davis',
      tags: ['marketing', 'creative']
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'under_review': return <Clock className="h-4 w-4 text-warning" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'bg-destructive text-destructive-foreground';
    if (score >= 4) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const filteredSubmissions = submissions
    .filter(sub => {
      if (searchTerm && !sub.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !sub.submitter_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !sub.submitter_org.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && sub.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                 priorityOrder[a.priority as keyof typeof priorityOrder];
        case 'risk':
          return b.risk_score - a.risk_score;
        case 'date':
        default:
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
    });

  if (selectedSubmission && view === 'workbench') {
    const submission = submissions.find(s => s.id === selectedSubmission);
    if (submission) {
      const mockItem = {
        id: submission.id,
        title: submission.title,
        description: `AI tool implementation request from ${submission.submitter_org}`,
        ai_tools: ['ChatGPT', 'Claude'],
        risk_score: submission.risk_score,
        ai_recommendation: {
          outcome: 'conditional' as const,
          confidence: 85,
          reasoning: 'Tool appears suitable but requires data handling review',
          conditions: [
            'Implement data encryption at rest',
            'Establish regular audit schedule',
            'Train users on compliance requirements'
          ]
        },
        evidence_files: ['security_assessment.pdf', 'vendor_compliance.pdf'],
        submitted_at: submission.submitted_at
      };

      return (
        <div className="p-6">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setView('list')}
              className="mb-4"
            >
              ← Back to Review Queue
            </Button>
          </div>
          <DecisionWorkbench
            submissionId={submission.id}
            item={mockItem}
            onDecision={(decision) => {
              console.log('Decision made:', decision);
              setView('list');
              setSelectedSubmission(null);
            }}
          />
        </div>
      );
    }
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    under_review: submissions.filter(s => s.status === 'under_review').length,
    overdue: submissions.filter(s => s.days_pending > 3).length,
    avg_review_time: 2.5
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Enhanced Review Queue</h1>
          <p className="text-muted-foreground">Advanced submission management and decision workflows</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.under_review}</div>
            <div className="text-sm text-muted-foreground">Under Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.avg_review_time}d</div>
            <div className="text-sm text-muted-foreground">Avg Review</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions, submitters, organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SortDesc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="risk">Risk Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            List
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            Kanban
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Bulk Approve
            </Button>
            <Button size="sm" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Assign Reviewer
            </Button>
            <Button size="sm" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Request Information
            </Button>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {view === 'list' && (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedItems.includes(submission.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItems([...selectedItems, submission.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== submission.id));
                      }
                    }}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{submission.title}</h3>
                      {getStatusIcon(submission.status)}
                      <Badge className={getPriorityColor(submission.priority)}>
                        {submission.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className={getRiskColor(submission.risk_score)}>
                        Risk: {submission.risk_score}/10
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{submission.submitter_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{submission.submitter_org}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>{submission.ai_tools_count} AI tool{submission.ai_tools_count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className={submission.days_pending > 3 ? 'text-destructive' : ''}>
                          {submission.days_pending} day{submission.days_pending !== 1 ? 's' : ''} pending
                        </span>
                      </div>
                    </div>

                    {submission.assigned_reviewer && (
                      <div className="mt-2">
                        <Badge variant="outline">
                          Assigned to: {submission.assigned_reviewer}
                        </Badge>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {submission.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission.id);
                        setView('workbench');
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    {submission.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Quick Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSubmissions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Submissions Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['pending', 'under_review', 'approved', 'rejected'].map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                  {getStatusIcon(status)}
                  {status.replace('_', ' ')} 
                  <Badge variant="secondary">
                    {filteredSubmissions.filter(s => s.status === status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredSubmissions
                  .filter(s => s.status === status)
                  .map((submission) => (
                    <Card key={submission.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium line-clamp-2">
                            {submission.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(submission.priority)} style={{ fontSize: '10px' }}>
                              {submission.priority}
                            </Badge>
                            <Badge variant="outline" style={{ fontSize: '10px' }}>
                              Risk: {submission.risk_score}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {submission.submitter_org}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {submission.days_pending}d pending
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};