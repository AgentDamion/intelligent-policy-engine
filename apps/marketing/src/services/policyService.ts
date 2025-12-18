import { PolicyTemplate } from '@/types/policy';

export const fetchPolicyTemplates = async (): Promise<PolicyTemplate[]> => {
  const response = await fetch('/api/policy-templates');
  if (!response.ok) throw new Error('Failed to fetch templates');
  const data = await response.json();
  
  // Handle API response format {success: true, templates: [...]}
  if (data.success && Array.isArray(data.templates)) {
    // Map API format to component format
    return data.templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      industry: template.industry,
      template_type: template.template_type,
      rules: template.base_rules || {},
      default_rules: template.base_rules || {}
    }));
  } else {
    console.warn('API returned unexpected format:', data);
    throw new Error('Invalid API response format');
  }
};

export const saveCustomPolicy = async (
  organizationId: string,
  organizationType: string,
  templateId: string,
  policyName: string,
  customizedRules: Record<string, any>
) => {
  const response = await fetch('/api/policy-templates/customize-policy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
      templateId,
      customizations: customizedRules,
      policyName,
    }),
  });

  if (!response.ok) throw new Error('Failed to save policy');
  return response.json();
};