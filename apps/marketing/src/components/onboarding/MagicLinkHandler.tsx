import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MagicLinkHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [setupData, setSetupData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState<'validating' | 'setup' | 'complete' | 'error'>('validating');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing magic link token');
      setStep('error');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_onboarding')
        .select('*')
        .eq('magic_token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setError('Invalid or expired magic link');
        setStep('error');
        return;
      }

      setOnboardingData(data);
      setStep('setup');
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate magic link');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (setupData.password !== setupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (setupData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { error: signUpError } = await signUp(
        onboardingData.email,
        setupData.password,
        setupData.firstName,
        setupData.lastName
      );

      if (signUpError) {
        throw signUpError;
      }

      // Mark the magic link as used
      await supabase
        .from('customer_onboarding')
        .update({ 
          used_at: new Date().toISOString(),
          onboarding_data: {
            firstName: setupData.firstName,
            lastName: setupData.lastName
          }
        })
        .eq('magic_token', token);

      setStep('complete');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err: any) {
      console.error('Error setting up account:', err);
      toast.error(err.message || 'Failed to set up account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Validating Magic Link</h3>
            <p className="text-muted-foreground">Please wait while we verify your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invalid Magic Link</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild variant="outline">
              <a href="/contact">Request New Invitation</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Account Created Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              Welcome to AI Comply! Your account has been set up and you'll be redirected shortly.
            </p>
            <div className="animate-pulse text-sm text-muted-foreground">
              Redirecting to dashboard...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Complete Your Account Setup</CardTitle>
          <p className="text-muted-foreground">
            You've been invited to join {onboardingData?.company_name}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={setupData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={setupData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={onboardingData?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={setupData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a secure password"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={setupData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up account...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Account Type: {onboardingData?.account_type}</p>
            <p>Role: {onboardingData?.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkHandler;