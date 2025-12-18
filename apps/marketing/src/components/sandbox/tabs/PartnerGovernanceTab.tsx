import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { PartnerPolicyDashboard } from '../partner/PartnerPolicyDashboard';
import { PartnerGovernanceService } from '@/services/PartnerGovernanceService';
import { useToast } from '@/hooks/use-toast';

interface PartnerGovernanceTabProps {
  workspaceId: string;
  enterpriseId: string;
}

export function PartnerGovernanceTab({
  workspaceId,
  enterpriseId,
}: PartnerGovernanceTabProps) {
  const { toast } = useToast();
  const [isBrandWorkspace, setIsBrandWorkspace] = useState(false);
  const [agencyWorkspaceId, setAgencyWorkspaceId] = useState<string | null>(null);
  const [clientEnterpriseId, setClientEnterpriseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPartnerStatus();
  }, [workspaceId]);

  const checkPartnerStatus = async () => {
    try {
      setLoading(true);
      const result = await PartnerGovernanceService.isBrandWorkspace(workspaceId);
      
      setIsBrandWorkspace(result.isBrand);
      setAgencyWorkspaceId(result.agencyWorkspaceId || null);
      setClientEnterpriseId(result.clientEnterpriseId || null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to check partner status',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading partner governance...</div>
      </div>
    );
  }

  if (!isBrandWorkspace || !agencyWorkspaceId || !clientEnterpriseId) {
    return (
      <ScrollArea className="h-full">
        <div className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This workspace is not configured for partner governance. Partner governance
              features are only available for brand workspaces with active client-agency
              relationships.
            </AlertDescription>
          </Alert>

          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold mb-4">What is Partner Governance?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Shared policy management between client and agency</li>
              <li>• Dual approval workflows for sensitive changes</li>
              <li>• Policy conflict detection and resolution</li>
              <li>• Cross-tenant audit trails</li>
              <li>• Data isolation and access controls</li>
            </ul>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <PartnerPolicyDashboard
          workspaceId={workspaceId}
          clientEnterpriseId={clientEnterpriseId}
          agencyEnterpriseId={enterpriseId}
        />
      </div>
    </ScrollArea>
  );
}
