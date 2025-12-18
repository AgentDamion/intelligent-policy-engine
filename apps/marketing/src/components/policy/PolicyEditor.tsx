import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RotateCcw, Save, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PolicyTemplate } from '@/types/policy';
import RuleInput from './RuleInput';

interface PolicyEditorProps {
  selectedTemplate: PolicyTemplate;
  policyName: string;
  customizedRules: Record<string, any>;
  customizedRuleKeys: Set<string>;
  isSaving: boolean;
  inheritedRules?: Record<string, any>;
  scopeId?: string;
  inheritanceMode?: 'replace' | 'merge' | 'append';
  onPolicyNameChange: (name: string) => void;
  onRuleUpdate: (ruleKey: string, value: any) => void;
  onRuleReset: (ruleKey: string) => void;
  onInheritanceModeChange?: (mode: 'replace' | 'merge' | 'append') => void;
  onSave: () => void;
  onBack: () => void;
}

export default function PolicyEditor({
  selectedTemplate,
  policyName,
  customizedRules,
  customizedRuleKeys,
  isSaving,
  inheritedRules = {},
  scopeId,
  inheritanceMode = 'merge',
  onPolicyNameChange,
  onRuleUpdate,
  onRuleReset,
  onInheritanceModeChange,
  onSave,
  onBack
}: PolicyEditorProps) {
  const hasInheritedRules = Object.keys(inheritedRules).length > 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Customize: {selectedTemplate.name}
          </h2>
          <p className="text-muted-foreground">
            Configure rules for {selectedTemplate.industry} industry compliance
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Templates
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Policy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Name</Label>
              <Input
                value={policyName}
                onChange={(e) => onPolicyNameChange(e.target.value)}
                placeholder="Enter a name for your customized policy"
              />
            </div>
            
            {hasInheritedRules && onInheritanceModeChange && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Inheritance Mode</Label>
                <Select value={inheritanceMode} onValueChange={onInheritanceModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merge">Merge - Combine with inherited rules</SelectItem>
                    <SelectItem value="replace">Replace - Override all inherited rules</SelectItem>
                    <SelectItem value="append">Append - Add to inherited rules</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inheritanceMode === 'merge' && 'Your rules will be combined with inherited rules. Conflicts use your values.'}
                  {inheritanceMode === 'replace' && 'Your rules will completely replace all inherited rules.'}
                  {inheritanceMode === 'append' && 'Your rules will be added to inherited rules without conflicts.'}
                </p>
              </div>
            )}
          </div>

          {hasInheritedRules && (
            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 mb-6">
              <h3 className="text-sm font-semibold text-blue-600 mb-2">Inherited Rules (Read-only)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                These rules are inherited from parent scopes and cannot be modified here.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(inheritedRules).map(([ruleKey, value]) => (
                  <div key={ruleKey} className="p-3 rounded-md bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground mb-1">{ruleKey}</div>
                    <div className="text-sm">{JSON.stringify(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(customizedRules).map(([ruleKey, value]) => {
              const isCustomized = customizedRuleKeys.has(ruleKey);
              const defaultValue = selectedTemplate.default_rules[ruleKey];
              const isInherited = inheritedRules.hasOwnProperty(ruleKey);
              const isDifferentFromInherited = isInherited && JSON.stringify(value) !== JSON.stringify(inheritedRules[ruleKey]);

              return (
                <div 
                  key={ruleKey}
                  className={cn(
                    "p-4 rounded-lg border",
                    isCustomized ? "border-primary bg-primary/5" : 
                    isDifferentFromInherited ? "border-orange-500/50 bg-orange-500/5" : 
                    "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isCustomized && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      {isDifferentFromInherited && <AlertCircle className="h-4 w-4 text-orange-500" />}
                      <span className="text-sm font-medium">
                        {isCustomized ? "Customized" : isDifferentFromInherited ? "Override" : "Default"}
                      </span>
                    </div>
                    {isCustomized && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRuleReset(ruleKey)}
                        className="h-8 px-2"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                  <RuleInput
                    ruleKey={ruleKey}
                    value={value}
                    onUpdate={(newValue) => onRuleUpdate(ruleKey, newValue)}
                  />
                  {isDifferentFromInherited && (
                    <div className="mt-2 text-xs text-orange-600">
                      Inherited: {JSON.stringify(inheritedRules[ruleKey])}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{customizedRuleKeys.size} rules customized</span>
            </div>
            <Button 
              onClick={onSave} 
              disabled={isSaving || !policyName.trim()}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Policy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}