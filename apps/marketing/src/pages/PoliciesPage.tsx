import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Edit, Archive, Clock, CheckCircle, AlertCircle, FlaskConical } from 'lucide-react';
import { routes } from '@/lib/routes';
import { usePolicies } from '@/hooks/usePolicies';
import { format } from 'date-fns';

const PoliciesPage: React.FC = () => {
  const navigate = useNavigate();
  const { policies, loading } = usePolicies();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Policy Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage AI governance policies for your partners
          </p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => navigate(routes.enterprise.policyStudio())}
          aria-label="Create new policy"
        >
          <Plus className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Active Policies
                </CardTitle>
                <CardDescription>Currently enforced policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Draft Policies
                </CardTitle>
                <CardDescription>Policies in development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Total Policies
                </CardTitle>
                <CardDescription>All policy records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                All Policies
              </CardTitle>
              <CardDescription>
                Manage your AI governance policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policies.length > 0 ? (
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{policy.title}</h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`${routes.enterprise.sandbox}?policy_id=${policy.id}`)}
                          >
                            <FlaskConical className="h-4 w-4 mr-1" />
                            Test
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {policy.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {format(new Date(policy.created_at), 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">No policies found</p>
                  <p className="text-sm">Create your first policy to get started with AI governance.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate(routes.enterprise.policyStudio())}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PoliciesPage;