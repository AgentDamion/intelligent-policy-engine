import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PolicyTemplate, PolicyCustomizationProps } from '@/types/policy';
import { UnifiedPolicyService } from '@/services/unifiedPolicyService';
import TemplateSelector from './TemplateSelector';
import PolicyEditor from './PolicyEditor';

export default function PolicyCustomization({ 
  organizationId = "b3a15512-fb3c-43e2-9d70-b6fdd8dedea6", 
  organizationType = "enterprise",
  scopeId,
  enterpriseId
}: PolicyCustomizationProps) {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [customizedRules, setCustomizedRules] = useState<Record<string, any>>({});
  const [customizedRuleKeys, setCustomizedRuleKeys] = useState<Set<string>>(new Set());
  const [policyName, setPolicyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inheritedRules, setInheritedRules] = useState<Record<string, any>>({});
  const [inheritanceMode, setInheritanceMode] = useState<'replace' | 'merge' | 'append'>('merge');
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Load inherited rules if scope is provided
      if (scopeId) {
        const inherited = await UnifiedPolicyService.getInheritedRules(scopeId);
        setInheritedRules(inherited);
      }
      
      const templateData = await UnifiedPolicyService.fetchPolicyTemplates();
      setTemplates(templateData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Set fallback demo data if API fails
      setTemplates([
        {
          id: 'healthcare-basic',
          name: 'Healthcare Basic Compliance',
          description: 'Basic HIPAA compliance template for healthcare organizations',
          industry: 'Healthcare',
          template_type: 'compliance',
          rules: {
            data_retention_days: 365,
            encryption_required: true,
            audit_frequency: 'monthly',
            access_controls: ['role_based', 'mfa_required'],
            privacy_threshold: 'high'
          },
          default_rules: {
            data_retention_days: 365,
            encryption_required: true,
            audit_frequency: 'monthly',
            access_controls: ['role_based', 'mfa_required'],
            privacy_threshold: 'high'
          }
        }
      ]);
      
      toast({
        title: "Demo Mode",
        description: "Using demo templates. API connection failed.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: PolicyTemplate) => {
    setSelectedTemplate(template);
    setCustomizedRules({ ...template.rules });
    setCustomizedRuleKeys(new Set());
    setPolicyName(`${template.name} - Custom`);
  };

  const updateRule = (ruleKey: string, value: any) => {
    setCustomizedRules(prev => ({
      ...prev,
      [ruleKey]: value
    }));
    setCustomizedRuleKeys(prev => new Set([...prev, ruleKey]));
  };

  const resetRule = (ruleKey: string) => {
    if (selectedTemplate?.default_rules[ruleKey] !== undefined) {
      setCustomizedRules(prev => ({
        ...prev,
        [ruleKey]: selectedTemplate.default_rules[ruleKey]
      }));
      setCustomizedRuleKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleKey);
        return newSet;
      });
    }
  };

  const savePolicy = async () => {
    if (!selectedTemplate || !policyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a policy name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // If scope is provided, create scoped policy (Track 2)
      if (scopeId && enterpriseId) {
        await UnifiedPolicyService.createScopedPolicy({
          scope_id: scopeId,
          policy_name: policyName,
          inheritance_mode: inheritanceMode,
          rules: customizedRules,
          enterprise_id: enterpriseId
        });
      } else {
        // Otherwise, save as template-based policy (Track 1)
        await UnifiedPolicyService.saveCustomPolicy(
          organizationId,
          organizationType,
          selectedTemplate.id,
          policyName,
          customizedRules
        );
      }

      toast({
        title: "Success",
        description: "Policy customization saved successfully!",
      });
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: "Error",
        description: "Failed to save policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading policy templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!selectedTemplate ? (
        <TemplateSelector
          templates={templates}
          onSelectTemplate={selectTemplate}
        />
      ) : (
        <PolicyEditor
          selectedTemplate={selectedTemplate}
          policyName={policyName}
          customizedRules={customizedRules}
          customizedRuleKeys={customizedRuleKeys}
          isSaving={isSaving}
          inheritedRules={inheritedRules}
          scopeId={scopeId}
          inheritanceMode={inheritanceMode}
          onPolicyNameChange={setPolicyName}
          onRuleUpdate={updateRule}
          onRuleReset={resetRule}
          onInheritanceModeChange={setInheritanceMode}
          onSave={savePolicy}
          onBack={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}