import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DecisionData } from '@/hooks/useDecisions';
import { formatDistanceToNow } from 'date-fns';

interface ReviewsListProps {
  decisions: DecisionData[];
  loading: boolean;
}

const outcomeConfig = {
  approved: { 
    label: 'Approved', 
    variant: 'default' as const,
    icon: <CheckCircle className="h-3 w-3" />
  },
  rejected: { 
    label: 'Rejected', 
    variant: 'destructive' as const,
    icon: <XCircle className="h-3 w-3" />
  },
  approved_with_conditions: { 
    label: 'Approved with Conditions', 
    variant: 'outline' as const,
    icon: <AlertCircle className="h-3 w-3" />
  }
};

export const ReviewsList: React.FC<ReviewsListProps> = ({
  decisions,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review History</h2>
        <p className="text-sm text-muted-foreground">
          {decisions.length} review{decisions.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="grid gap-4">
        {decisions.map((decision) => {
          const config = outcomeConfig[decision.outcome];
          return (
            <Card key={decision.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base">
                      {decision.submission?.title || 'Review Decision'}
                    </CardTitle>
                    {decision.feedback && (
                      <CardDescription className="text-sm">
                        {decision.feedback}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={config.variant} className="ml-4 flex items-center gap-1">
                    {config.icon}
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {decision.conditions && (
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Conditions: </span>
                      <span className="text-muted-foreground">{decision.conditions}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>
                        Reviewed {formatDistanceToNow(new Date(decision.created_at), { addSuffix: true })}
                      </span>
                      {decision.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires {formatDistanceToNow(new Date(decision.expires_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {decisions.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">
              Review decisions and feedback will appear here once submissions are processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};