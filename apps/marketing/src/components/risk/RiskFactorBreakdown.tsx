import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Calendar, User } from 'lucide-react';

interface RiskFactorBreakdownProps {
  workflowId: string;
  stage: 'pre_run' | 'in_run' | 'post_run';
  open: boolean;
  onClose: () => void;
}

export const RiskFactorBreakdown = ({ workflowId, stage, open, onClose }: RiskFactorBreakdownProps) => {
  const { data: factors, isLoading } = useQuery({
    queryKey: ['risk-factors', workflowId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-risk-factors', {
        body: { workflowId }
      });
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const getStageName = (s: string) => {
    const names = {
      pre_run: 'Pre-Run Due Diligence',
      in_run: 'In-Run Live Monitoring',
      post_run: 'Post-Run Audit Outcomes'
    };
    return names[s as keyof typeof names] || s;
  };

  const stageData = factors?.[stage === 'pre_run' ? 'pre' : stage === 'in_run' ? 'in' : 'post'] || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">{getStageName(stage)}</SheetTitle>
          <SheetDescription>
            Contributing factors and evidence for this stage
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && stageData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">No data yet for this stage</p>
            <p className="text-sm mt-1">Factors will appear as they are assessed</p>
          </div>
        )}

        <div className="space-y-4">
          {stageData.map((factor: any, idx: number) => (
            <FactorCard key={idx} factor={factor} stage={stage} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface FactorCardProps {
  factor: any;
  stage: string;
}

const FactorCard = ({ factor, stage }: FactorCardProps) => {
  const getPoints = () => {
    if (stage === 'pre_run') return factor.points * (factor.weight || 1);
    if (stage === 'in_run') return factor.delta_points;
    return factor.points;
  };

  const points = getPoints();
  const isPositive = points > 0;

  const getFactorName = () => {
    if (stage === 'pre_run') return factor.control_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    if (stage === 'in_run') return factor.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return factor.outcome_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getTimestamp = () => {
    if (stage === 'pre_run') return factor.created_at;
    if (stage === 'in_run') return factor.occurred_at;
    return factor.recorded_at;
  };

  return (
    <div className="p-4 border-2 rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{getFactorName()}</h4>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {getTimestamp() && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(getTimestamp()).toLocaleString()}
              </div>
            )}
            {(factor.triggered_by || factor.recorded_by) && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                User ID: {(factor.triggered_by || factor.recorded_by).slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
        <Badge 
          variant={isPositive ? 'default' : 'destructive'}
          className="ml-3 px-3 py-1 font-mono"
        >
          {isPositive ? '+' : ''}{points} pts
        </Badge>
      </div>

      {(factor.metadata || factor.payload || factor.details) && (
        <div className="mt-3">
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium mb-2">
              View Details
            </summary>
            <pre className="bg-muted p-3 rounded overflow-x-auto text-xs font-mono">
              {JSON.stringify(factor.metadata || factor.payload || factor.details, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {factor.evidence_url && (
        <a 
          href={factor.evidence_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View Evidence Document
        </a>
      )}
    </div>
  );
};
