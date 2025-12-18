import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Shield,
  Users,
  Heart,
  Cog,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MaturityDimension } from '@/hooks/useAIReadinessData';

interface MaturityDimensionsProps {
  dimensions: MaturityDimension[];
  onDimensionClick?: (dimensionId: string) => void;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'good': return <CheckCircle className="h-4 w-4 text-primary" />;
    case 'needs-work': return <Clock className="h-4 w-4 text-warning" />;
    case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'hsl(142 76% 36%)';
    case 'good': return 'hsl(var(--primary))';
    case 'needs-work': return 'hsl(38 92% 50%)';
    case 'critical': return 'hsl(var(--destructive))';
    default: return 'hsl(var(--muted-foreground))';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'excellent': return <Badge variant="outline" className="text-success border-success">Excellent</Badge>;
    case 'good': return <Badge variant="outline" className="text-primary border-primary">Good</Badge>;
    case 'needs-work': return <Badge variant="outline" className="text-warning border-warning">Needs Work</Badge>;
    case 'critical': return <Badge variant="destructive">Critical</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const getDimensionIcon = (id: string) => {
  switch (id) {
    case 'governance': return <Shield className="h-5 w-5" />;
    case 'technical': return <Cog className="h-5 w-5" />;
    case 'human-capital': return <Users className="h-5 w-5" />;
    case 'cultural': return <Heart className="h-5 w-5" />;
    case 'operational': return <TrendingUp className="h-5 w-5" />;
    case 'business-integration': return <Target className="h-5 w-5" />;
    default: return <CheckCircle className="h-5 w-5" />;
  }
};

export function MaturityDimensions({ 
  dimensions, 
  onDimensionClick,
  className 
}: MaturityDimensionsProps) {
  // Sort dimensions by status priority (critical first, then by score)
  const sortedDimensions = [...dimensions].sort((a, b) => {
    const statusPriority = { critical: 4, 'needs-work': 3, good: 2, excellent: 1 };
    const aPriority = statusPriority[a.status] || 0;
    const bPriority = statusPriority[b.status] || 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    return a.score - b.score;
  });

  return (
    <div className={cn('space-y-4', className)}>
      {sortedDimensions.map((dimension, index) => (
        <Card 
          key={dimension.id} 
          className={cn(
            'transition-all duration-200 hover:shadow-md',
            onDimensionClick && 'cursor-pointer hover:shadow-lg'
          )}
          onClick={() => onDimensionClick?.(dimension.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1" style={{ color: getStatusColor(dimension.status) }}>
                  {getDimensionIcon(dimension.id)}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{dimension.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{dimension.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(dimension.status)}
                {onDimensionClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Score</span>
                <span className="font-bold">{dimension.score}/{dimension.maxScore}</span>
              </div>
              <Progress 
                value={(dimension.score / dimension.maxScore) * 100} 
                className="h-2"
                style={{
                  '--progress-background': getStatusColor(dimension.status)
                } as React.CSSProperties}
              />
            </div>

            {/* Key Areas Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Key Areas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dimension.keyAreas.map((area) => (
                  <div 
                    key={area.name}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(area.status)}
                      <span className="text-sm font-medium truncate">{area.name}</span>
                    </div>
                    <span className="text-sm font-bold ml-2">{area.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Recommendations */}
            {dimension.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Top Recommendations</h4>
                <div className="space-y-1">
                  {dimension.recommendations.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </div>
                  ))}
                  {dimension.recommendations.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDimensionClick?.(dimension.id);
                      }}
                    >
                      +{dimension.recommendations.length - 2} more recommendations
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}