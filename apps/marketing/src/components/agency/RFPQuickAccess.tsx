import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { routes } from '@/lib/routes';

interface RFPItem {
  id: string;
  distribution_id: string;
  enterprise_name: string;
  policy_name: string;
  version_number: string;
  response_deadline: string;
  urgency: 'overdue' | 'due_soon' | 'new';
  has_draft: boolean;
}

interface RFPQuickAccessProps {
  items: RFPItem[];
}

export const RFPQuickAccess: React.FC<RFPQuickAccessProps> = ({ items }) => {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <Card className="border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Urgent RFP Responses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 3).map((rfp) => {
            const deadline = new Date(rfp.response_deadline);

            return (
              <div
                key={rfp.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-coral flex items-center justify-center text-white font-semibold">
                    {rfp.enterprise_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{rfp.enterprise_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {rfp.policy_name} v{rfp.version_number}
                      </span>
                      <Badge
                        variant={
                          rfp.urgency === 'overdue'
                            ? 'destructive'
                            : rfp.urgency === 'due_soon'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {rfp.urgency === 'overdue'
                          ? 'Overdue'
                          : `Due ${formatDistanceToNow(deadline)}`}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(routes.agency.policyRequestResponse(rfp.distribution_id))}
                  variant={rfp.urgency === 'overdue' ? 'destructive' : 'default'}
                >
                  {rfp.has_draft ? 'Continue' : 'Start Response'}
                </Button>
              </div>
            );
          })}
          {items.length > 3 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(routes.agency.policyRequests)}
            >
              View all {items.length} pending policy requests →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
