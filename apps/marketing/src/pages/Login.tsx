import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { ArrowLeft } from 'lucide-react';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { SecurityBadge } from '@/components/auth/SecurityBadge';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signIn } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && profile?.account_type) {
      const dashboardMap = {
        enterprise: '/dashboard',
        partner: '/agency/dashboard',
        vendor: '/vendor/dashboard',
        admin: '/internal/dashboard'
      };
      navigate(dashboardMap[profile.account_type as keyof typeof dashboardMap] || '/');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your email and password.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    }
    // On success, useEffect will handle redirect
  };

  const handleDemoEnterprise = async () => {
    setIsLoading(true);
    const { error } = await signIn('demo@enterprise.com', 'demo123');
    setIsLoading(false);
    
    if (error) {
      toast({
        title: 'Demo Login Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    }
  };

  const handleDemoPartner = async () => {
    setIsLoading(true);
    const { error } = await signIn('demo@partner.com', 'demo123');
    setIsLoading(false);
    
    if (error) {
      toast({
        title: 'Demo Login Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    }
  };

  const handleDemoVendor = async () => {
    setIsLoading(true);
    const { error } = await signIn('demo@vendor.com', 'demo123');
    setIsLoading(false);
    
    if (error) {
      toast({
        title: 'Demo Login Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Brand Experience Zone */}
      <div className="relative lg:w-2/5 w-full h-[35vh] lg:h-screen flex flex-col justify-between p-6 lg:p-12 text-white z-10">
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Back to home button */}
        <button
          onClick={() => navigate('/')}
          className="relative z-20 flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </button>
        
        {/* Center content */}
        <div className="relative z-20 flex-1 flex flex-col justify-center space-y-6 lg:space-y-8">
          {/* Animated hummingbird icon */}
          <BrandIcon 
            size="large" 
            variant="dark" 
            animate={true}
            className="w-16 h-16 lg:w-20 lg:h-20"
          />
          
          {/* Main headline */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight font-['Montserrat']">
              Welcome<br />Back!
            </h1>
          </div>
          
          {/* Tagline */}
          <p className="text-lg lg:text-xl text-slate-300 max-w-md leading-relaxed font-light">
            Governance Intelligence Platform — AI That Governs Itself.
          </p>
        </div>
        
        {/* Security badge - bottom */}
        <div className="relative z-20 hidden lg:block">
          <SecurityBadge />
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="relative lg:w-3/5 w-full flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 lg:p-8">
        {/* Glass morphism card */}
        <div className="glass-card w-full max-w-md p-6 lg:p-8 rounded-2xl space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900">
              Login
            </h2>
            <p className="text-slate-600 mt-2">
              Enter your details to access your account.
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input with glow */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            
            {/* Password input with glow */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium">Password</Label>
                <button
                  className="text-sm text-brand-teal hover:text-brand-teal/80 transition-colors"
                  type="button"
                  disabled
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            
            {/* Primary CTA with gradient */}
            <Button 
              type="submit" 
              variant="gradient"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Log in'}
            </Button>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">or</span>
              </div>
            </div>
            
            {/* Alternative auth options */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                type="button"
                disabled
              >
                Sign in with Enterprise SSO
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                type="button"
                disabled
              >
                Use Access Key
              </Button>
            </div>
            
            {/* Demo accounts (collapsible) */}
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="text-sm text-slate-600 hover:text-slate-900 transition-colors w-full text-center py-2">
                Try demo accounts ↓
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm"
                  onClick={handleDemoEnterprise}
                  disabled={isLoading}
                >
                  Demo: Enterprise
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm"
                  onClick={handleDemoPartner}
                  disabled={isLoading}
                >
                  Demo: Partner/Agency
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm"
                  onClick={handleDemoVendor}
                  disabled={isLoading}
                >
                  Demo: Vendor
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </form>
          
          {/* Footer */}
          <div className="text-center text-sm text-slate-600 pt-4">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/register')}
              className="font-semibold text-brand-teal hover:text-brand-teal/80 transition-colors"
            >
              Register Now
            </button>
          </div>
        </div>
        
        {/* Bottom right security text */}
        <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 text-xs text-slate-500 hidden lg:block">
          SOC 2 / GDPR / HIPAA ready
        </div>
      </div>
    </div>
  );
};

export default Login;
