import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Info, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { EffectivePolicy, ScopeType } from '@/types/policy-inheritance';
import { PolicyInheritanceService } from '@/lib/governance/policyInheritanceService';
import { formatDistanceToNow } from 'date-fns';

interface EffectivePolicyViewerProps {
  scopeId: string;
  refreshTrigger?: number;
}

const scopeColors: Record<string, string> = {
  enterprise: 'bg-blue-500/10 text-blue-500',
  region: 'bg-green-500/10 text-green-500',
  country: 'bg-orange-500/10 text-orange-500',
  brand: 'bg-purple-500/10 text-purple-500'
};

export function EffectivePolicyViewer({ scopeId, refreshTrigger }: EffectivePolicyViewerProps) {
  const [effectivePolicy, setEffectivePolicy] = useState<EffectivePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEffectivePolicy();
  }, [scopeId, refreshTrigger]);

  const loadEffectivePolicy = async () => {
    setLoading(true);
    const data = await PolicyInheritanceService.getEffectivePolicy(scopeId);
    setEffectivePolicy(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEffectivePolicy();
    setRefreshing(false);
  };

  const renderRuleWithProvenance = (key: string, value: any) => {
    const provenance = effectivePolicy?.rule_provenance[key];
    
    return (
      <div key={key} className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{key}</span>
              {provenance && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-medium">Source: </span>
                          <span>{provenance.source_scope_path}</span>
                        </div>
                        <div>
                          <span className="font-medium">Type: </span>
                          <span className="capitalize">{provenance.source_scope_type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Mode: </span>
                          <span className="capitalize">{provenance.inheritance_mode}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="mt-1">
              <code className="text-xs p-2 bg-muted rounded block overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </code>
            </div>
          </div>
          {provenance && (
            <Badge 
              variant="outline" 
              className={cn("shrink-0", scopeColors[provenance.source_scope_type] || 'bg-muted')}
            >
              {provenance.source_scope_type}
            </Badge>
          )}
        </div>
        <Separator />
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Effective Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!effectivePolicy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Effective Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No effective policy computed</p>
            <p className="text-sm mt-1">Select a scope to view its effective policy</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Effective Policy
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {effectivePolicy.scope_path}
              </code>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
        
        {effectivePolicy.computed_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>
              Computed {formatDistanceToNow(new Date(effectivePolicy.computed_at), { addSuffix: true })}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Contributing Policies</h4>
              <div className="flex flex-wrap gap-2">
                {effectivePolicy.contributing_policies.map((policy, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-2">
                    <span className="font-mono text-xs">{policy.scope_path}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-xs capitalize">{policy.inheritance_mode}</span>
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Effective Rules</h4>
              {Object.entries(effectivePolicy.effective_rules).map(([key, value]) =>
                renderRuleWithProvenance(key, value)
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
