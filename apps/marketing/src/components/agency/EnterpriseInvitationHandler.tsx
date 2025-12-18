import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Building2, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  company_name: string;
  workspace_name: string;
  enterprise_name: string;
  inviting_enterprise_id: string;
  target_role: string;
}

export const EnterpriseInvitationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'validating' | 'confirmed' | 'error' | 'complete'>('validating');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError('No invitation token provided');
      setStep('error');
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      if (!token) {
        throw new Error('No invitation token provided');
      }

      const { data, error } = await supabase
        .from('customer_onboarding')
        .select('*')
        .eq('magic_token', token)
        .eq('invitation_type', 'enterprise_to_agency')
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired invitation');
      }

      setInvitationData({
        company_name: data.company_name,
        workspace_name: data.workspace_name,
        enterprise_name: data.company_name,
        inviting_enterprise_id: data.inviting_enterprise_id,
        target_role: data.target_role
      });
      setStep('confirmed');
    } catch (err) {
      console.error('Invitation validation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate invitation');
      setStep('error');
    }
  };

  const acceptInvitation = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_enterprise_to_agency_invitation', {
        p_token: token
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      toast.success('Successfully joined enterprise network!');
      setStep('complete');
      
      // Redirect to agency dashboard after short delay
      setTimeout(() => {
        navigate('/agency/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Invitation acceptance error:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Validating Enterprise Invitation</h3>
              <p className="text-muted-foreground">Please wait while we verify your invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-destructive">Invalid Enterprise Invitation</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to the Enterprise Network!</h3>
              <p className="text-muted-foreground mb-4">
                You've successfully joined {invitationData?.enterprise_name}. Redirecting to your agency dashboard...
              </p>
              <div className="animate-pulse text-sm text-muted-foreground">
                Redirecting...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Enterprise Network Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to join an enterprise network as an agency partner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Invitation Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Enterprise:</span>
                <p className="font-medium">{invitationData?.enterprise_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Workspace:</span>
                <p className="font-medium">{invitationData?.workspace_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Your Role:</span>
                <p className="font-medium capitalize">{invitationData?.target_role}</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium">What you'll get access to:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Direct access to enterprise policies and submission workflows</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Brand workspace management for sub-client organization</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-purple-600" />
                <span>Team member invitation and granular access control</span>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By accepting this invitation, you'll be able to manage compliance workflows, 
              create brand workspaces, and invite team members with specific permissions for this enterprise.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
              Decline
            </Button>
            <Button onClick={acceptInvitation} disabled={loading} className="flex-1">
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};