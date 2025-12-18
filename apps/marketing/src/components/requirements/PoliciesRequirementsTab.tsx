import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, FileText, Star } from 'lucide-react';
import { useRequirementsData } from '@/hooks/useRequirementsData';

interface PoliciesRequirementsTabProps {
  clientId?: string;
}

export const PoliciesRequirementsTab = ({ clientId }: PoliciesRequirementsTabProps) => {
  const { requirements, loading } = useRequirementsData();

  // Filter requirements by client if provided
  const filteredRequirements = clientId 
    ? requirements.filter(req => req.enterpriseId === clientId)
    : requirements;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'draft': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'draft': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  // Find most recent policy
  const mostRecentPolicy = filteredRequirements
    .sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime())[0];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Most Recent Policy Highlight */}
      {mostRecentPolicy && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Most Recent Update</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{mostRecentPolicy.title}</h3>
                <p className="text-muted-foreground text-sm">{mostRecentPolicy.description}</p>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline">v{mostRecentPolicy.version}</Badge>
                  <span className="text-muted-foreground">
                    Updated {new Date(mostRecentPolicy.distributedAt).toLocaleDateString()}
                  </span>
                  {mostRecentPolicy.rules.complianceFrameworks && (
                    <span className="text-muted-foreground">
                      • {mostRecentPolicy.rules.complianceFrameworks.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(mostRecentPolicy.status)}>
                {getStatusIcon(mostRecentPolicy.status)}
                <span className="ml-1 capitalize">{mostRecentPolicy.status}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Policies List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Active Policies</h3>
        <div className="space-y-3">
          {filteredRequirements.map((requirement) => (
            <Card key={requirement.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{requirement.title}</h4>
                      {requirement.isNewUpdate && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{requirement.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>v{requirement.version}</span>
                      <span>•</span>
                      <span>{new Date(requirement.distributedAt).toLocaleDateString()}</span>
                      {requirement.rules.complianceFrameworks && (
                        <>
                          <span>•</span>
                          <span>{requirement.rules.complianceFrameworks.join(', ')}</span>
                        </>
                      )}
                    </div>

                    {/* Policy Tags */}
                    <div className="flex items-center gap-2">
                      {requirement.rules.requiresApproval && (
                        <Badge variant="outline" className="text-xs">Requires Approval</Badge>
                      )}
                      {requirement.rules.maxRiskLevel && (
                        <Badge variant="outline" className="text-xs">
                          Max Risk: {requirement.rules.maxRiskLevel}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Badge className={getStatusColor(requirement.status)}>
                    {getStatusIcon(requirement.status)}
                    <span className="ml-1 capitalize">{requirement.status}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredRequirements.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Policies Found</h3>
            <p className="text-muted-foreground">
              No policies have been distributed to this workspace yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};