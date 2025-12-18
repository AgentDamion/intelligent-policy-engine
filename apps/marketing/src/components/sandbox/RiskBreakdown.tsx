import { Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RiskLevel, RiskFactor } from './types/risk';

interface RiskBreakdownProps {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  onClose?: () => void;
}

export const RiskBreakdown = ({ 
  riskScore, 
  riskLevel, 
  factors,
  onClose 
}: RiskBreakdownProps) => {
  const topRecommendation = factors
    .filter(f => f.recommendation && f.score > 0.5)
    .sort((a, b) => b.score - a.score)[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Risk Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Overall: {Math.round(riskScore * 100)}% ({riskLevel})
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {factors.map((factor, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{factor.name}</span>
              <span className="text-muted-foreground">
                {Math.round(factor.score * 100)}%
              </span>
            </div>
            <Progress 
              value={factor.score * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">{factor.description}</p>
          </div>
        ))}
      </div>

      {topRecommendation && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Top Recommendation</span>
          </div>
          <p className="text-sm">{topRecommendation.recommendation}</p>
          <Button size="sm" className="w-full">
            Apply Fix
          </Button>
        </div>
      )}
    </div>
  );
};
