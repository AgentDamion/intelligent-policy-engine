import React from 'react';
import { ChevronRight, FileText, Wrench, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ClientContext } from '@/hooks/useClientContext';

interface ClientContextBarProps {
  context: ClientContext | null;
}

export const ClientContextBar = ({ context }: ClientContextBarProps) => {
  if (!context) return null;

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getComplianceBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-success/10 text-success border-success/20';
    if (score >= 75) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <div className="mb-6 p-4 bg-background border rounded-lg">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="font-medium text-foreground">{context.clientName}</span>
        <ChevronRight className="h-4 w-4" />
        <span>{context.workspaceName}</span>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">{context.policiesCount}</div>
              <div className="text-xs text-muted-foreground">Policies</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-secondary/10 rounded">
              <Wrench className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <div className="text-lg font-semibold">{context.toolsCount}</div>
              <div className="text-xs text-muted-foreground">Tools</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent/10 rounded">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <div className={`text-lg font-semibold ${getComplianceColor(context.complianceReadiness)}`}>
                {context.complianceReadiness}%
              </div>
              <div className="text-xs text-muted-foreground">Compliance Readiness</div>
            </div>
          </div>
        </div>

        <Badge className={getComplianceBadgeColor(context.complianceReadiness)}>
          <Shield className="h-3 w-3 mr-1" />
          {context.complianceReadiness >= 90 ? 'Excellent' : 
           context.complianceReadiness >= 75 ? 'Good' : 'Needs Attention'}
        </Badge>
      </div>
    </div>
  );
};