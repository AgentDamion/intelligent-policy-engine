import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare } from 'lucide-react';

const VendorSubmissions = () => {
  // Mock data for demonstration
  const submissions = [
    {
      id: 1,
      toolName: "AI Content Generator",
      submissionDate: "2024-01-15",
      status: "approved",
      reviewDate: "2024-01-18",
      reviewer: "John Smith",
      feedback: "Great tool! Approved for marketplace listing."
    },
    {
      id: 2,
      toolName: "Smart Analytics Tool",
      submissionDate: "2024-01-20",
      status: "pending",
      reviewDate: null,
      reviewer: null,
      feedback: null
    },
    {
      id: 3,
      toolName: "Data Processor v2.0",
      submissionDate: "2024-01-12",
      status: "rejected",
      reviewDate: "2024-01-14",
      reviewer: "Sarah Johnson",
      feedback: "Tool needs better documentation and security improvements before approval."
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Under Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <p className="text-muted-foreground">Track the status of your tool submissions</p>
      </div>

      <div className="grid gap-6">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {submission.toolName}
                    {getStatusBadge(submission.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {submission.submissionDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submission.reviewDate && (
                  <div className="text-sm">
                    <span className="font-medium">Review Date:</span>{' '}
                    <span className="text-muted-foreground">{submission.reviewDate}</span>
                  </div>
                )}
                {submission.reviewer && (
                  <div className="text-sm">
                    <span className="font-medium">Reviewer:</span>{' '}
                    <span className="text-muted-foreground">{submission.reviewer}</span>
                  </div>
                )}
                {submission.feedback && (
                  <div>
                    <p className="font-medium text-sm mb-1">Feedback:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {submission.feedback}
                    </p>
                  </div>
                )}
                {submission.status === 'pending' && (
                  <div className="text-sm text-muted-foreground">
                    Your submission is currently being reviewed. We'll notify you once it's complete.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorSubmissions;