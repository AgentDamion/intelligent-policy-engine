import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, GitBranch, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PolicyChange } from '@/hooks/useRequirementsData';

interface PolicyChangeLogProps {
  changes: PolicyChange[];
  loading?: boolean;
}

export const PolicyChangeLog: React.FC<PolicyChangeLogProps> = ({
  changes,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent changes in the last 7 days</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'distributed':
        return <Share className="h-4 w-4" />;
      case 'updated':
        return <GitBranch className="h-4 w-4" />;
      case 'version_created':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getChangeVariant = (type: string) => {
    switch (type) {
      case 'distributed':
        return 'default';
      case 'updated':
        return 'secondary';
      case 'version_created':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Changes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Policy updates from the last 7 days
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {changes.map((change) => (
            <div key={change.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  {getChangeIcon(change.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground leading-5">
                      {change.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {change.clientName}
                      </Badge>
                      <Badge variant={getChangeVariant(change.type)} className="text-xs">
                        {change.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(change.timestamp), { addSuffix: true })}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      v{change.version}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};