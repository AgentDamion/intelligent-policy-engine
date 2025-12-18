import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RiskIntelligenceCardProps {
  workflowId: string;
  onOpenStage?: (stage: 'pre_run' | 'in_run' | 'post_run') => void;
}

export const RiskIntelligenceCard = ({ workflowId, onOpenStage }: RiskIntelligenceCardProps) => {
  const { data: score, isLoading } = useQuery({
    queryKey: ['risk-score', workflowId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-risk-score', {
        body: { workflowId }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
    enabled: !!workflowId
  });

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) return null;

  const getBandConfig = (band: string) => {
    const configs = {
      low: {
        color: 'bg-green-500',
        icon: CheckCircle,
        label: 'LOW RISK',
        textClass: 'text-green-700'
      },
      medium: {
        color: 'bg-yellow-500',
        icon: AlertTriangle,
        label: 'MEDIUM RISK',
        textClass: 'text-yellow-700'
      },
      high: {
        color: 'bg-red-500',
        icon: AlertCircle,
        label: 'HIGH RISK',
        textClass: 'text-red-700'
      }
    };
    return configs[band as keyof typeof configs] || configs.medium;
  };

  const bandConfig = getBandConfig(score.band);
  const Icon = bandConfig.icon;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Risk Intelligence</CardTitle>
          <Badge className={`${bandConfig.color} text-white flex items-center gap-1 px-3 py-1`}>
            <Icon className="h-4 w-4" />
            {bandConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
          <div className="text-5xl font-bold text-primary mb-2">{score.total}</div>
          <p className="text-sm text-muted-foreground font-medium">
            Composite Risk Score (0-100)
          </p>
        </div>

        <div className="space-y-3">
          <StageBar 
            label="Pre-Run (Due Diligence)"
            score={score.pre_run}
            weight={40}
            onClick={() => onOpenStage?.('pre_run')}
          />
          <StageBar 
            label="In-Run (Live Monitoring)"
            score={score.in_run}
            weight={40}
            onClick={() => onOpenStage?.('in_run')}
            allowNegative
          />
          <StageBar 
            label="Post-Run (Audit Outcomes)"
            score={score.post_run}
            weight={20}
            onClick={() => onOpenStage?.('post_run')}
          />
        </div>

        {score.total < 50 && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  VP Approval Required
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Score below 50 requires executive oversight per 21 CFR Part 11 risk management protocols
                </p>
              </div>
            </div>
          </div>
        )}

        {score.total >= 50 && score.total < 75 && (
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Conditional Use – Enhanced Monitoring
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Additional documentation and MLR review required
                </p>
              </div>
            </div>
          </div>
        )}

        {score.total >= 75 && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Standard Use Approved
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Meets pharma compliance standards for production use
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Info className="h-3 w-3" />
          Last calculated: {new Date(score.last_calculated_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};

interface StageBarProps {
  label: string;
  score: number;
  weight: number;
  onClick: () => void;
  allowNegative?: boolean;
}

const StageBar = ({ label, score, weight, onClick, allowNegative }: StageBarProps) => {
  const displayScore = allowNegative ? score : Math.max(0, score);
  const progressValue = allowNegative 
    ? ((score + 50) / 100) * 100
    : score;

  return (
    <div 
      className="cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-all border hover:border-primary/50"
      onClick={onClick}
    >
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="text-right">
          <span className="text-sm font-semibold">{displayScore}/100</span>
          <span className="text-xs text-muted-foreground ml-2">({weight}% weight)</span>
        </div>
      </div>
      <Progress 
        value={Math.max(0, Math.min(100, progressValue))} 
        className="h-2" 
      />
    </div>
  );
};
