import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchGovernanceKPIs, type GovernanceKPIs } from '@/lib/data/governance';

export const AIDigestWidget = () => {
  const [kpis, setKpis] = useState<GovernanceKPIs | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGovernanceKPIs().then(data => {
      setKpis(data);
      setLoading(false);
    });
  }, []);

  if (loading || !kpis) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const weeklyTrend = kpis.approvedToday > 30 ? 'up' : kpis.approvedToday < 20 ? 'down' : 'stable';
  const trendPercent = Math.abs(((kpis.approvedToday - 25) / 25) * 100).toFixed(0);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Governance Summary
              {kpis.metaLoopActive && (
                <Badge variant="outline" className="ml-2 border-primary/30 text-primary">
                  Meta-Loop Active
                </Badge>
              )}
            </CardTitle>
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              🪶 <strong>{kpis.totalEvents} governance events</strong> tracked this period. 
              {kpis.flaggedItems > 0 && (
                <span className="text-destructive"> {kpis.flaggedItems} items flagged for review.</span>
              )}
              {' '}Compliance trend{' '}
              {weeklyTrend === 'up' ? (
                <span className="text-success inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />+{trendPercent}%
                </span>
              ) : weeklyTrend === 'down' ? (
                <span className="text-destructive inline-flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />-{trendPercent}%
                </span>
              ) : (
                <span>stable</span>
              )} this week.
            </motion.p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <CardContent className="pt-0 pb-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-warning">{kpis.pendingReview}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Approved Today</p>
                  <p className="text-2xl font-bold text-success">{kpis.approvedToday}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Flagged Items</p>
                  <p className="text-2xl font-bold text-destructive">{kpis.flaggedItems}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg. AI Confidence</p>
                  <p className="text-2xl font-bold text-primary">{(kpis.avgConfidence * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Mini Sparkline Visualization */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Weekly Activity</p>
                <div className="flex items-end gap-1 h-12">
                  {[45, 52, 48, 61, 58, 67, kpis.approvedToday].map((value, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${(value / 70) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
