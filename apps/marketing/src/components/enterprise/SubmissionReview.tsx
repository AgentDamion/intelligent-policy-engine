import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import type { Submission } from '@/types/enterprise';

interface SubmissionReviewProps {
  submissions: Submission[];
  onReviewSubmission: (submissionId: number, action: 'approve' | 'reject', feedback?: string) => Promise<void>;
}

const SubmissionReview: React.FC<SubmissionReviewProps> = ({ 
  submissions, 
  onReviewSubmission 
}) => {
  const handleReview = (submissionId: number, action: 'approve' | 'reject', feedback?: string) => {
    onReviewSubmission(submissionId, action, feedback);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 0.3) return 'text-green-600';
    if (score <= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return 'Low';
    if (score <= 0.6) return 'Medium';
    return 'High';
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Reviews ({pendingSubmissions.length})
          </CardTitle>
          <CardDescription>
            Agency submissions awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length > 0 ? (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{submission.type}</h4>
                        <Badge className="text-xs">{submission.agencyName}</Badge>
                        <Badge 
                          className={`flex items-center gap-1 ${getStatusColor(submission.status)}`}
                        >
                          {getStatusIcon(submission.status)}
                          {submission.status}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">AI Tools Used:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {submission.aiTools.map((tool, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Assessment:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`font-medium ${getRiskColor(submission.riskScore)}`}>
                              {getRiskLevel(submission.riskScore)}
                            </span>
                            <span className="text-gray-500">({(submission.riskScore * 100).toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleReview(submission.id, 'approve', 'Approved - meets all compliance requirements')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReview(submission.id, 'reject', 'Rejected - please review policy requirements')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No submissions pending review</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {reviewedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>
              Previously reviewed submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedSubmissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(submission.status)}
                    <div>
                      <div className="font-medium text-sm">{submission.type}</div>
                      <div className="text-xs text-gray-600">{submission.agencyName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={`${getStatusColor(submission.status)} text-xs`}
                    >
                      {submission.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubmissionReview;