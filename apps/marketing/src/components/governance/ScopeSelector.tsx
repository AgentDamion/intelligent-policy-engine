import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Building2, Globe2, MapPin, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Scope, ScopeType } from '@/types/policy-inheritance';
import { PolicyInheritanceService } from '@/lib/governance/policyInheritanceService';

interface ScopeSelectorProps {
  enterpriseId: string;
  selectedScopeId?: string;
  onSelectScope: (scope: Scope) => void;
}

const scopeIcons: Record<ScopeType, any> = {
  enterprise: Building2,
  region: Globe2,
  country: MapPin,
  brand: Tag
};

const scopeColors: Record<ScopeType, string> = {
  enterprise: 'bg-primary/10 text-primary',
  region: 'bg-accent/10 text-accent-foreground',
  country: 'bg-secondary/10 text-secondary-foreground',
  brand: 'bg-muted text-muted-foreground'
};

export function ScopeSelector({ enterpriseId, selectedScopeId, onSelectScope }: ScopeSelectorProps) {
  const [hierarchy, setHierarchy] = useState<Scope | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [policyCounts, setPolicyCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHierarchy();
  }, [enterpriseId]);

  const loadHierarchy = async () => {
    setLoading(true);
    const data = await PolicyInheritanceService.getScopeHierarchy(enterpriseId);
    if (data) {
      setHierarchy(data.tree);
      // Auto-expand enterprise level
      setExpandedNodes(new Set([data.tree.id]));
      // Load policy counts
      await loadPolicyCounts(data.tree);
    }
    setLoading(false);
  };

  const loadPolicyCounts = async (scope: Scope) => {
    const count = await PolicyInheritanceService.getPolicyCountByScope(scope.id);
    setPolicyCounts(prev => new Map(prev).set(scope.id, count));
    
    if (scope.children) {
      for (const child of scope.children) {
        await loadPolicyCounts(child);
      }
    }
  };

  const toggleNode = (scopeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(scopeId)) {
        next.delete(scopeId);
      } else {
        next.add(scopeId);
      }
      return next;
    });
  };

  const getBreadcrumb = (scope: Scope): string[] => {
    const path = String(scope.scope_path || '').split('.');
    return path.filter(Boolean);
  };

  const renderScopeNode = (scope: Scope, level: number = 0) => {
    const Icon = scopeIcons[scope.scope_type];
    const isExpanded = expandedNodes.has(scope.id);
    const isSelected = selectedScopeId === scope.id;
    const hasChildren = scope.children && scope.children.length > 0;
    const policyCount = policyCounts.get(scope.id) || 0;

    return (
      <div key={scope.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent/50",
            isSelected && "bg-accent text-accent-foreground font-medium"
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
          onClick={() => onSelectScope(scope)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(scope.id);
              }}
              className="p-0.5 hover:bg-background/50 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <Icon className="h-4 w-4 shrink-0" />
          
          <span className="flex-1 truncate">{scope.name}</span>
          
          <Badge variant="secondary" className={cn("text-xs", scopeColors[scope.scope_type])}>
            {scope.scope_type}
          </Badge>
          
          {policyCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {policyCount} {policyCount === 1 ? 'policy' : 'policies'}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {scope.children!.map(child => renderScopeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scope Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Scope Hierarchy
        </CardTitle>
        {selectedScopeId && hierarchy && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {getBreadcrumb(hierarchy).map((segment, idx, arr) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 bg-muted rounded">
                    {segment}
                  </span>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-4 space-y-1">
            {hierarchy ? renderScopeNode(hierarchy) : (
              <div className="text-center text-muted-foreground py-8">
                No scope hierarchy found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
