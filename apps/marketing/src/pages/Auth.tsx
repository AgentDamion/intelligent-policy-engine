import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TestTube, Copy, Zap, ArrowLeft } from 'lucide-react';
import { routes } from '@/lib/routes';
import { demoMode } from '@/utils/demoMode';
import { BrandLogo } from '@/components/brand/BrandLogo';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  const [showTestCredentials, setShowTestCredentials] = useState(false);

  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  // Check for intent parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const intent = urlParams.get('intent');
    
    if (intent === 'vendor') {
      // Automatically trigger vendor demo mode
      demoMode.enableWithRole('vendor');
      return;
    }
    
    if (intent === 'admin') {
      // Automatically trigger admin demo mode
      demoMode.enableWithRole('admin');
      return;
    }
    
    // Normal redirect for authenticated users
    if (user) {
      navigate(routes.home);
    }
  }, [user, profile, navigate]);

  // Demo auto-redirect if a role was selected
  useEffect(() => {
    if (demoMode.isEnabled()) {
      const role = demoMode.getDemoRole();
      if (role === 'enterprise') {
        navigate('/dashboard', { replace: true });
      } else if (role === 'partner') {
        navigate('/agency/dashboard', { replace: true });
      } else if (role === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/internal/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signUp(email, password, firstName, lastName);

    if (error) {
      setError(error.message);
    } else {
      setError('');
      setActiveTab('signin');
      // Clear form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    }

    setIsLoading(false);
  };

  const fillTestCredentials = (type: 'enterprise' | 'partner' | 'vendor') => {
    if (type === 'enterprise') {
      setEmail('enterprise.test@aicomplyr.io');
      setPassword('TestPass123!');
      setFirstName('Enterprise');
      setLastName('User');
    } else if (type === 'partner') {
      setEmail('partner.test@aicomplyr.io');
      setPassword('TestPass123!');
      setFirstName('Partner');
      setLastName('Agency');
    } else {
      setEmail('vendor.test@aicomplyr.io');
      setPassword('TestPass123!');
      setFirstName('Vendor');
      setLastName('AI Tools');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDemoEnterprise = () => {
    demoMode.enableWithRole('enterprise');
  };

  const handleDemoAgency = () => {
    demoMode.enableWithRole('partner');
  };

  const handleDemoVendor = () => {
    demoMode.enableWithRole('vendor');
  };

  const handleDemoAdmin = () => {
    demoMode.enableWithRole('admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mb-2">
            <BrandLogo size="large" variant="dark" />
          </Link>
          <CardDescription>Access your compliance platform</CardDescription>
          
          {/* Test Credentials Toggle */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestCredentials(!showTestCredentials)}
              className="gap-2"
            >
              <TestTube className="h-4 w-4" />
              {showTestCredentials ? 'Hide' : 'Show'} Test Credentials
            </Button>
          </div>
          
          {showTestCredentials && (
            <div className="mt-3 p-3 bg-muted rounded-lg text-left space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Quick Test Accounts:</div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <div className="text-sm font-medium">Enterprise User</div>
                    <div className="text-xs text-muted-foreground">enterprise.test@aicomplyr.io</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fillTestCredentials('enterprise')}
                    className="h-8 px-2"
                  >
                    Use
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <div className="text-sm font-medium">Partner/Agency</div>
                    <div className="text-xs text-muted-foreground">partner.test@aicomplyr.io</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fillTestCredentials('partner')}
                    className="h-8 px-2"
                  >
                    Use
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <div className="text-sm font-medium">AI Tool Vendor</div>
                    <div className="text-xs text-muted-foreground">vendor.test@aicomplyr.io</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fillTestCredentials('vendor')}
                    className="h-8 px-2"
                  >
                    Use
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Password for both: TestPass123!
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard('TestPass123!')}
                  className="h-auto p-1 ml-1"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Demo Mode Buttons */}
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Demo Mode</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDemoEnterprise}
                  className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Zap className="h-4 w-4" />
                  Demo as Enterprise User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDemoAgency}
                  className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  <Zap className="h-4 w-4" />
                  Demo as Agency Partner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDemoVendor}
                  className="gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                >
                  <Zap className="h-4 w-4" />
                  Demo as AI Tool Vendor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDemoAdmin}
                  className="gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                >
                  <Zap className="h-4 w-4" />
                  Demo as Admin User
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Skip authentication and go directly to the respective dashboard
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>
                {error}
                {error.includes('email_not_confirmed') && (
                  <div className="mt-2">
                    <div className="space-y-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDemoEnterprise}
                        className="gap-2 mr-2"
                      >
                        <Zap className="h-4 w-4" />
                        Demo Enterprise
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDemoAgency}
                        className="gap-2 mr-2"
                      >
                        <Zap className="h-4 w-4" />
                        Demo Agency
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDemoVendor}
                        className="gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Demo Vendor
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/" className="text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;