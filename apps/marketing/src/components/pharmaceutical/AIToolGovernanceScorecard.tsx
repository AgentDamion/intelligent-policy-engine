import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface GovernanceData {
  score: number;
  checks: {
    name: string;
    status: 'passed' | 'warning' | 'failed';
    details: string;
  }[];
}

interface GovernanceScorecardProps {
  data: GovernanceData;
  animate?: boolean;
  className?: string;
}

export const AIToolGovernanceScorecard: React.FC<GovernanceScorecardProps> = ({
  data,
  animate = true,
  className
}) => {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : data.score);

  useEffect(() => {
    if (animate) {
      const duration = 2000;
      const steps = 60;
      const increment = data.score / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= data.score) {
          setDisplayScore(data.score);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [data.score, animate]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: 'passed' | 'warning' | 'failed') => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: 'passed' | 'warning' | 'failed') => {
    const variants = {
      passed: 'default',
      warning: 'secondary',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Tools Governance Score</span>
          <motion.div
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className={`text-2xl font-bold ${getScoreColor(displayScore)}`}
          >
            {displayScore}%
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Governance Maturity</span>
            <span className={getScoreColor(displayScore)}>
              {displayScore >= 80 ? 'Advanced' : displayScore >= 60 ? 'Developing' : 'Foundation'}
            </span>
          </div>
          <div className="relative">
            <Progress value={displayScore} className="h-3" />
            <div
              className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ${getProgressColor(displayScore)}`}
              style={{ width: `${displayScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-red-600">60%</span>
            <span className="text-amber-600">80%</span>
            <span className="text-emerald-600">100%</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Governance Areas</h4>
          {data.checks.map((check, index) => (
            <motion.div
              key={index}
              initial={animate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-lg border bg-background/50"
            >
              {getStatusIcon(check.status)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{check.name}</span>
                  {getStatusBadge(check.status)}
                </div>
                <p className="text-xs text-muted-foreground">{check.details}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};