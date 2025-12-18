import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Building2, Users, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { routes } from '@/lib/routes';

interface InviteData {
  enterpriseName: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  policyName: string;
  policyScope: string;
  email: string;
  inviteId: string;
}

const InviteEntryPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError('Invalid invite token');
        setLoading(false);
        return;
      }

      try {
        // Mock API call - replace with actual endpoint
        const response = await fetch(`/api/invite/${token}`);
        
        if (!response.ok) {
          throw new Error('Invalid or expired invite');
        }
        
        // Mock data for demonstration
        const mockData: InviteData = {
          enterpriseName: "Pfizer Oncology Division",
          workspaceId: "pfizer-oncology-2024",
          workspaceName: "Oncology AI Initiative",
          role: "Agency Partner",
          policyName: "MLR-Required Patient Content Policy",
          policyScope: "Generative AI tools requiring medical review",
          email: "partner@agency.com",
          inviteId: token
        };
        
        setInviteData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to validate invite');
        toast.error('Invalid or expired invite token');
      } finally {
        setLoading(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleStartSubmission = () => {
    if (inviteData) {
      // Store invite context for use across submission flow
      localStorage.setItem('inviteContext', JSON.stringify(inviteData));
      navigate(routes.submissionWizard);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(routes.home)} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              You're Invited!
            </h1>
            <p className="text-lg text-muted-foreground">
              You've been invited to submit AI tools for approval
            </p>
          </div>

          {/* Invitation Details Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {inviteData.enterpriseName}
              </CardTitle>
              <CardDescription>
                Workspace: {inviteData.workspaceName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Policy Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Active Policy</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">
                    {inviteData.policyName}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {inviteData.policyScope}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    MLR Required for Patient Content
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Invitation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{inviteData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary">{inviteData.role}</Badge>
                  </div>
                </div>
              </div>

              {/* Submission Information */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete the AI tool submission form</li>
                  <li>• Automatic compliance scoring against active policies</li>
                  <li>• Real-time feedback during submission process</li>
                  <li>• Submit for enterprise review and approval</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(routes.home)}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Learn More
            </Button>
            <Button
              onClick={handleStartSubmission}
              className="flex items-center gap-2"
              size="lg"
            >
              Start Submission
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              This invitation is secure and expires in 7 days. Your submission will be encrypted and processed according to enterprise security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteEntryPage;