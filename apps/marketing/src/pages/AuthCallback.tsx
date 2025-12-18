import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CheckCircle, XCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setErrorMessage('Failed to establish session. Please try signing in again.');
          return;
        }

        if (!session) {
          // If no session, user might need to click the email link
          setStatus('error');
          setErrorMessage('No active session found. Please check your email and click the confirmation link.');
          return;
        }

        // Session established successfully
        console.log('Session established for user:', session.user.email);
        setStatus('success');

        // Wait a moment for profile to load, then redirect
        setTimeout(() => {
          if (profile?.account_type) {
            const dashboardMap = {
              enterprise: '/dashboard',
              partner: '/agency/dashboard',
              vendor: '/vendor/dashboard',
              admin: '/internal/dashboard'
            };
            navigate(dashboardMap[profile.account_type as keyof typeof dashboardMap] || '/', { replace: true });
          } else {
            // Profile not yet loaded, redirect to home and let auth context handle it
            navigate('/', { replace: true });
          }
        }, 1500);

      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleCallback();
  }, [navigate, profile]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <LoadingSpinner size="lg" />
            </div>
            <CardTitle>Confirming Your Email</CardTitle>
            <CardDescription>
              Please wait while we set up your account...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Email Confirmed!</CardTitle>
            <CardDescription>
              Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Email Confirmation Failed</CardTitle>
          <CardDescription>
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Go to Sign In
          </Button>
          
          <Button
            onClick={() => navigate('/contact')}
            variant="outline"
            className="w-full"
          >
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
