import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SubmissionRow } from './SubmissionRow';
import { reviewApi } from '@/lib/review/api';
import { Search, Filter, Users, AlertTriangle, Brain, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { realCursorAgencyIntegration } from '@/services/realCursorAgencyIntegration';
import type { Submission, ReviewAction } from '@/pages/agency/review/SubmissionReview';

interface SubmissionQueuesProps {
  onSubmissionSelect: (submission: Submission) => void;
  onReviewAction: (action: ReviewAction['type'], submissionId: string) => void;
}

export const SubmissionQueues: React.FC<SubmissionQueuesProps> = ({
  onSubmissionSelect,
  onReviewAction
}) => {
  const [activeTab, setActiveTab] = useState('my-queue');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    client: '',
    status: '',
    age: '',
    assignee: '',
    search: ''
  });
  const [aiPrioritization, setAiPrioritization] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [submissions, filters]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await reviewApi.list({ queue: activeTab }, {
        agencyId: 'current-agency',
        userId: 'current-user'
      });
      setSubmissions(data);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to load submissions", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = submissions;

    if (filters.search) {
      filtered = filtered.filter(s => 
        s.toolName.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.clientName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.client) {
      filtered = filtered.filter(s => s.clientName === filters.client);
    }

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.age) {
      const now = new Date();
      filtered = filtered.filter(s => {
        const submittedAt = new Date(s.submittedAt);
        const ageHours = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
        
        switch (filters.age) {
          case '0-24h': return ageHours <= 24;
          case '1-3d': return ageHours > 24 && ageHours <= 72;
          case '>3d': return ageHours > 72;
          default: return true;
        }
      });
    }

    // Apply AI prioritization if enabled
    if (aiPrioritization) {
      filtered = filtered.sort((a, b) => {
        // Prioritize by risk level and SLA urgency
        const getPriorityScore = (sub: Submission) => {
          let score = 0;
          if (sub.priority === 'urgent') score += 40;
          else if (sub.priority === 'high') score += 30;
          else if (sub.priority === 'medium') score += 20;
          else score += 10;
          
          if (sub.atRisk) score += 20;
          
          // Factor in submission age
          const ageHours = (new Date().getTime() - new Date(sub.submittedAt).getTime()) / (1000 * 60 * 60);
          if (ageHours > 48) score += 15;
          else if (ageHours > 24) score += 10;
          
          return score;
        };
        
        return getPriorityScore(b) - getPriorityScore(a);
      });
    }

    setFilteredSubmissions(filtered);
  };

  const handleBulkAssign = async () => {
    if (selectedSubmissions.size === 0) return;
    
    try {
      await reviewApi.bulkAssign(Array.from(selectedSubmissions));
      toast({ title: "Success", description: `Assigned ${selectedSubmissions.size} submissions` });
      setSelectedSubmissions(new Set());
      loadSubmissions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign submissions", variant: "destructive" });
    }
  };

  const runAIPrioritization = async () => {
    if (selectedSubmissions.size === 0) {
      toast({ 
        title: "No submissions selected", 
        description: "Please select submissions to analyze", 
        variant: "destructive" 
      });
      return;
    }

    setAiAnalyzing(true);
    try {
      // Prepare batch documents for AI analysis
      const documentsToAnalyze = Array.from(selectedSubmissions).map(id => {
        const submission = submissions.find(s => s.id === id);
        return {
          id: submission?.id || id,
          type: 'ai_tool_submission',
          content: `AI tool: ${submission?.toolName}\nClient: ${submission?.clientName}\nFrameworks: ${submission?.complianceFrameworks.join(', ')}`,
          clientId: submission?.clientId || 'unknown',
          clientName: submission?.clientName || 'Unknown Client',
          metadata: {
            priority: submission?.priority,
            frameworks: submission?.complianceFrameworks,
            submittedAt: submission?.submittedAt
          }
        };
      }).filter(Boolean);

      const documentSet = {
        documents: documentsToAnalyze,
        batchId: `queue-analysis-${Date.now()}`,
        priority: 'high' as const
      };

      await realCursorAgencyIntegration.processBatch(documentsToAnalyze.map(doc => {
        const sourceSubmission = submissions.find(s => s.id === doc.id);
        return {
          id: doc.id || `doc-${Date.now()}`,
          title: sourceSubmission?.toolName || 'Submission Analysis',
          content: doc.content || 'Document for AI analysis',
          type: 'submission_analysis',
          clientId: doc.clientId || 'unknown',
          clientName: doc.clientName || 'Unknown Client',
          metadata: doc.metadata || {}
        };
      }));

      setAiPrioritization(true);
      toast({ 
        title: "AI Analysis Complete", 
        description: `Analyzed ${documentsToAnalyze.length} submissions with intelligent prioritization enabled.` 
      });
    } catch (error) {
      console.error('AI prioritization failed:', error);
      toast({ 
        title: "AI Analysis Failed", 
        description: "Unable to run AI prioritization. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const getQueueCounts = () => {
    const myQueue = submissions.filter(s => s.assignedTo === 'current-user').length;
    const unassigned = submissions.filter(s => !s.assignedTo).length;
    const atRisk = submissions.filter(s => s.atRisk).length;
    const total = submissions.length;
    
    return { myQueue, unassigned, atRisk, total };
  };

  const counts = getQueueCounts();

  const uniqueClients = [...new Set(submissions.map(s => s.clientName))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center bg-card/50 p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search submissions..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.client} onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {uniqueClients.map(client => (
              <SelectItem key={client} value={client}>{client}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="changes_requested">Changes Requested</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.age} onValueChange={(value) => setFilters(prev => ({ ...prev, age: value }))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Age" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="0-24h">0-24h</SelectItem>
            <SelectItem value="1-3d">1-3d</SelectItem>
            <SelectItem value=">3d">&gt;3d</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedSubmissions.size > 0 && (
        <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedSubmissions.size} selected
          </span>
          <Button onClick={handleBulkAssign} size="sm">
            <Users className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
          <Button 
            onClick={runAIPrioritization}
            disabled={aiAnalyzing}
            size="sm"
            variant="secondary"
          >
            {aiAnalyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                AI Prioritize
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedSubmissions(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* AI Prioritization Status */}
      {aiPrioritization && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <Brain className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            AI Prioritization Active - Submissions ordered by intelligent risk assessment
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setAiPrioritization(false)}
            className="ml-auto text-green-600 hover:text-green-700"
          >
            Disable
          </Button>
        </div>
      )}

      {/* Queue Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-queue" className="flex items-center gap-2">
            My Queue
            {counts.myQueue > 0 && <Badge variant="secondary">{counts.myQueue}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="flex items-center gap-2">
            Unassigned
            {counts.unassigned > 0 && <Badge variant="secondary">{counts.unassigned}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            At Risk
            {counts.atRisk > 0 && <Badge variant="destructive">{counts.atRisk}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="by-client" className="flex items-center gap-2">
            By Client
            {counts.total > 0 && <Badge variant="secondary">{counts.total}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-2">
          {loading ? (
            <div className="text-center py-8">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions found for this queue
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubmissions.map(submission => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  isSelected={selectedSubmissions.has(submission.id)}
                  onSelect={(selected) => {
                    const newSelected = new Set(selectedSubmissions);
                    if (selected) {
                      newSelected.add(submission.id);
                    } else {
                      newSelected.delete(submission.id);
                    }
                    setSelectedSubmissions(newSelected);
                  }}
                  onView={() => onSubmissionSelect(submission)}
                  onReviewAction={onReviewAction}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};