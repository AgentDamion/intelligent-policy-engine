import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Building2, Folder, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PolicyRequirement } from '@/hooks/useRequirementsData';

interface PolicyRequirementsListProps {
  requirements: PolicyRequirement[];
  loading?: boolean;
}

export const PolicyRequirementsList: React.FC<PolicyRequirementsListProps> = ({
  requirements,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No active policies found for your workspaces</p>
        </CardContent>
      </Card>
    );
  }

  const groupedRequirements = requirements.reduce((acc, req) => {
    const key = `${req.clientName} - ${req.workspaceName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(req);
    return acc;
  }, {} as Record<string, PolicyRequirement[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedRequirements).map(([workspaceKey, policies]) => (
        <div key={workspaceKey} className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{workspaceKey}</span>
            <Badge variant="secondary" className="text-xs">
              {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {policies.map((requirement) => (
              <PolicyRequirementCard key={requirement.id} requirement={requirement} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface PolicyRequirementCardProps {
  requirement: PolicyRequirement;
}

const PolicyRequirementCard: React.FC<PolicyRequirementCardProps> = ({ requirement }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {requirement.title}
              {requirement.isNewUpdate && (
                <Badge variant="destructive" className="text-xs">
                  Updated
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {requirement.description}
            </p>
          </div>
          <Badge variant={getStatusVariant(requirement.status)} className="text-xs">
            v{requirement.version}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              <span>{requirement.workspaceName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(new Date(requirement.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <Badge variant="outline" className="text-xs">
            {requirement.status}
          </Badge>
        </div>
        
        {Object.keys(requirement.rules).length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {Object.entries(requirement.rules).slice(0, 3).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value).slice(0, 20)}
                </Badge>
              ))}
              {Object.keys(requirement.rules).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{Object.keys(requirement.rules).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};