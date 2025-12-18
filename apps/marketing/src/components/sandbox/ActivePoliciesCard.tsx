import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { RuntimeBindingService } from "@/services/RuntimeBindingService";
import { RuntimeBinding } from "@/types/runtimeBinding";
import { PolicyInstance } from "@/types/policyInstance";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivePoliciesCardProps {
  workspaceId: string;
  enterpriseId: string;
  onViewPolicy?: (policyId: string) => void;
}

interface EnrichedBinding extends RuntimeBinding {
  policy_instance?: PolicyInstance;
}

export function ActivePoliciesCard({ workspaceId, enterpriseId, onViewPolicy }: ActivePoliciesCardProps) {
  const [bindings, setBindings] = useState<EnrichedBinding[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBindings = async () => {
    try {
      setLoading(true);
      const data = await RuntimeBindingService.getActiveBindings(workspaceId);
      setBindings(data);
    } catch (error) {
      console.error('Failed to load active policies:', error);
      toast.error('Failed to load active policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBindings();
  }, [workspaceId]);

  const handleToggle = async (bindingId: string, currentStatus: string) => {
    const isActive = currentStatus === 'active';
    try {
      await RuntimeBindingService.toggleBinding(bindingId, !isActive);
      toast.success(isActive ? 'Policy enforcement paused' : 'Policy enforcement activated');
      loadBindings();
    } catch (error) {
      console.error('Failed to toggle policy:', error);
      toast.error('Failed to update policy status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Enforced</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Monitoring</Badge>;
      default:
        return <Badge variant="outline">Disabled</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Policies
          </CardTitle>
          <CardDescription>Loading policy enforcement status...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (bindings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Policies
          </CardTitle>
          <CardDescription>No active policies for this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Create and approve policy instances to enable enforcement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Active Policies
        </CardTitle>
        <CardDescription>
          {bindings.filter(b => b.status === 'active').length} of {bindings.length} policies enforced
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {bindings.map((binding) => (
          <div
            key={binding.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(binding.status)}
                <span className="font-medium text-sm">
                  {binding.policy_instance?.use_case || 'Policy Instance'}
                </span>
                {getStatusBadge(binding.status)}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Activated: {new Date(binding.activated_at).toLocaleDateString()}
                {binding.violation_count > 0 && (
                  <span className="ml-2 text-destructive">
                    • {binding.violation_count} violation{binding.violation_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onViewPolicy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewPolicy(binding.policy_instance_id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              
              <Switch
                checked={binding.status === 'active'}
                onCheckedChange={() => handleToggle(binding.id, binding.status)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
