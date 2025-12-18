import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Wand2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type ControlLevel } from '@/types/sandbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RiskProfileBadge } from '@/components/enterprise/RiskProfileBadge';

interface RiskProfile {
  tier: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  dimensionScores: {
    dataSensitivity: number;
    externalExposure: number;
    modelTransparency: number;
    misuseVectors: number;
    legalIPRisk: number;
    operationalCriticality: number;
  };
  auditChecklist: string[];
}

interface ParsedScenario {
  policy_id?: string;
  tool_name?: string;
  data_class?: string;
  jurisdiction?: string;
  control_level?: ControlLevel;
  description: string;
  confidence: number;
  riskProfile?: RiskProfile;
}

interface ScenarioCanvasProps {
  workspaceId: string;
  enterpriseId: string;
  onRunSimulation: (scenario: ParsedScenario) => void;
  initialScenario?: string;
}

export const ScenarioCanvas: React.FC<ScenarioCanvasProps> = ({
  workspaceId,
  enterpriseId,
  onRunSimulation,
  initialScenario,
}) => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedScenario | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { toast } = useToast();

  // Update input when initialScenario changes
  useEffect(() => {
    if (initialScenario) {
      setInput(initialScenario);
      setParsed(null);
    }
  }, [initialScenario]);

  // AI-powered scenario parsing via Cursor Agent
  const parseScenarioWithAI = async (text: string): Promise<ParsedScenario> => {
    const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
      body: {
        agentName: 'compliance',
        action: 'analyze',
        input: {
          toolDescription: text,
          context: 'sandbox_scenario_parsing'
        },
        context: {
          enterpriseId,
          workspaceId,
          operation: 'risk_profile_assessment'
        }
      }
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'AI analysis failed');

    const result = data.result;
    const riskProfile = result.metadata?.riskProfile;
    
    return {
      policy_id: result.metadata?.policyId || undefined,
      tool_name: result.metadata?.toolName || 'AI Tool',
      data_class: result.metadata?.dataClass || undefined,
      jurisdiction: result.metadata?.jurisdiction || undefined,
      control_level: riskProfile?.tier === 'critical' ? 'strict' :
                     riskProfile?.tier === 'high' ? 'strict' :
                     riskProfile?.tier === 'medium' ? 'standard' : 'permissive',
      description: text,
      confidence: result.confidence || 0.85,
      riskProfile
    };
  };

  const handleParse = async () => {
    if (!input.trim()) return;
    
    setParsing(true);
    try {
      const result = await parseScenarioWithAI(input);
      setParsed(result);
      toast({
        title: 'Scenario analyzed',
        description: `Risk tier: ${result.riskProfile?.tier || 'unknown'}`,
      });
    } catch (error) {
      console.error('Scenario parsing failed:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze scenario with AI',
        variant: 'destructive'
      });
    } finally {
      setParsing(false);
    }
  };

  const handleRunSimulation = () => {
    if (!parsed) return;
    onRunSimulation(parsed);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Scenario Canvas
          <Badge variant="secondary" className="ml-auto">AI-Powered</Badge>
        </CardTitle>
        <CardDescription>
          Describe your scenario in natural language, and we'll parse it into a structured test with risk assessment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Natural Language Input */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Describe your scenario...
          </Label>
          <Textarea
            placeholder="Example: AI system analyzing molecular structures for potential drug candidates. Processes proprietary research data. Requires FDA validation before clinical trials."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleParse} 
              disabled={!input.trim() || parsing}
              size="sm"
              variant="outline"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Parse Scenario
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={!parsed}
            >
              Advanced View
              {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Parsed Results */}
        <AnimatePresence>
          {parsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 p-4 bg-muted/50 rounded-lg border border-primary/10"
            >
              {/* Risk Profile Badge */}
              {parsed.riskProfile && (
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">AI-Assessed Risk Tier</p>
                    <RiskProfileBadge tier={parsed.riskProfile.tier} />
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    parsed.confidence > 0.8 && "border-green-500 text-green-700",
                    parsed.confidence < 0.6 && "border-yellow-500 text-yellow-700"
                  )}>
                    {(parsed.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Parsed Configuration</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {parsed.policy_id && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Policy/Regulation</p>
                    <Badge variant="secondary">{parsed.policy_id}</Badge>
                  </div>
                )}
                {parsed.tool_name && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tool</p>
                    <Badge variant="secondary">{parsed.tool_name}</Badge>
                  </div>
                )}
                {parsed.data_class && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Data Class</p>
                    <Badge variant="secondary">{parsed.data_class}</Badge>
                  </div>
                )}
                {parsed.jurisdiction && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Jurisdiction</p>
                    <Badge variant="secondary">{parsed.jurisdiction}</Badge>
                  </div>
                )}
                {parsed.control_level && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Enforcement Level</p>
                    <Badge variant="secondary" className="capitalize">{parsed.control_level}</Badge>
                  </div>
                )}
              </div>

              {/* Risk Dimension Scores */}
              {parsed.riskProfile && (
                <div className="space-y-2 p-3 bg-background rounded-md border">
                  <p className="text-xs font-semibold">6-Dimensional Risk Scores</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Sensitivity:</span>
                      <Badge variant="outline" className="text-xs h-5">{parsed.riskProfile.dimensionScores.dataSensitivity}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">External Exposure:</span>
                      <Badge variant="outline" className="text-xs h-5">{parsed.riskProfile.dimensionScores.externalExposure}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Opacity:</span>
                      <Badge variant="outline" className="text-xs h-5">{100 - parsed.riskProfile.dimensionScores.modelTransparency}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Misuse Vectors:</span>
                      <Badge variant="outline" className="text-xs h-5">{parsed.riskProfile.dimensionScores.misuseVectors}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Legal/IP Risk:</span>
                      <Badge variant="outline" className="text-xs h-5">{parsed.riskProfile.dimensionScores.legalIPRisk}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operational Criticality:</span>
                      <Badge variant="outline" className="text-xs h-5">{parsed.riskProfile.dimensionScores.operationalCriticality}</Badge>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleRunSimulation}
                className="w-full"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced View */}
        <AnimatePresence>
          {showAdvanced && parsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 pt-3 border-t"
            >
              <p className="text-sm text-muted-foreground">Manual Override</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Policy ID</Label>
                  <Select value={parsed?.policy_id || ''} onValueChange={(v) => setParsed(prev => prev ? {...prev, policy_id: v} : null)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GDPR">GDPR</SelectItem>
                      <SelectItem value="LGPD">LGPD</SelectItem>
                      <SelectItem value="HIPAA">HIPAA</SelectItem>
                      <SelectItem value="21-CFR-11">21 CFR Part 11</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Enforcement Level</Label>
                  <Select value={parsed?.control_level || 'standard'} onValueChange={(v) => setParsed(prev => prev ? {...prev, control_level: v as ControlLevel} : null)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="permissive">Permissive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
