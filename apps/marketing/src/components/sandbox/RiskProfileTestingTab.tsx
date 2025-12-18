import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { RiskProfileBadge } from '@/components/enterprise/RiskProfileBadge';
import { RiskRadarChart } from './RiskRadarChart';
import { Badge } from '@/components/ui/badge';

interface RiskDimensionSlidersProps {
  onDimensionsChange: (scores: any) => void;
}

const RiskDimensionSliders = ({ onDimensionsChange }: RiskDimensionSlidersProps) => {
  const [scores, setScores] = useState({
    dataSensitivity: 50,
    externalExposure: 50,
    modelTransparency: 50,
    misuseVectors: 50,
    legalIPRisk: 50,
    operationalCriticality: 50
  });

  const updateScore = (dimension: string, value: number[]) => {
    const newScores = { ...scores, [dimension]: value[0] };
    setScores(newScores);
    onDimensionsChange(newScores);
  };

  return (
    <div className="space-y-4">
      {Object.entries(scores).map(([dimension, score]) => (
        <div key={dimension} className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm capitalize">
              {dimension.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Badge variant="outline">{score}</Badge>
          </div>
          <Slider
            value={[score]}
            onValueChange={(v) => updateScore(dimension, v)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      ))}
    </div>
  );
};

export const RiskProfileTestingTab = () => {
  const [selectedTier, setSelectedTier] = useState<string>('medium');
  const [dimensionScores, setDimensionScores] = useState({
    dataSensitivity: 50,
    externalExposure: 50,
    modelTransparency: 50,
    misuseVectors: 50,
    legalIPRisk: 50,
    operationalCriticality: 50
  });

  const calculateTier = (scores: any): string => {
    const weights = {
      dataSensitivity: 0.25,
      externalExposure: 0.20,
      modelTransparency: 0.15,
      misuseVectors: 0.15,
      legalIPRisk: 0.15,
      operationalCriticality: 0.10
    };
    
    const weightedScore = 
      scores.dataSensitivity * weights.dataSensitivity +
      scores.externalExposure * weights.externalExposure +
      scores.modelTransparency * weights.modelTransparency +
      scores.misuseVectors * weights.misuseVectors +
      scores.legalIPRisk * weights.legalIPRisk +
      scores.operationalCriticality * weights.operationalCriticality;
    
    if (weightedScore < 20) return 'minimal';
    if (weightedScore < 40) return 'low';
    if (weightedScore < 60) return 'medium';
    if (weightedScore < 80) return 'high';
    return 'critical';
  };

  const currentTier = calculateTier(dimensionScores);

  const auditChecklists: Record<string, string[]> = {
    minimal: ['usage_tracking', 'basic_logging', 'access_controls'],
    low: ['usage_tracking', 'basic_logging', 'access_controls', 'periodic_review', 'content_spot_checks'],
    medium: ['usage_tracking', 'basic_logging', 'access_controls', 'enhanced_monitoring', 'human_review', 'data_protection_audit', 'quarterly_compliance_check'],
    high: ['usage_tracking', 'basic_logging', 'access_controls', 'explainability_review', 'bias_testing', 'legal_sign_off', 'monthly_audits', 'incident_response_plan'],
    critical: ['usage_tracking', 'basic_logging', 'access_controls', 'full_model_audit', 'continuous_monitoring', 'real_time_oversight', 'liability_insurance', 'regulatory_filing']
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Risk Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
              {['minimal', 'low', 'medium', 'high', 'critical'].map(tier => (
                <div key={tier} className="flex items-center space-x-2">
                  <RadioGroupItem value={tier} id={tier} />
                  <Label htmlFor={tier} className="flex-1">
                    <RiskProfileBadge tier={tier as any} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adjust Risk Dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDimensionSliders onDimensionsChange={setDimensionScores} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Calculated Risk Profile
              <RiskProfileBadge tier={currentTier as any} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskRadarChart dimensionScores={dimensionScores} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit Checklist ({auditChecklists[currentTier].length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditChecklists[currentTier].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
