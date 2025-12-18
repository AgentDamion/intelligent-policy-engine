import React from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { useSupabaseSubmissions } from '@/hooks/useSupabaseSubmissions';
import { SubmissionsList } from '@/components/agency/SubmissionsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const AgencySubmissions = () => {
  const navigate = useNavigate();
  const { submissions, loading, stats } = useSupabaseSubmissions();

  const handleNewSubmission = () => {
    navigate(routes.submissionWizard);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Submissions</h1>
        <p className="text-muted-foreground">Track all your AI tool submissions and their status</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <SubmissionsList 
        submissions={submissions}
        loading={loading}
        onNewSubmission={handleNewSubmission}
      />
    </div>
  );
};

export default AgencySubmissions;