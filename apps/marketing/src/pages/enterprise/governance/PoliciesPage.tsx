import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Shield, Edit, Archive, Search, Filter } from 'lucide-react';
import { routes } from '@/lib/routes';
import { usePolicies } from '@/hooks/usePolicies';
import { format } from 'date-fns';

const PoliciesPage: React.FC = () => {
  const navigate = useNavigate();
  const { policies, loading } = usePolicies();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPolicies = policies.filter(policy =>
    policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Governance Policies</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI governance policies and compliance frameworks
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Policy Library</CardTitle>
              <CardDescription>Search and filter governance policies</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredPolicies.length > 0 ? (
            <div className="space-y-4">
              {filteredPolicies.map((policy) => (
                <div key={policy.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{policy.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {policy.description || "No description provided"}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(routes.enterprise.policyStudio(policy.id))}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Created: {format(new Date(policy.created_at), 'MMM dd, yyyy')}</span>
                    <span>•</span>
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">
                {searchQuery ? 'No policies found' : 'No policies yet'}
              </p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Create your first policy to get started with AI governance'
                }
              </p>
              {!searchQuery && (
                <Button 
                  className="mt-4" 
                  onClick={() => navigate(routes.enterprise.policyStudio())}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Policy
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PoliciesPage;
