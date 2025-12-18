import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useToolRegistry } from '@/hooks/useToolRegistry';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ToolMultiSelectProps {
  selectedTools: string[];
  projectId: string;
  workspaceId: string;
  onChange: (tools: string[]) => void;
  onValidationResult: (result: any) => void;
}

export function ToolMultiSelect({
  selectedTools,
  projectId,
  workspaceId,
  onChange,
  onValidationResult,
}: ToolMultiSelectProps) {
  const { data: tools, isLoading } = useToolRegistry();

  // Validate tools against policy
  const { data: validationResult } = useQuery({
    queryKey: ['validate-tools', selectedTools, projectId],
    enabled: selectedTools.length > 0 && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'audit',
          action: 'validate_tool_declaration',
          payload: {
            toolIds: selectedTools,
            enterpriseId: workspaceId,
            policyInstanceId: projectId,
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (validationResult) {
      onValidationResult(validationResult);
    }
  }, [validationResult, onValidationResult]);

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onChange(selectedTools.filter(id => id !== toolId));
    } else {
      onChange([...selectedTools, toolId]);
    }
  };

  const getToolStatus = (toolId: string) => {
    const tool = tools?.find(t => t.id === toolId);
    return tool?.deployment_status || 'draft';
  };

  const getRiskTier = (toolId: string) => {
    const tool = tools?.find(t => t.id === toolId);
    return tool?.risk_tier || 'LOW';
  };

  const isBanned = (toolId: string) => {
    return validationResult?.violations?.some((v: any) => v.tool_id === toolId);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading AI tools...</div>;
  }

  const toolsByCategory = tools?.reduce((acc, tool) => {
    const category = tool.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  return (
    <div className="space-y-4">
      <Label>AI Tools Used</Label>
      <div className="border rounded-lg p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(toolsByCategory || {}).map(([category, categoryTools]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold mb-2 capitalize">{category.replace('_', ' ')}</h4>
            <div className="space-y-2">
              {categoryTools.map((tool) => {
                const isSelected = selectedTools.includes(tool.id);
                const banned = isSelected && isBanned(tool.id);
                const status = getToolStatus(tool.id);
                const riskTier = getRiskTier(tool.id);

                return (
                  <div
                    key={tool.id}
                    className={`flex items-start space-x-3 p-2 rounded ${
                      banned ? 'bg-destructive/10 border border-destructive' : ''
                    }`}
                  >
                    <Checkbox
                      id={tool.id}
                      checked={isSelected}
                      onCheckedChange={() => toggleTool(tool.id)}
                      disabled={banned}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={tool.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tool.name}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tool.provider} • {tool.description}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={status === 'approved' ? 'default' : 'destructive'} className="text-xs">
                          {status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {riskTier}
                        </Badge>
                      </div>
                      {banned && (
                        <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>This tool is banned for this project</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Select all AI tools that were used to create this asset
      </p>
    </div>
  );
}
