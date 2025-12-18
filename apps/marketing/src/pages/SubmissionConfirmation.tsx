import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowLeft, Eye, Download, Clock } from 'lucide-react';
import { routes } from '@/lib/routes';

const SubmissionConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Submission Received</h1>
            <p className="text-muted-foreground">
              Your AI tool submission has been successfully sent for review
            </p>
          </div>
        </div>

        {/* Submission Details */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Submission ID</p>
                <p className="text-sm text-muted-foreground">SUB-2024-001</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Status</p>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <Clock className="w-3 h-3" />
                  Under Review
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Estimated Review</p>
                <p className="text-sm text-muted-foreground">3-5 business days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Initial Review</p>
                  <p className="text-sm text-muted-foreground">
                    Our compliance team will review your submission for completeness
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Risk Assessment</p>
                  <p className="text-sm text-muted-foreground">
                    AI tool will undergo automated and manual risk assessment
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Decision & Notification</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email with the final decision and any required actions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(routes.agency.dashboard)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Print Receipt
            </Button>
            <Button
              onClick={() => navigate(routes.agency.submissions)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View All Submissions
            </Button>
          </div>
        </div>
      </div>
    );
};

export default SubmissionConfirmation;