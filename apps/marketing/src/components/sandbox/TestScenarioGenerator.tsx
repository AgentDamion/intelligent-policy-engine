import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useSandboxAgents } from '@/hooks/useSandboxAgents';
import { useToast } from '@/hooks/use-toast';

interface TestScenarioGeneratorProps {
  policyId: string;
  onScenarioSelect: (scenario: any) => void;
}

export function TestScenarioGenerator({ policyId, onScenarioSelect }: TestScenarioGeneratorProps) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { generateTestScenarios, agentActivity, isProcessing } = useSandboxAgents();
  const { toast } = useToast();

  const handleGenerate = async () => {
    const result = await generateTestScenarios(policyId);
    
    if (result.success) {
      setScenarios(result.scenarios);
      toast({
        title: 'Test Scenarios Generated',
        description: `Generated ${result.scenarios.length} AI-powered test scenarios`,
      });
    } else {
      toast({
        title: 'Generation Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const copyScenario = (scenario: any, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(scenario, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    
    toast({
      title: 'Copied to Clipboard',
      description: 'Test scenario copied successfully',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Test Scenario Generator
              </CardTitle>
              <CardDescription>
                Generate realistic test scenarios using AI analysis of your policy
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="ml-4"
            >
              {isProcessing ? 'Generating...' : 'Generate Scenarios'}
            </Button>
          </div>
        </CardHeader>
        
        {scenarios.length > 0 && (
          <CardContent className="space-y-4">
            {scenarios.map((scenario, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {scenario.description || `Test Scenario ${index + 1}`}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {scenario.expected_outcome || 'approve'}
                        </Badge>
                        {scenario.risk_factors && scenario.risk_factors.length > 0 && (
                          <Badge variant="secondary">
                            {scenario.risk_factors.length} risk factors
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyScenario(scenario, `scenario-${index}`)}
                      >
                        {copiedId === `scenario-${index}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onScenarioSelect(scenario)}
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {scenario.inputs && (
                      <div>
                        <span className="font-medium">Input Data:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(scenario.inputs, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {scenario.compliance_checkpoints && (
                      <div>
                        <span className="font-medium">Compliance Checkpoints:</span>
                        <ul className="mt-1 list-disc list-inside text-muted-foreground">
                          {scenario.compliance_checkpoints.map((checkpoint: string, i: number) => (
                            <li key={i}>{checkpoint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
