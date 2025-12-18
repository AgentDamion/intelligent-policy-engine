import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage, getPasswordStrength } from '@/utils/authErrors';
import { Building2, Users, Package, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountType = 'enterprise' | 'partner' | 'vendor';

const accountTypes = [
  {
    type: 'enterprise' as AccountType,
    icon: Building2,
    title: 'Enterprise',
    description: 'Manage AI compliance across your organization',
    badges: ['Policy Management', 'Decision Tracking', 'Audit Trails', 'Analytics']
  },
  {
    type: 'partner' as AccountType,
    icon: Users,
    title: 'Partner/Agency',
    description: 'Track AI tools and submit for compliance review',
    badges: ['Project Management', 'AI Tool Tracking', 'Compliance Submissions', 'Client Collaboration']
  },
  {
    type: 'vendor' as AccountType,
    icon: Package,
    title: 'AI Tool Vendor',
    description: 'List and promote your AI tools in the marketplace',
    badges: ['Tool Listings', 'Promotion Management', 'Analytics Dashboard', 'Vendor Portal']
  }
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signUp } = useAuth();
  const { toast } = useToast();
  
  const [accountType, setAccountType] = useState<AccountType>('enterprise');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your first and last name.',
        variant: 'destructive'
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Missing Email',
        description: 'Please enter your email address.',
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: "Passwords don't match. Please try again.",
        variant: 'destructive'
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: 'Terms Required',
        description: 'You must accept the terms and conditions to continue.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, firstName, lastName, accountType);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Registration Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    } else {
      setRegisteredEmail(email);
      setShowSuccess(true);
    }
  };

  const handleResendEmail = async () => {
    // TODO: Implement resend email functionality
    toast({
      title: 'Email Sent',
      description: 'Confirmation email has been resent.',
    });
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Account Created Successfully!</CardTitle>
            <CardDescription>
              Check your email to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email sent to:</span>
              </div>
              <p className="font-medium">{registeredEmail}</p>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Click the confirmation link in your email</p>
              <p>• Email may take 1-2 minutes to arrive</p>
              <p>• Check your spam folder if you don't see it</p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
              >
                Didn't receive it? Resend email
              </Button>
              
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </button>
      
      <Card className="w-full max-w-5xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Create Your Account</CardTitle>
          <CardDescription>
            Choose your account type and fill in your details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Account Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accountTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.type}
                      className={cn(
                        'cursor-pointer transition-all border-2',
                        accountType === type.type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => setAccountType(type.type)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            accountType === type.type ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-lg">{type.title}</CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {type.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {type.badges.map((badge) => (
                            <span
                              key={badge}
                              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* User Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              {password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        passwordStrength === 'weak' && 'w-1/3 bg-red-500',
                        passwordStrength === 'medium' && 'w-2/3 bg-yellow-500',
                        passwordStrength === 'strong' && 'w-full bg-green-500'
                      )}
                    />
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    passwordStrength === 'weak' && 'text-red-500',
                    passwordStrength === 'medium' && 'text-yellow-500',
                    passwordStrength === 'strong' && 'text-green-500'
                  )}>
                    {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="terms"
                className="text-sm leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-primary"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  Sign in instead
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
