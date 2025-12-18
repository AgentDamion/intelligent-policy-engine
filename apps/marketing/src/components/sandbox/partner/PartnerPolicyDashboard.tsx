import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { PartnerGovernanceService } from '@/services/PartnerGovernanceService';
import { PolicyConflictViewer } from './PolicyConflictViewer';
import { useToast } from '@/hooks/use-toast';

interface PartnerPolicyDashboardProps {
  workspaceId: string;
  clientEnterpriseId: string;
  agencyEnterpriseId: string;
}

export function PartnerPolicyDashboard({
  workspaceId,
  clientEnterpriseId,
  agencyEnterpriseId,
}: PartnerPolicyDashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientPolicies, setClientPolicies] = useState<any[]>([]);
  const [agencyPolicies, setAgencyPolicies] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [workspaceId, clientEnterpriseId, agencyEnterpriseId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load permissions
      const perms = await PartnerGovernanceService.getRelationshipPermissions(
        clientEnterpriseId,
        agencyEnterpriseId
      );
      setPermissions(perms);

      // Load shared policies
      const { clientPolicies: cp, agencyPolicies: ap } =
        await PartnerGovernanceService.getSharedPolicies(
          clientEnterpriseId,
          agencyEnterpriseId
        );

      setClientPolicies(cp);
      setAgencyPolicies(ap);

      // Detect conflicts
      const detectedConflicts: any[] = [];
      cp.forEach((clientPolicy) => {
        ap.forEach((agencyPolicy) => {
          const policyConflicts = PartnerGovernanceService.detectPolicyConflicts(
            clientPolicy.pom,
            agencyPolicy.pom
          );

          if (policyConflicts.length > 0) {
            detectedConflicts.push({
              clientPolicyId: clientPolicy.id,
              agencyPolicyId: agencyPolicy.id,
              clientPolicyName: `Client Policy ${clientPolicy.id.substring(0, 8)}`,
              agencyPolicyName: `Agency Policy ${agencyPolicy.id.substring(0, 8)}`,
              conflicts: policyConflicts,
            });
          }
        });
      });

      setConflicts(detectedConflicts);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load dashboard',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDualApproval = async (policyId: string, description: string) => {
    try {
      await PartnerGovernanceService.createDualApprovalRequest(
        policyId,
        clientEnterpriseId,
        agencyEnterpriseId,
        description
      );

      toast({
        title: 'Dual approval requested',
        description: 'Both client and agency must approve this change',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create approval request',
        description: (error as Error).message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading partner dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partner Permissions
          </CardTitle>
          <CardDescription>
            Current permissions for this client-agency relationship
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant={permissions?.canViewPolicies ? 'default' : 'secondary'}>
              {permissions?.canViewPolicies ? '✓' : '✗'} View Policies
            </Badge>
            <Badge variant={permissions?.canSubmitReviews ? 'default' : 'secondary'}>
              {permissions?.canSubmitReviews ? '✓' : '✗'} Submit Reviews
            </Badge>
            <Badge variant={permissions?.canManageBrands ? 'default' : 'secondary'}>
              {permissions?.canManageBrands ? '✓' : '✗'} Manage Brands
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Policy Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} policy conflict{conflicts.length > 1 ? 's' : ''} detected
            between client and agency policies. Review and resolve conflicts below.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="shared" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shared">Shared Policies</TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
          </TabsTrigger>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Client Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Policies</CardTitle>
                <CardDescription>{clientPolicies.length} policies</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {clientPolicies.map((policy) => (
                      <Card key={policy.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              Policy {policy.id.substring(0, 8)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {policy.status}
                            </div>
                          </div>
                          <Badge variant={policy.status === 'approved' ? 'default' : 'secondary'}>
                            {policy.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Agency Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agency Policies</CardTitle>
                <CardDescription>{agencyPolicies.length} policies</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {agencyPolicies.map((policy) => (
                      <Card key={policy.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              Policy {policy.id.substring(0, 8)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {policy.status}
                            </div>
                          </div>
                          <Badge variant={policy.status === 'approved' ? 'default' : 'secondary'}>
                            {policy.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conflicts">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {conflicts.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conflicts Detected</h3>
                  <p className="text-muted-foreground">
                    Client and agency policies are aligned
                  </p>
                </Card>
              ) : (
                conflicts.map((conflict, index) => (
                  <PolicyConflictViewer
                    key={index}
                    conflict={conflict}
                    onResolve={(resolution) => {
                      handleCreateDualApproval(
                        conflict.clientPolicyId,
                        `Resolve conflict: ${resolution}`
                      );
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="approvals">
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Approval Queue</h3>
            <p className="text-muted-foreground mb-4">
              No pending approvals at this time
            </p>
            <Button variant="outline">View All Workflows</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
