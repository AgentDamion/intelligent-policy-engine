import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { PolicyViolation } from "@/services/PolicyValidationService";

interface PolicyViolationAlertProps {
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
  onDismiss?: () => void;
  onViewPolicy?: (policyInstanceId: string) => void;
}

export function PolicyViolationAlert({ 
  violations, 
  warnings, 
  onDismiss,
  onViewPolicy 
}: PolicyViolationAlertProps) {
  const hasErrors = violations.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Critical Violations */}
      {hasErrors && (
        <Alert variant="destructive" className="border-2">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            Policy Violations Detected - Execution Blocked
          </AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-3">
              {violations.map((violation, idx) => (
                <div key={idx} className="bg-destructive/10 rounded-md p-3 border border-destructive/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="text-xs">
                          {violation.rule_id}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Binding: {violation.binding_id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{violation.message}</p>
                    </div>
                    {violation.policy_instance_id && onViewPolicy && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewPolicy(violation.policy_instance_id)}
                      >
                        View Policy
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-sm mt-3 font-medium">
                ⛔ Execution cannot proceed until these violations are resolved.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-lg font-semibold text-yellow-700">
            Policy Warnings
          </AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-2">
              {warnings.map((warning, idx) => (
                <div key={idx} className="bg-yellow-500/10 rounded-md p-3 border border-yellow-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                          {warning.rule_id}
                        </Badge>
                        {warning.binding_id && (
                          <span className="text-xs text-muted-foreground">
                            Binding: {warning.binding_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-yellow-800">{warning.message}</p>
                    </div>
                    {warning.policy_instance_id && onViewPolicy && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewPolicy(warning.policy_instance_id)}
                      >
                        View Policy
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-sm mt-3 text-yellow-700">
                ⚠️ Warnings do not block execution but should be reviewed.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {onDismiss && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
