import { useState, useEffect } from 'react';
import { Network, AlertTriangle, Plus, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScopeSelector } from '@/components/governance/ScopeSelector';
import { PolicyInheritanceTree } from '@/components/governance/PolicyInheritanceTree';
import { ConflictResolutionPanel } from '@/components/governance/ConflictResolutionPanel';
import { EffectivePolicyViewer } from '@/components/governance/EffectivePolicyViewer';
import { CreatePolicyDialog } from '@/components/governance/CreatePolicyDialog';
import type { Scope, PolicyConflict } from '@/types/policy-inheritance';
import { PolicyInheritanceService } from '@/lib/governance/policyInheritanceService';
import { insertSamplePolicyInheritanceData } from '@/utils/samplePolicyInheritanceData';
import { supabase } from '@/integrations/supabase/client';

export default function PolicyHierarchy() {
  const [enterpriseId, setEnterpriseId] = useState<string | null>(null);
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);
  const [conflicts, setConflicts] = useState<PolicyConflict[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadUserEnterprise();
  }, []);

  useEffect(() => {
    if (selectedScope) {
      loadScopeConflicts();
    }
  }, [selectedScope]);

  const loadUserEnterprise = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Try enterprise_members first
      const { data: membership, error: memberError } = await supabase
        .from('enterprise_members')
        .select('enterprise_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership?.enterprise_id) {
        setEnterpriseId(membership.enterprise_id);
        setLoading(false);
        return;
      }

      // Fallback to user_roles if enterprise_members fails
      console.log('No enterprise_members found, trying user_roles fallback');
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('enterprise_id')
        .eq('user_id', user.id)
        .not('enterprise_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (roleData?.enterprise_id) {
        setEnterpriseId(roleData.enterprise_id);
      } else {
        console.error('No enterprise access found:', { memberError, roleError });
      }
    } catch (error) {
      console.error('Error loading user enterprise:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScopeConflicts = async () => {
    if (!selectedScope) return;

    // Load conflicts for policies in this scope
    const { data } = await supabase
      .from('policy_conflicts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const mappedConflicts: PolicyConflict[] = data.map((c: any) => ({
        id: c.id,
        policy_id: c.child_policy_id,
        parent_policy_id: c.parent_policy_id,
        conflict_type: c.conflict_type,
        severity: c.severity,
        conflicting_rule: c.field_path,
        parent_value: c.parent_value,
        child_value: c.child_value,
        description: 'Policy conflict detected',
        resolution_status: c.resolved_at ? 'resolved' : 'unresolved',
        resolved_at: c.resolved_at,
        resolved_by: c.resolved_by,
        resolution_notes: c.resolution_notes,
        created_at: c.created_at
      }));
      
      setConflicts(mappedConflicts);
      setConflictCount(mappedConflicts.filter(c => c.resolution_status === 'unresolved').length);
    }
  };

  const handleLoadSampleData = async () => {
    setIsLoadingSampleData(true);
    const success = await insertSamplePolicyInheritanceData();
    if (success) {
      await loadUserEnterprise();
      setRefreshTrigger(prev => prev + 1);
    }
    setIsLoadingSampleData(false);
  };

  const handlePolicyCreated = () => {
    loadScopeConflicts();
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!enterpriseId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Enterprise Access</CardTitle>
            <CardDescription>
              You need to be part of an enterprise to view policy hierarchies
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="h-8 w-8" />
            Policy Inheritance Hierarchy
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage policy inheritance across organizational scopes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleLoadSampleData}
            disabled={isLoadingSampleData}
          >
            <Database className="h-4 w-4 mr-2" />
            {isLoadingSampleData ? 'Loading...' : 'Load Sample Data'}
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            disabled={!selectedScope}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
          {conflictCount > 0 && (
            <Badge variant="destructive" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {conflictCount} Unresolved Conflicts
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Scope Selector */}
        <div className="col-span-12 lg:col-span-3">
          <ScopeSelector
            enterpriseId={enterpriseId}
            selectedScopeId={selectedScope?.id}
            onSelectScope={setSelectedScope}
          />
        </div>

        {/* Center Panel - Tabs */}
        <div className="col-span-12 lg:col-span-6">
          <Tabs defaultValue="tree" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tree">Inheritance Tree</TabsTrigger>
              <TabsTrigger value="effective">
                Effective Policy
              </TabsTrigger>
              <TabsTrigger value="conflicts">
                Conflicts
                {conflictCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {conflictCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="space-y-4">
              <PolicyInheritanceTree
                enterpriseId={enterpriseId}
                refreshTrigger={refreshTrigger}
                onViewEffectivePolicy={(scopeId) => {
                  // Switch to effective policy tab
                  const tab = document.querySelector('[value="effective"]') as HTMLButtonElement;
                  tab?.click();
                }}
              />
            </TabsContent>

            <TabsContent value="effective" className="space-y-4">
              {selectedScope ? (
                <EffectivePolicyViewer 
                  scopeId={selectedScope.id} 
                  refreshTrigger={refreshTrigger}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Network className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a Scope</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a scope from the left panel to view its effective policy
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-4">
              <ConflictResolutionPanel
                conflicts={conflicts}
                onConflictResolved={loadScopeConflicts}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Summary */}
        <div className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Selected Scope</span>
                {selectedScope ? (
                  <Badge variant="secondary">{selectedScope.scope_name}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Scope Type</span>
                {selectedScope ? (
                  <Badge variant="outline" className="capitalize">
                    {selectedScope.scope_type}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conflicts</span>
                <Badge variant={conflictCount > 0 ? 'destructive' : 'secondary'}>
                  {conflictCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Inheritance Modes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">🔴 Replace</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Child policy completely overrides parent
                </p>
              </div>
              <div>
                <div className="font-medium">🟡 Merge</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Child policy merges with parent (shallow merge)
                </p>
              </div>
              <div>
                <div className="font-medium">🟢 Append</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Child policy appends to parent arrays
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Policy Dialog */}
      <CreatePolicyDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        selectedScope={selectedScope}
        enterpriseId={enterpriseId || ''}
        onSuccess={handlePolicyCreated}
      />
    </div>
  );
}
