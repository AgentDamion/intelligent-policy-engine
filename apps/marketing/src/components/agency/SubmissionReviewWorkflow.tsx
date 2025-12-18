import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Users, 
  TrendingUp,
  Filter,
  Calendar,
  Download,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Submission {
  id: string;
  client_name: string;
  tool_name: string;
  submitted_at: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sla_hours: number;
  reviewer?: string;
  compliance_frameworks: string[];
}

interface SubmissionReviewWorkflowProps {
  agencyWorkspaceId: string;
}

export const SubmissionReviewWorkflow: React.FC<SubmissionReviewWorkflowProps> = ({
  agencyWorkspaceId
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent' | 'overdue'>('all');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, [agencyWorkspaceId]);

  const fetchSubmissions = async () => {
    try {
      // In production, this would fetch real submissions
      // For now, using enhanced sample data
      const sampleSubmissions: Submission[] = [
        {
          id: '1',
          client_name: 'Pfizer Inc.',
          tool_name: 'ChatGPT for Clinical Trial Analysis',
          submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          priority: 'urgent',
          sla_hours: 24,
          compliance_frameworks: ['FDA 21 CFR Part 11', 'GxP']
        },
        {
          id: '2',
          client_name: 'Novartis AG',
          tool_name: 'Claude for Drug Discovery',
          submitted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'under_review',
          priority: 'high',
          sla_hours: 48,
          reviewer: 'Sarah Johnson',
          compliance_frameworks: ['FDA', 'EMA']
        },
        {
          id: '3',
          client_name: 'JPMorgan Chase',
          tool_name: 'Copilot for Financial Analysis',
          submitted_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          priority: 'medium',
          sla_hours: 72,
          compliance_frameworks: ['SOX', 'GDPR']
        },
        {
          id: '4',
          client_name: 'Microsoft',
          tool_name: 'Gemini for Code Review',
          submitted_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          priority: 'high',
          sla_hours: 24,
          compliance_frameworks: ['ISO 27001', 'SOC 2']
        }
      ];

      setSubmissions(sampleSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (submittedAt: string, slaHours: number) => {
    const submitted = new Date(submittedAt);
    const deadline = new Date(submitted.getTime() + slaHours * 60 * 60 * 1000);
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    
    if (remaining <= 0) return { text: 'Overdue', isOverdue: true };
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) return { text: `${minutes}m`, isOverdue: false, isUrgent: true };
    if (hours < 6) return { text: `${hours}h ${minutes}m`, isOverdue: false, isUrgent: true };
    if (hours < 24) return { text: `${hours}h`, isOverdue: false, isUrgent: false };
    
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h`, isOverdue: false, isUrgent: false };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    switch (filter) {
      case 'pending':
        return submission.status === 'pending';
      case 'urgent':
        return submission.priority === 'urgent' || submission.priority === 'high';
      case 'overdue':
        return getTimeRemaining(submission.submitted_at, submission.sla_hours).isOverdue;
      default:
        return true;
    }
  });

  const handleBulkAction = async (action: 'assign' | 'approve' | 'review') => {
    if (selectedSubmissions.length === 0) return;
    
    try {
      // In production, this would update submission statuses
      toast({
        title: 'Success',
        description: `${action} applied to ${selectedSubmissions.length} submissions`,
      });
      setSelectedSubmissions([]);
      fetchSubmissions();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} submissions`,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Submission Review Workflow</h3>
          <p className="text-sm text-muted-foreground">
            Streamlined agency-centric submission review dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({submissions.filter(s => s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent ({submissions.filter(s => s.priority === 'urgent' || s.priority === 'high').length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({submissions.filter(s => getTimeRemaining(s.submitted_at, s.sla_hours).isOverdue).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{selectedSubmissions.length} submissions selected</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleBulkAction('assign')}>
                Assign Reviewer
              </Button>
              <Button size="sm" onClick={() => handleBulkAction('review')}>
                Start Review
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedSubmissions([])}>
                Clear
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium mb-2">No submissions found</h4>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' ? 'No submissions to review at the moment' : `No ${filter} submissions`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => {
            const timeRemaining = getTimeRemaining(submission.submitted_at, submission.sla_hours);
            const isSelected = selectedSubmissions.includes(submission.id);
            
            return (
              <Card 
                key={submission.id} 
                className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''} ${timeRemaining.isOverdue ? 'border-destructive' : ''}`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedSubmissions(prev => prev.filter(id => id !== submission.id));
                  } else {
                    setSelectedSubmissions(prev => [...prev, submission.id]);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <div>
                        <h4 className="font-medium">{submission.tool_name}</h4>
                        <p className="text-sm text-muted-foreground">{submission.client_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(submission.priority)} bg-transparent border-0 px-2 py-1`}>
                        {submission.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time Remaining:</span>
                      <p className={`font-medium ${timeRemaining.isOverdue ? 'text-destructive' : timeRemaining.isUrgent ? 'text-warning' : ''}`}>
                        {timeRemaining.text}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviewer:</span>
                      <p className="font-medium">{submission.reviewer || 'Unassigned'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frameworks:</span>
                      <p className="font-medium">{submission.compliance_frameworks.length}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {submission.compliance_frameworks.slice(0, 2).map(framework => (
                        <Badge key={framework} variant="outline" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                      {submission.compliance_frameworks.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{submission.compliance_frameworks.length - 2} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm">
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};