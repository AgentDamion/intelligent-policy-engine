import { useEffect, useState } from "react";
import { SandboxSplitLayout } from "@/components/sandbox/split-layout/SandboxSplitLayout";
import { SimplifiedSandboxEmptyState } from "@/components/sandbox/empty-states/SimplifiedSandboxEmptyState";
import { insertSamplePolicyInstanceData } from "@/utils/samplePolicyInstanceData";
import { insertSamplePolicyTemplates } from "@/utils/samplePolicyTemplates";
import { seedAITools } from "@/utils/seedAITools";
import { seedSampleSimulations } from "@/utils/seedSampleSimulations";
import { PolicyValidationService, ValidationResult } from "@/services/PolicyValidationService";
import { PolicyViolationAlert } from "@/components/sandbox/PolicyViolationAlert";
import { ActivePoliciesCard } from "@/components/sandbox/ActivePoliciesCard";
import { PolicyComplianceReport } from "@/components/sandbox/PolicyComplianceReport";
import { useSandbox } from "@/hooks/useSandbox";
import { useSandboxProjects } from "@/hooks/useSandboxProjects";
import { toast } from "sonner";

export default function Sandbox() {
  const enterpriseId = "550e8400-e29b-41d4-a716-446655440001";
  const workspaceId = "660e8400-e29b-41d4-a716-446655440001";
  const [isSeeding, setIsSeeding] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showViolations, setShowViolations] = useState(false);
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const { runs, refreshRuns } = useSandbox(workspaceId);
  const { projects } = useSandboxProjects(workspaceId);

  useEffect(() => {
    const seedData = async () => {
      setIsSeeding(true);
      await seedAITools();
      await insertSamplePolicyTemplates();
      await insertSamplePolicyInstanceData();
      await seedSampleSimulations(workspaceId, enterpriseId);
      setIsSeeding(false);
      refreshRuns();
    };
    seedData();
  }, []);

  // Function to validate before running - can be called from anywhere
  const validateBeforeRun = async (toolVersionId: string) => {
    try {
      toast.info("Validating policy compliance...");
      
      const result = await PolicyValidationService.validateAIUsage(
        toolVersionId,
        workspaceId,
        {
          use_case: "Sandbox execution",
          data_classification: [],
          jurisdiction: ["US"],
          user_role: "developer"
        }
      );

      setValidationResult(result);
      setShowViolations(true);

      if (!result.allowed) {
        toast.error(`Policy violations detected! Execution blocked.`);
        return false;
      }

      if (result.warnings.length > 0) {
        toast.warning(`${result.warnings.length} policy warning(s) detected`);
      }

      toast.success("Policy validation passed");
      return true;
    } catch (error) {
      console.error('Policy validation error:', error);
      toast.error('Policy validation failed');
      return false;
    }
  };

  if (isSeeding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing sandbox data...</p>
        </div>
      </div>
    );
  }

  // Show simplified empty state when no runs exist
  if (runs.length === 0) {
    return (
      <SimplifiedSandboxEmptyState
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
        onSimulationCreated={refreshRuns}
      />
    );
  }

  return (
    <div className="space-y-4">
      {showViolations && validationResult && (
        <div className="px-6 pt-4">
          <PolicyViolationAlert
            violations={validationResult.violations}
            warnings={validationResult.warnings}
            onDismiss={() => setShowViolations(false)}
          />
        </div>
      )}

      {showComplianceReport && validationResult && (
        <div className="px-6 pt-4">
          <PolicyComplianceReport
            validationResult={validationResult}
            runId={lastRunId || undefined}
            onViewAuditTrail={() => {
              toast.info('Audit trail viewer coming soon');
            }}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6">
        <div className="lg:col-span-2">
          <SandboxSplitLayout
            enterpriseId={enterpriseId}
            workspaceId={workspaceId}
          />
        </div>
        
        <div className="lg:col-span-1">
          <ActivePoliciesCard
            workspaceId={workspaceId}
            enterpriseId={enterpriseId}
            onViewPolicy={(policyId) => {
              toast.info(`View policy: ${policyId.slice(0, 8)}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
