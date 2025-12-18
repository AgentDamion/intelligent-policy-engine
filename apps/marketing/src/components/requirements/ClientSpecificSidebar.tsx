import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRequirementsData } from '@/hooks/useRequirementsData';
import { ClientContext } from '@/hooks/useClientContext';

interface ClientSpecificSidebarProps {
  context: ClientContext | null;
}

export const ClientSpecificSidebar = ({ context }: ClientSpecificSidebarProps) => {
  const { recentChanges, loading } = useRequirementsData();

  // Filter changes for the selected client
  const clientChanges = context 
    ? recentChanges.filter(change => change.clientName === context.clientName)
    : recentChanges;

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'distributed': return <FileText className="h-4 w-4 text-primary" />;
      case 'updated': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'version_created': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'distributed': return 'bg-primary/10 text-primary border-primary/20';
      case 'updated': return 'bg-success/10 text-success border-success/20';
      case 'version_created': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Changes
        </CardTitle>
        {context && (
          <p className="text-xs text-muted-foreground">
            Updates for {context.clientName}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : clientChanges.length > 0 ? (
          <div className="space-y-4">
            {clientChanges.slice(0, 8).map((change) => (
              <div key={change.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getChangeIcon(change.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-tight">
                      {change.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className={getChangeColor(change.type)} variant="outline">
                        {change.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        v{change.version}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(change.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No recent changes
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Updates will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};