import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Store, Loader2 } from 'lucide-react';
import TermsAcceptance from '@/components/auth/TermsAcceptance';

const RoleSelector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'enterprise' | 'partner' | 'vendor' | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const { updateProfile } = useAuth();

  const handleRoleSelection = async (role: 'enterprise' | 'partner' | 'vendor') => {
    setSelectedRole(role);
    setShowTerms(true);
  };

  const handleTermsAccept = async () => {
    if (!selectedRole) return;
    
    setIsLoading(true);
    await updateProfile({ account_type: selectedRole });
    setIsLoading(false);
  };

  if (showTerms) {
    return <TermsAcceptance onAccept={handleTermsAccept} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you'll be using AI Comply to get the right experience
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-lg">Enterprise</CardTitle>
              <CardDescription>
                Manage AI compliance across your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Policy Management</Badge>
                <Badge variant="secondary">Decision Tracking</Badge>
                <Badge variant="secondary">Audit Trails</Badge>
                <Badge variant="secondary">Analytics</Badge>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleRoleSelection('enterprise')}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Choose Enterprise
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <Users className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-lg">Partner/Agency</CardTitle>
              <CardDescription>
                Track AI tools and submit for compliance review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Project Management</Badge>
                <Badge variant="secondary">AI Tool Tracking</Badge>
                <Badge variant="secondary">Compliance Submissions</Badge>
                <Badge variant="secondary">Client Collaboration</Badge>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleRoleSelection('partner')}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Choose Partner
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <Store className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-lg">AI Tool Vendor</CardTitle>
              <CardDescription>
                List and promote your AI tools in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Tool Listings</Badge>
                <Badge variant="secondary">Promotion Management</Badge>
                <Badge variant="secondary">Analytics Dashboard</Badge>
                <Badge variant="secondary">Vendor Portal</Badge>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleRoleSelection('vendor')}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Choose Vendor
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelector;