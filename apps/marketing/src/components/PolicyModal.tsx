import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useInviteData } from '@/hooks/useInviteContext';

interface PolicyRule {
  category: string;
  rule: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

const PolicyModal = () => {
  const { inviteData, policyName, policyScope } = useInviteData();

  // Mock policy rules - in production, this would come from API
  const policyRules: PolicyRule[] = [
    {
      category: "Patient Content",
      rule: "no_patient_imagery: true",
      severity: "high",
      description: "AI tools cannot generate or process patient imagery without explicit consent"
    },
    {
      category: "Medical Claims",
      rule: "medical_review_required: true", 
      severity: "high",
      description: "All medical content must undergo MLR (Medical Legal Review)"
    },
    {
      category: "Data Privacy",
      rule: "phi_handling: restricted",
      severity: "high", 
      description: "Protected Health Information handling is strictly limited"
    },
    {
      category: "Output Monitoring",
      rule: "output_logging: mandatory",
      severity: "medium",
      description: "All AI outputs must be logged for audit purposes"
    },
    {
      category: "Bias Testing",
      rule: "bias_testing: required",
      severity: "medium",
      description: "Regular bias testing required for generative AI tools"
    },
    {
      category: "External APIs",
      rule: "third_party_validation: required",
      severity: "low",
      description: "Third-party API integrations require security validation"
    }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medium':
        return <Shield className="w-4 h-4 text-warning" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-success" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!inviteData) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          View Active Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {policyName || 'Active Policy'}
          </DialogTitle>
          <DialogDescription>
            {policyScope || 'Policy rules and compliance requirements for this workspace'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Policy Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Workspace</h4>
                    <p className="text-sm text-muted-foreground">{inviteData.workspaceName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Enterprise</h4>
                    <p className="text-sm text-muted-foreground">{inviteData.enterpriseName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Your Role</h4>
                    <Badge variant="secondary">{inviteData.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Policy Rules */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Policy Rules</h3>
              <div className="space-y-4">
                {policyRules.map((rule, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(rule.severity)}
                          <h4 className="font-medium text-foreground">{rule.category}</h4>
                        </div>
                        <Badge variant={getSeverityColor(rule.severity) as any} className="text-xs">
                          {rule.severity.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/50 rounded-md p-3 mb-2">
                        <code className="text-sm font-mono text-foreground">
                          {rule.rule}
                        </code>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Policy YAML View */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Raw Policy Configuration</h3>
              <Card>
                <CardContent className="pt-4">
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto bg-muted/30 p-4 rounded-md">
{`# MLR-Required Patient Content Policy
policy_version: "2024.1"
workspace: "${inviteData.workspaceId}"
enterprise: "${inviteData.enterpriseName}"

rules:
  patient_content:
    no_patient_imagery: true
    medical_review_required: true
    phi_handling: "restricted"
  
  monitoring:
    output_logging: "mandatory"
    bias_testing: "required"
    audit_trail: true
  
  compliance:
    frameworks:
      - "21 CFR Part 11"
      - "HIPAA"
      - "EU AI Act"
    
  validation:
    third_party_apis: "security_validation_required"
    data_sources: "approved_list_only"`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyModal;