import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreRing } from '@/components/ai-acceleration/ScoreRing';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { ReadinessOverviewData } from '@/hooks/useAIReadinessData';

interface ReadinessOverviewProps {
  data: ReadinessOverviewData;
  className?: string;
}

const getReadinessColor = (level: string) => {
  switch (level) {
    case 'foundation': return 'hsl(var(--muted-foreground))';
    case 'developing': return 'hsl(38 92% 50%)';
    case 'advanced': return 'hsl(var(--primary))';
    case 'native': return 'hsl(265 85% 60%)';
    default: return 'hsl(var(--muted-foreground))';
  }
};

const getReadinessBand = (level: string) => {
  switch (level) {
    case 'foundation': return 'blocked' as const;
    case 'developing': return 'cautious' as const;
    case 'advanced': return 'enabled' as const;
    case 'native': return 'native' as const;
    default: return 'blocked' as const;
  }
};

const getReadinessLabel = (level: string) => {
  switch (level) {
    case 'foundation': return 'Foundation';
    case 'developing': return 'Developing';
    case 'advanced': return 'Advanced';
    case 'native': return 'AI Native';
    default: return 'Foundation';
  }
};

export function ReadinessOverview({ data, className }: ReadinessOverviewProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = data.overallScore / 30;
      const counter = setInterval(() => {
        current += increment;
        if (current >= data.overallScore) {
          setAnimatedScore(data.overallScore);
          clearInterval(counter);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, 50);
      return () => clearInterval(counter);
    }, 300);

    return () => clearTimeout(timer);
  }, [data.overallScore]);

  const readinessLevel = getReadinessLabel(data.readinessLevel);
  const criticalDimensions = data.dimensions.filter(d => d.status === 'critical').length;
  const needsWorkDimensions = data.dimensions.filter(d => d.status === 'needs-work').length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <ScoreRing 
              score={animatedScore} 
              band={getReadinessBand(data.readinessLevel)}
              size="large"
            />
            <div className="text-center space-y-1">
              <Badge 
                variant="outline" 
                className="text-sm font-medium"
                style={{ 
                  borderColor: getReadinessColor(data.readinessLevel),
                  color: getReadinessColor(data.readinessLevel)
                }}
              >
                {readinessLevel} Ready
              </Badge>
              <p className="text-xs text-muted-foreground">
                Assessment Completion: {data.completionRate}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Readiness Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{data.completionRate}%</span>
                </div>
                <Progress value={data.completionRate} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Assessment</span>
                </div>
                <p className="text-sm font-medium">
                  {new Date(data.lastAssessment).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Next Recommended Action</p>
                  <p className="text-sm text-muted-foreground">{data.nextRecommendedAction}</p>
                </div>
              </div>

              {(criticalDimensions > 0 || needsWorkDimensions > 0) && (
                <div className="space-y-2">
                  {criticalDimensions > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive font-medium">
                        {criticalDimensions} critical area{criticalDimensions !== 1 ? 's' : ''} need immediate attention
                      </span>
                    </div>
                  )}
                  {needsWorkDimensions > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-warning font-medium">
                        {needsWorkDimensions} area{needsWorkDimensions !== 1 ? 's' : ''} need improvement
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {data.dimensions.filter(d => d.status === 'excellent' || d.status === 'good').length}
                </p>
                <p className="text-xs text-muted-foreground">Strong Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-2xl font-bold">{needsWorkDimensions}</p>
                <p className="text-xs text-muted-foreground">Need Work</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{criticalDimensions}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{data.dimensions.length}</p>
                <p className="text-xs text-muted-foreground">Total Dimensions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}