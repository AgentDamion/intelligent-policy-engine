import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, FileText, ExternalLink } from "lucide-react";
import { ValidationResult } from "@/services/PolicyValidationService";

interface PolicyComplianceReportProps {
  validationResult: ValidationResult;
  runId?: string;
  onViewAuditTrail?: () => void;
}

export function PolicyComplianceReport({ 
  validationResult, 
  runId, 
  onViewAuditTrail 
}: PolicyComplianceReportProps) {
  const totalPoliciesChecked = validationResult.violations.length + validationResult.warnings.length + 
    (validationResult.allowed ? 1 : 0);

  const passedPolicies = validationResult.allowed && validationResult.warnings.length === 0 
    ? totalPoliciesChecked 
    : totalPoliciesChecked - validationResult.violations.length - validationResult.warnings.length;

  return (
    <Card className={
      validationResult.allowed 
        ? "border-success/50 bg-success/5" 
        : "border-destructive/50 bg-destructive/5"
    }>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {validationResult.allowed ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <CardTitle className="text-lg">
              Policy Compliance Report
            </CardTitle>
          </div>
          
          {validationResult.allowed ? (
            <Badge variant="default" className="bg-success/10 text-success border-success/20">
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive">
              Blocked
            </Badge>
          )}
        </div>
        
        <CardDescription>
          {runId && `Run ID: ${runId.slice(0, 8)}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="text-2xl font-bold text-success">{passedPolicies}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="text-2xl font-bold text-warning">{validationResult.warnings.length}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="text-2xl font-bold text-destructive">{validationResult.violations.length}</div>
            <div className="text-xs text-muted-foreground">Violations</div>
          </div>
        </div>

        {/* Violations List */}
        {validationResult.violations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <XCircle className="h-4 w-4" />
              Policy Violations Detected
            </div>
            {validationResult.violations.map((violation, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                <div className="font-medium text-destructive">{violation.rule_id}</div>
                <div className="text-muted-foreground mt-1">{violation.message}</div>
                {violation.binding_id && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Binding: {violation.binding_id.slice(0, 8)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Warnings List */}
        {validationResult.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              Policy Warnings
            </div>
            {validationResult.warnings.map((warning, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-sm">
                <div className="font-medium text-warning">{warning.rule_id}</div>
                <div className="text-muted-foreground mt-1">{warning.message}</div>
                {warning.binding_id && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Binding: {warning.binding_id.slice(0, 8)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Audit Trail Link */}
        {onViewAuditTrail && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAuditTrail}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Full Audit Trail
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
