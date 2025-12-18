import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, MessageSquare, Clock, Shield, Download, User } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';

interface SubmissionDetailProps {
  submissionId: string;
  isEnterprise?: boolean;
}

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({ 
  submissionId, 
  isEnterprise = false 
}) => {
  const { mode } = useMode();
  
  // Mock data - replace with actual API call
  const submission = {
    id: submissionId,
    title: "Oncology AI Decision Support Tool",
    status: "Under Review",
    submittedBy: "Dr. Sarah Chen",
    submittedAt: "2024-01-15",
    score: 92,
    riskLevel: "Low",
    evidence: [
      { name: "Clinical Validation Study.pdf", type: "pdf", size: "2.4 MB" },
      { name: "FDA Compliance Report.docx", type: "doc", size: "1.8 MB" },
      { name: "Security Assessment.pdf", type: "pdf", size: "3.1 MB" }
    ],
    activities: [
      { action: "Submitted", user: "Dr. Sarah Chen", timestamp: "2024-01-15 09:30 AM" },
      { action: "Initial Review Started", user: "Compliance Team", timestamp: "2024-01-15 10:15 AM" },
      { action: "Risk Assessment Completed", user: "Risk Analyst", timestamp: "2024-01-15 02:30 PM" }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-brand-green text-white';
      case 'under review': return 'bg-brand-orange text-white';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-brand-green';
      case 'medium': return 'text-brand-orange';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{submission.title}</h1>
          <p className="text-muted-foreground">Submission ID: {submission.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(submission.status)}>
            {submission.status}
          </Badge>
          {isEnterprise && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Submitted By</p>
                  <p className="text-sm text-muted-foreground">{submission.submittedBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted Date</p>
                  <p className="text-sm text-muted-foreground">{submission.submittedAt}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Compliance Score</p>
                  <p className="text-sm font-semibold text-brand-teal">{submission.score}/100</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Risk Level</p>
                  <p className={`text-sm font-semibold ${getRiskColor(submission.riskLevel)}`}>
                    {submission.riskLevel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Evidence & Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submission.evidence.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments & Discussion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No comments yet. Start a discussion about this submission.</p>
                <Button variant="outline" className="mt-4" size="sm">
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.activities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-brand-teal rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tasks (Placeholder for Enterprise) */}
          {isEnterprise && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Review Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No pending tasks</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};