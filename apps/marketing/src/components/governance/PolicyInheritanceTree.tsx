import { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, FileText, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PolicyTreeNode, PolicyInheritanceMode } from '@/types/policy-inheritance';
import { PolicyInheritanceService } from '@/lib/governance/policyInheritanceService';

interface PolicyInheritanceTreeProps {
  enterpriseId: string;
  onViewPolicy?: (policyId: string) => void;
  onViewEffectivePolicy?: (scopeId: string) => void;
  refreshTrigger?: number;
}

const inheritanceModeColors: Record<PolicyInheritanceMode, string> = {
  replace: 'bg-destructive/10 text-destructive border-destructive',
  merge: 'bg-warning/10 text-warning border-warning',
  append: 'bg-success/10 text-success border-success'
};

const inheritanceModeIcons: Record<PolicyInheritanceMode, string> = {
  replace: '🔴',
  merge: '🟡',
  append: '🟢'
};

export function PolicyInheritanceTree({ 
  enterpriseId, 
  onViewPolicy,
  onViewEffectivePolicy,
  refreshTrigger
}: PolicyInheritanceTreeProps) {
  const [tree, setTree] = useState<PolicyTreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTree();
  }, [enterpriseId, refreshTrigger]);

  const loadTree = async () => {
    setLoading(true);
    const data = await PolicyInheritanceService.getPolicyInheritanceTree(enterpriseId);
    setTree(data);
    // Auto-expand root level
    setExpandedNodes(new Set(data.map(n => n.policy.id)));
    setLoading(false);
  };

  const toggleNode = (policyId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(policyId)) {
        next.delete(policyId);
      } else {
        next.add(policyId);
      }
      return next;
    });
  };

  const renderPolicyNode = (node: PolicyTreeNode, level: number = 0) => {
    const { policy, children, hasConflicts } = node;
    const isExpanded = expandedNodes.has(policy.id);
    const hasChildren = children && children.length > 0;

    return (
      <div key={policy.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-3 py-3 px-4 rounded-lg border border-border bg-card",
            "hover:bg-accent/50 transition-colors",
            hasConflicts && "border-destructive/50"
          )}
          style={{ marginLeft: `${level * 2}rem` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(policy.id)}
              className="p-1 hover:bg-background/50 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="font-medium truncate">{policy.policy_name}</span>
              
              <Badge 
                variant="outline" 
                className={cn("text-xs", inheritanceModeColors[policy.inheritance_mode])}
              >
                {inheritanceModeIcons[policy.inheritance_mode]} {policy.inheritance_mode}
              </Badge>

              {hasConflicts && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {policy.conflict_count || 0} conflicts
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{policy.scope_name}</span>
              <span>•</span>
              <span className="capitalize">{policy.scope_type}</span>
              {level > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Inherits from parent
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {onViewEffectivePolicy && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewEffectivePolicy(policy.scope_id)}
              >
                View Effective
              </Button>
            )}
            {onViewPolicy && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewPolicy(policy.id)}
              >
                Details
              </Button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 relative before:absolute before:left-8 before:top-0 before:bottom-0 before:w-px before:bg-border">
            {children.map(child => renderPolicyNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Policy Inheritance Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
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
          <GitBranch className="h-5 w-5" />
          Policy Inheritance Tree
        </CardTitle>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span>{inheritanceModeIcons.replace}</span>
            <span className="text-muted-foreground">Replace</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{inheritanceModeIcons.merge}</span>
            <span className="text-muted-foreground">Merge</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{inheritanceModeIcons.append}</span>
            <span className="text-muted-foreground">Append</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-4 space-y-3">
            {tree.length > 0 ? (
              tree.map(node => renderPolicyNode(node))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No policies found</p>
                <p className="text-sm mt-1">Create a policy to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
