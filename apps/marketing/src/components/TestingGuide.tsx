import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Settings, Users, Database } from 'lucide-react';

export const TestingGuide = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Testing Setup Guide
          </CardTitle>
          <CardDescription>
            Complete these steps to ensure smooth user testing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Supabase Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand-teal/10">Step 1</Badge>
              <h3 className="font-semibold">Disable Email Confirmation (Recommended)</h3>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Important:</strong> For seamless testing, disable email confirmation in Supabase:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to Supabase Dashboard → Authentication → Settings</li>
                    <li>Find "Confirm email" setting</li>
                    <li>Turn it OFF for testing environment</li>
                    <li>Save changes</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    This allows users to immediately access the platform after signup without email verification.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 2: Test Flow */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand-teal/10">Step 2</Badge>
              <h3 className="font-semibold">Test User Flow</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Enterprise User Flow
                </h4>
                <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Sign up with test credentials</li>
                  <li>Select "Enterprise" role</li>
                  <li>Auto-assigned to Acme Pharmaceuticals</li>
                  <li>Access enterprise dashboard with sample data</li>
                  <li>View AI decisions, policies, and analytics</li>
                </ol>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Partner/Agency Flow
                </h4>
                <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Sign up with test credentials</li>
                  <li>Select "Partner/Agency" role</li>
                  <li>Auto-assigned to Digital Health Agency</li>
                  <li>Access agency dashboard with sample projects</li>
                  <li>View submissions, conflicts, and performance</li>
                </ol>
              </Card>
            </div>
          </div>

          {/* Step 3: Pre-populated Data */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand-teal/10">Step 3</Badge>
              <h3 className="font-semibold">Pre-populated Sample Data</h3>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Enterprise & workspace assignments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>AI agent decisions & activities</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sample projects & submissions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Compliance policies & frameworks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Performance metrics & analytics</span>
              </div>
            </div>
          </div>

          {/* Step 4: Testing Tips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand-teal/10">Step 4</Badge>
              <h3 className="font-semibold">Testing Tips</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Use the test credentials provided on the auth page for quick access</p>
              <p>• Test both enterprise and partner flows to see different dashboard experiences</p>
              <p>• Role-based routing automatically redirects users to correct dashboards</p>
              <p>• All sample data is realistic and demonstrates actual platform capabilities</p>
              <p>• Test authentication flow, role selection, and dashboard navigation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};