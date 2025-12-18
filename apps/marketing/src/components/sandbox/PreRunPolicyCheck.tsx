import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { RuntimeBindingService } from "@/services/RuntimeBindingService";
import { RuntimeBinding } from "@/types/runtimeBinding";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PreRunPolicyCheckProps {
  workspaceId: string;
  toolVersionId?: string;
  onEnforcementToggle?: (enforce: boolean) => void;
  defaultEnforce?: boolean;
}

export function PreRunPolicyCheck({ 
  workspaceId, 
  toolVersionId,
  onEnforcementToggle,
  defaultEnforce = true 
}: PreRunPolicyCheckProps) {
  const [bindings, setBindings] = useState<RuntimeBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [enforceMode, setEnforceMode] = useState(defaultEnforce);

  useEffect(() => {
    loadBindings();
  }, [workspaceId, toolVersionId]);

  const loadBindings = async () => {
    try {
      setLoading(true);
      const data = await RuntimeBindingService.getActiveBindings(workspaceId, toolVersionId);
      setBindings(data.filter(b => b.status === 'active'));
    } catch (error) {
      console.error('Failed to load policy bindings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnforcementToggle = (enforce: boolean) => {
    setEnforceMode(enforce);
    onEnforcementToggle?.(enforce);
  };

  if (loading) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Checking policy compliance...</AlertTitle>
        <AlertDescription>
          <Skeleton className="h-4 w-full mt-2" />
        </AlertDescription>
      </Alert>
    );
  }

  if (bindings.length === 0) {
    return (
      <Alert variant="default" className="bg-muted/50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Active Policies</AlertTitle>
        <AlertDescription>
          This run will proceed without policy enforcement. Consider creating policy instances for compliance.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Alert className={enforceMode ? "border-primary/50 bg-primary/5" : "border-warning/50 bg-warning/5"}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            {enforceMode ? (
              <Shield className="h-4 w-4 mt-0.5 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
            )}
            
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                Policy Compliance Check
                <Badge variant={enforceMode ? "default" : "secondary"}>
                  {bindings.length} {bindings.length === 1 ? 'policy' : 'policies'}
                </Badge>
              </AlertTitle>
              
              <AlertDescription className="mt-2">
                {enforceMode ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    This run will be validated against active policies
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-warning" />
                    Policy enforcement is disabled for this run
                  </span>
                )}
              </AlertDescription>

              <CollapsibleContent className="mt-3 space-y-2">
                <div className="text-sm text-muted-foreground">Active policies:</div>
                {bindings.map((binding) => (
                  <div key={binding.id} className="text-sm flex items-center gap-2 pl-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="font-medium">
                      Policy {binding.policy_instance_id.slice(0, 8)}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant={enforceMode ? "default" : "outline"}
            size="sm"
            onClick={() => handleEnforcementToggle(true)}
            className="flex-1"
          >
            <Shield className="h-3 w-3 mr-1" />
            Enforce
          </Button>
          <Button
            variant={!enforceMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleEnforcementToggle(false)}
            className="flex-1"
          >
            Skip Validation
          </Button>
        </div>
      </Alert>
    </Collapsible>
  );
}
