import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RiskProfileBadge } from '@/components/enterprise/RiskProfileBadge';
import { Beaker, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TestScenario {
  name: string;
  description: string;
  expectedTier: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  scenarioText: string;
  expectedDimensions: {
    dataSensitivity: number;
    externalExposure: number;
    modelTransparency: number;
    misuseVectors: number;
    legalIPRisk: number;
    operationalCriticality: number;
  };
}

const testScenarios: TestScenario[] = [
  {
    name: 'Minimal Risk - Internal Analysis Tool',
    expectedTier: 'minimal',
    description: 'Low-stakes internal tool with no sensitive data',
    scenarioText: 'Internal code formatting and linting tool for development team. No access to customer data, runs locally, open-source algorithms.',
    expectedDimensions: {
      dataSensitivity: 10,
      externalExposure: 5,
      modelTransparency: 10,
      misuseVectors: 5,
      legalIPRisk: 10,
      operationalCriticality: 15
    }
  },
  {
    name: 'Low Risk - Customer Support Chatbot',
    expectedTier: 'low',
    description: 'Basic chatbot with limited data access',
    scenarioText: 'Customer support chatbot answering FAQs. Accesses public knowledge base only. No PII processing. Human escalation available.',
    expectedDimensions: {
      dataSensitivity: 25,
      externalExposure: 30,
      modelTransparency: 20,
      misuseVectors: 20,
      legalIPRisk: 25,
      operationalCriticality: 30
    }
  },
  {
    name: 'Medium Risk - Drug Discovery AI',
    expectedTier: 'medium',
    description: 'AI analyzing molecular compounds for new drug candidates',
    scenarioText: 'AI system analyzing molecular structures for potential drug candidates. Processes proprietary research data. Requires FDA validation before clinical trials.',
    expectedDimensions: {
      dataSensitivity: 60,
      externalExposure: 40,
      modelTransparency: 45,
      misuseVectors: 50,
      legalIPRisk: 65,
      operationalCriticality: 55
    }
  },
  {
    name: 'High Risk - Clinical Trial Patient Matching',
    expectedTier: 'high',
    description: 'AI matching patients to clinical trials using PHI',
    scenarioText: 'AI system matching patients to clinical trials based on medical history and genetic data. Processes PHI under HIPAA. Directly impacts patient enrollment decisions.',
    expectedDimensions: {
      dataSensitivity: 85,
      externalExposure: 70,
      modelTransparency: 60,
      misuseVectors: 75,
      legalIPRisk: 80,
      operationalCriticality: 75
    }
  },
  {
    name: 'Critical Risk - Autonomous Radiology Diagnosis',
    expectedTier: 'critical',
    description: 'AI making autonomous medical diagnoses',
    scenarioText: 'Autonomous AI system diagnosing cancer from radiology images with minimal human oversight. FDA Class III medical device. Direct patient safety impact.',
    expectedDimensions: {
      dataSensitivity: 95,
      externalExposure: 90,
      modelTransparency: 70,
      misuseVectors: 85,
      legalIPRisk: 95,
      operationalCriticality: 100
    }
  }
];

interface RiskProfileTestScenariosProps {
  onUseScenario: (scenarioText: string) => void;
}

export const RiskProfileTestScenarios = ({ onUseScenario }: RiskProfileTestScenariosProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyScenario = (scenario: TestScenario, index: number) => {
    navigator.clipboard.writeText(scenario.scenarioText);
    setCopiedId(`scenario-${index}`);
    setTimeout(() => setCopiedId(null), 2000);
    
    toast({
      title: "Scenario copied",
      description: "Paste it into the Scenario Canvas to test"
    });
  };

  const handleUseScenario = (scenario: TestScenario) => {
    onUseScenario(scenario.scenarioText);
    toast({
      title: "Scenario loaded",
      description: `${scenario.name} is ready to analyze`
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          <CardTitle>Risk Profile Test Scenarios</CardTitle>
        </div>
        <CardDescription>
          Pre-built test cases covering all 5 risk tiers for validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {testScenarios.map((scenario, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-base">{scenario.name}</CardTitle>
                  <CardDescription className="text-xs">{scenario.description}</CardDescription>
                </div>
                <RiskProfileBadge tier={scenario.expectedTier} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="italic text-muted-foreground">{scenario.scenarioText}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Expected Dimension Scores</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Sensitivity:</span>
                    <Badge variant="outline" className="text-xs">{scenario.expectedDimensions.dataSensitivity}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">External Exposure:</span>
                    <Badge variant="outline" className="text-xs">{scenario.expectedDimensions.externalExposure}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model Opacity:</span>
                    <Badge variant="outline" className="text-xs">{100 - scenario.expectedDimensions.modelTransparency}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Misuse Vectors:</span>
                    <Badge variant="outline" className="text-xs">{scenario.expectedDimensions.misuseVectors}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Legal/IP Risk:</span>
                    <Badge variant="outline" className="text-xs">{scenario.expectedDimensions.legalIPRisk}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operational Criticality:</span>
                    <Badge variant="outline" className="text-xs">{scenario.expectedDimensions.operationalCriticality}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyScenario(scenario, index)}
                >
                  {copiedId === `scenario-${index}` ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseScenario(scenario)}
                >
                  Use This Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
