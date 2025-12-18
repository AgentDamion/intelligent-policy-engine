import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Building,
  Calendar,
  User,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Download
} from 'lucide-react';

interface ToolSubmission {
  id: string;
  toolName: string;
  vendor: string;
  category: string;
  client: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_changes';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedDate?: string;
  submittedBy: string;
  reviewedBy?: string;
  reviewedDate?: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  complianceScore?: number;
  estimatedReviewTime: number; // in days
  actualReviewTime?: number; // in days
  feedback?: string;
  attachments: number;
}

const mockSubmissions: ToolSubmission[] = [
  {
    id: '1',
    toolName: 'ChatGPT Enterprise',
    vendor: 'OpenAI',
    category: 'Language Model',
    client: 'Pharma Corp',
    status: 'approved',
    priority: 'high',
    submittedDate: '2024-01-10',
    submittedBy: 'Alice Johnson',
    reviewedBy: 'Dr. Smith',
    reviewedDate: '2024-01-15',
    description: 'Request to use ChatGPT Enterprise for regulatory document review and clinical protocol drafting',
    riskLevel: 'medium',
    complianceScore: 92,
    estimatedReviewTime: 5,
    actualReviewTime: 5,
    attachments: 3
  },
  {
    id: '2',
    toolName: 'Custom ML Model v2.1',
    vendor: 'Internal',
    category: 'Machine Learning',
    client: 'BioTech Inc',
    status: 'under_review',
    priority: 'critical',
    submittedDate: '2024-01-12',
    submittedBy: 'Bob Chen',
    description: 'Custom machine learning model for adverse event prediction in clinical trials',
    riskLevel: 'high',
    estimatedReviewTime: 10,
    attachments: 7
  },
  {
    id: '3',
    toolName: 'GitHub Copilot',
    vendor: 'Microsoft',
    category: 'Code Assistant',
    client: 'MedDevice Co',
    status: 'requires_changes',
    priority: 'medium',
    submittedDate: '2024-01-08',
    submittedBy: 'Carol Davis',
    reviewedBy: 'Dr. Wilson',
    reviewedDate: '2024-01-14',
    description: 'AI coding assistant for developing medical device software validation tools',
    riskLevel: 'medium',
    estimatedReviewTime: 7,
    actualReviewTime: 6,
    feedback: 'Please provide additional information about data handling and code review processes',
    attachments: 2
  },
  {
    id: '4',
    toolName: 'Stability AI Diffusion',
    vendor: 'Stability AI',
    category: 'Image Generation',
    client: 'Pharma Corp',
    status: 'draft',
    priority: 'low',
    submittedBy: 'David Kim',
    description: 'Image generation tool for creating educational materials and presentation graphics',
    riskLevel: 'low',
    estimatedReviewTime: 3,
    attachments: 1
  },
  {
    id: '5',
    toolName: 'Claude Pro',
    vendor: 'Anthropic',
    category: 'Language Model',
    client: 'BioTech Inc',
    status: 'rejected',
    priority: 'medium',
    submittedDate: '2024-01-05',
    submittedBy: 'Eva Rodriguez',
    reviewedBy: 'Dr. Brown',
    reviewedDate: '2024-01-11',
    description: 'Alternative language model for technical documentation and research assistance',
    riskLevel: 'medium',
    estimatedReviewTime: 5,
    actualReviewTime: 6,
    feedback: 'Insufficient vendor security documentation. Please resubmit with updated compliance certificates.',
    attachments: 4
  }
];

const SubmissionWorkflowEnhanced = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'requires_changes': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'requires_changes': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredSubmissions = mockSubmissions.filter(submission => {
    const matchesSearch = submission.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === 'all' || submission.client === selectedClient;
    const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
    const matchesTab = activeTab === 'all' || submission.status === activeTab;
    return matchesSearch && matchesClient && matchesStatus && matchesTab;
  });

  const uniqueClients = [...new Set(mockSubmissions.map(sub => sub.client))];
  
  // Stats calculations
  const totalSubmissions = mockSubmissions.length;
  const pendingReview = mockSubmissions.filter(sub => sub.status === 'under_review' || sub.status === 'submitted').length;
  const approved = mockSubmissions.filter(sub => sub.status === 'approved').length;
  const needsAction = mockSubmissions.filter(sub => sub.status === 'requires_changes' || sub.status === 'draft').length;

  const averageReviewTime = mockSubmissions
    .filter(sub => sub.actualReviewTime)
    .reduce((acc, sub) => acc + (sub.actualReviewTime || 0), 0) / 
    mockSubmissions.filter(sub => sub.actualReviewTime).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingReview}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Review Time</p>
                <p className="text-2xl font-bold">{Math.round(averageReviewTime)}d</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Submissions</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="requires_changes">Needs Action</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Submission
          </Button>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Tool Submissions</CardTitle>
              <CardDescription>
                Track and manage AI tool approval requests across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tools, vendors, clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="requires_changes">Requires Changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submissions List */}
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{submission.toolName}</h3>
                            <Badge className={getStatusColor(submission.status)} variant="outline">
                              {getStatusIcon(submission.status)}
                              <span className="ml-1 capitalize">{submission.status.replace('_', ' ')}</span>
                            </Badge>
                            <Badge className={getPriorityColor(submission.priority)} variant="outline">
                              {submission.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{submission.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{submission.client}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>By {submission.submittedBy}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className={`h-4 w-4 ${getRiskColor(submission.riskLevel)}`} />
                              <span className="capitalize">{submission.riskLevel} Risk</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>{submission.attachments} attachments</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {submission.status === 'draft' && (
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Submit
                            </Button>
                          )}
                          {submission.status === 'requires_changes' && (
                            <Button size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Timeline and Progress */}
                      <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            {submission.submittedDate && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Submitted {new Date(submission.submittedDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {submission.reviewedDate && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Reviewed {new Date(submission.reviewedDate).toLocaleDateString()}</span>
                                {submission.reviewedBy && <span>by {submission.reviewedBy}</span>}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Review Progress: {submission.actualReviewTime ? `${submission.actualReviewTime}/${submission.estimatedReviewTime}` : `0/${submission.estimatedReviewTime}`} days
                            </div>
                            <Progress 
                              value={submission.actualReviewTime ? (submission.actualReviewTime / submission.estimatedReviewTime) * 100 : 0} 
                              className="h-2 w-32 mt-1" 
                            />
                          </div>
                        </div>

                        {submission.feedback && (
                          <div className="bg-muted p-3 rounded-md">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Feedback:</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                          </div>
                        )}

                        {submission.complianceScore && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Compliance Score:</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={submission.complianceScore} className="h-2 w-24" />
                              <span className="text-sm font-medium">{submission.complianceScore}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubmissionWorkflowEnhanced;