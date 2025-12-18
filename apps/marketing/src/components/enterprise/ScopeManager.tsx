import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScopeManagerProps {
  enterpriseId: string;
  onScopeSelect?: (scopeId: string) => void;
}

interface ScopeNode {
  id: string;
  scope_name: string;
  scope_type: string;
  scope_path: string;
  parent_id: string | null;
  metadata: any;
  children: ScopeNode[];
  policyCount?: number;
}

export default function ScopeManager({ enterpriseId, onScopeSelect }: ScopeManagerProps) {
  const [scopeTree, setScopeTree] = useState<ScopeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedScope, setSelectedScope] = useState<ScopeNode | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeType, setNewScopeType] = useState<string>('region');
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadScopeHierarchy();
  }, [enterpriseId]);

  const loadScopeHierarchy = async () => {
    try {
      const { data: scopes } = await supabase
        .from('scopes')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('scope_path');

      if (!scopes) return;

      // Get policy counts for each scope
      const { data: policyCounts } = await supabase
        .from('scoped_policies')
        .select('scope_id')
        .eq('enterprise_id', enterpriseId);

      const countMap = new Map();
      policyCounts?.forEach(p => {
        countMap.set(p.scope_id, (countMap.get(p.scope_id) || 0) + 1);
      });

      // Build tree structure
      const scopeMap = new Map<string, ScopeNode>();
      const rootScopes: ScopeNode[] = [];

      scopes.forEach(scope => {
        const node: ScopeNode = {
          id: scope.id,
          scope_name: scope.scope_name,
          scope_type: scope.scope_type,
          scope_path: scope.scope_path as string,
          parent_id: scope.parent_id,
          metadata: scope.metadata,
          children: [],
          policyCount: countMap.get(scope.id) || 0,
        };
        scopeMap.set(scope.id, node);
      });

      scopes.forEach(scope => {
        const node = scopeMap.get(scope.id)!;
        if (scope.parent_id) {
          const parent = scopeMap.get(scope.parent_id);
          if (parent) parent.children.push(node);
        } else {
          rootScopes.push(node);
        }
      });

      setScopeTree(rootScopes);
    } catch (error) {
      console.error('Error loading scope hierarchy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scope hierarchy',
        variant: 'destructive',
      });
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const createScope = async () => {
    if (!newScopeName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Scope name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const parentPath = selectedScope?.scope_path || enterpriseId;
      const scopePath = `${parentPath}.${newScopeName.toLowerCase().replace(/\s+/g, '_')}`;

      const { error } = await supabase
        .from('scopes')
        .insert({
          scope_name: newScopeName,
          scope_type: newScopeType,
          scope_path: scopePath,
          parent_id: selectedScope?.id || null,
          enterprise_id: enterpriseId,
          metadata: {
            compliance_frameworks: frameworks,
          },
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Scope created successfully',
      });

      setIsAddDialogOpen(false);
      setNewScopeName('');
      setFrameworks([]);
      loadScopeHierarchy();
    } catch (error) {
      console.error('Error creating scope:', error);
      toast({
        title: 'Error',
        description: 'Failed to create scope',
        variant: 'destructive',
      });
    }
  };

  const deleteScope = async (scopeId: string) => {
    try {
      const { error } = await supabase
        .from('scopes')
        .delete()
        .eq('id', scopeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Scope deleted successfully',
      });

      loadScopeHierarchy();
    } catch (error) {
      console.error('Error deleting scope:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scope',
        variant: 'destructive',
      });
    }
  };

  const getScopeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      enterprise: 'bg-purple-500',
      region: 'bg-blue-500',
      country: 'bg-green-500',
      brand: 'bg-orange-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const renderScopeNode = (node: ScopeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }}>
        <div className="flex items-center gap-2 py-2 hover:bg-muted/50 rounded-md px-2">
          <button
            onClick={() => toggleNode(node.id)}
            className="p-1 hover:bg-muted rounded"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          <div
            className="flex items-center gap-2 flex-1 cursor-pointer"
            onClick={() => {
              setSelectedScope(node);
              onScopeSelect?.(node.id);
            }}
          >
            <Badge className={getScopeTypeColor(node.scope_type)}>
              {node.scope_type}
            </Badge>
            <span className="font-medium">{node.scope_name}</span>
            {node.policyCount! > 0 && (
              <Badge variant="outline" className="text-xs">
                {node.policyCount} policies
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedScope(node);
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedScope(node);
                setIsEditDialogOpen(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteScope(node.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderScopeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scope Hierarchy Manager</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedScope(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Root Scope
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>
                  {selectedScope ? `Add Child to ${selectedScope.scope_name}` : 'Add Root Scope'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Scope Name</Label>
                  <Input
                    value={newScopeName}
                    onChange={(e) => setNewScopeName(e.target.value)}
                    placeholder="Enter scope name"
                  />
                </div>
                <div>
                  <Label>Scope Type</Label>
                  <Select value={newScopeType} onValueChange={setNewScopeType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="region">Region</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Compliance Frameworks (comma-separated)</Label>
                  <Input
                    value={frameworks.join(', ')}
                    onChange={(e) => setFrameworks(e.target.value.split(',').map(f => f.trim()))}
                    placeholder="GDPR, HIPAA, SOC2"
                  />
                </div>
                <Button onClick={createScope} className="w-full">
                  Create Scope
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          {scopeTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scopes defined. Create your first scope to get started.
            </div>
          ) : (
            scopeTree.map(node => renderScopeNode(node))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
