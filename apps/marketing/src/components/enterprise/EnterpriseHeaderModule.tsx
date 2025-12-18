import React from 'react';
import { Plus, TrendingUp, Users, Package, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useClientContext, ClientContext } from '@/hooks/useClientContext';

interface PortfolioStats {
  riskScore: number;
  totalTools: number;
  totalPartners: number;
  documentationRate: number;
}

interface EnterpriseHeaderModuleProps {
  stats?: PortfolioStats;
  onAddPartner?: () => void;
  onNewPolicy?: () => void;
  className?: string;
  clientContext?: ClientContext | null;
}

const defaultStats: PortfolioStats = {
  riskScore: 93,
  totalTools: 42,
  totalPartners: 8,
  documentationRate: 93
};

export function EnterpriseHeaderModule({ 
  stats = defaultStats, 
  onAddPartner,
  onNewPolicy,
  className,
  clientContext
}: EnterpriseHeaderModuleProps) {
  const { selectedContext } = useClientContext();
  const activeContext = clientContext || selectedContext;
  const getRiskScoreColor = (score: number) => {
    if (score >= 90) return 'text-brand-green';
    if (score >= 70) return 'text-brand-orange';
    return 'text-destructive';
  };

  const getRiskScoreBg = (score: number) => {
    if (score >= 90) return 'bg-brand-green/10 border-brand-green/20';
    if (score >= 70) return 'bg-brand-orange/10 border-brand-orange/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  return (
    <Card className={cn(
      "border-0 bg-gradient-to-r from-background via-card to-background",
      "shadow-lg shadow-primary/5 border border-border/50",
      className
    )}>
      <div className="p-6">
        {/* Header Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground font-brand">
                  {activeContext?.clientName || 'Enterprise Client'} Dashboard
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{activeContext?.workspaceName || 'Workspace'}</span>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeContext ? 'Connected' : 'No Context'}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              AI governance oversight for {activeContext?.clientName || 'this enterprise client'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddPartner}
              className="gap-2 hover:bg-primary/5 hover:border-primary/30"
            >
              <Plus className="h-4 w-4" />
              Add Partner
            </Button>
            <Button 
              size="sm"
              onClick={onNewPolicy}
              className="gap-2 bg-gradient-to-r from-brand-teal to-brand-coral hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Policy
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Portfolio Risk Score */}
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-lg border",
            getRiskScoreBg(stats.riskScore)
          )}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/50">
              <TrendingUp className={cn("h-6 w-6", getRiskScoreColor(stats.riskScore))} />
            </div>
            <div>
              <div className={cn("text-3xl font-bold font-brand", getRiskScoreColor(stats.riskScore))}>
                {stats.riskScore}%
              </div>
              <div className="text-sm text-muted-foreground">Portfolio Risk Score</div>
            </div>
          </div>

          {/* Total Tools */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary font-brand">
                {activeContext?.toolsCount || stats.totalTools}
              </div>
              <div className="text-sm text-muted-foreground">AI Tools</div>
            </div>
          </div>

          {/* Total Partners */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary font-brand">{stats.totalPartners}</div>
              <div className="text-sm text-muted-foreground">Partners</div>
            </div>
          </div>

          {/* Compliance Score */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-green/5 border border-brand-green/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-green/10">
              <CheckCircle className="h-6 w-6 text-brand-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-green font-brand">
                {activeContext?.complianceReadiness || stats.documentationRate}%
              </div>
              <div className="text-sm text-muted-foreground">Compliance Ready</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}