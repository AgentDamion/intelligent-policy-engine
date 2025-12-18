export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  template_type: string;
  rules: Record<string, any>;
  default_rules: Record<string, any>;
}

export interface PolicyCustomizationProps {
  organizationId?: string;
  organizationType?: string;
  scopeId?: string;
  enterpriseId?: string;
}