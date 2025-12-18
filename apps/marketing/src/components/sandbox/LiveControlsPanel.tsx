import { useState } from 'react';
import { RiskDial } from './RiskDial';
import { RiskSliders } from './RiskSliders';
import { ControlsChecklist } from './ControlsChecklist';
import { ApprovalPathViewer } from './ApprovalPathViewer';
import { RiskLevel, RiskFactor } from './types/risk';

interface LiveControlsPanelProps {
  initialRiskScore?: number;
  onRiskChange?: (newScore: number) => void;
}

export const LiveControlsPanel = ({ 
  initialRiskScore = 0.73,
  onRiskChange 
}: LiveControlsPanelProps) => {
  const [riskScore, setRiskScore] = useState(initialRiskScore);
  
  // Calculate risk level from score
  const getRiskLevel = (score: number): RiskLevel => {
    if (score < 0.2) return 'low';
    if (score < 0.4) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.8) return 'high';
    return 'critical';
  };

  const [riskFactors] = useState<RiskFactor[]>([
    {
      name: 'Data Sensitivity & Privacy',
      score: 0.78,
      weight: 0.25,
      description: 'PHI/PII processing, data protection controls',
      recommendation: 'Add data masking to reduce exposure risk by ~30%'
    },
    {
      name: 'External Exposure & Decision Impact',
      score: 0.92,
      weight: 0.20,
      description: 'Customer-facing outputs, high-stakes decisions',
      recommendation: 'Implement human review for external-facing content'
    },
    {
      name: 'Model Transparency',
      score: 0.45,
      weight: 0.15,
      description: 'Black box model with limited explainability',
      recommendation: 'Add interpretability tools for audit compliance'
    },
    {
      name: 'Misuse / Adversarial Vectors',
      score: 0.63,
      weight: 0.15,
      description: 'Prompt injection risks, hallucination potential',
      recommendation: 'Enable comprehensive input/output filtering'
    },
    {
      name: 'Legal / IP Risk',
      score: 0.55,
      weight: 0.15,
      description: 'Copyright concerns, regulatory violations',
      recommendation: 'Add legal review for generated content'
    },
    {
      name: 'Operational Criticality',
      score: 0.40,
      weight: 0.10,
      description: 'Moderate business impact if unavailable',
      recommendation: 'Implement backup procedures'
    }
  ]);

  const controls = [
    {
      id: 'data-masking',
      name: 'Data Masking',
      status: 'pass' as const,
      description: 'PHI fields redacted before processing',
      expectedImpact: 15
    },
    {
      id: 'encryption',
      name: 'Encryption',
      status: 'partial' as const,
      description: 'In-transit only',
      aiSuggestion: 'Add at-rest encryption for stored model outputs',
      expectedImpact: 12
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      status: 'fail' as const,
      description: 'Missing for batch operations',
      aiSuggestion: 'Enable comprehensive logging to meet 21 CFR Part 11 requirements',
      expectedImpact: 20
    }
  ];

  const approvalStages = [
    {
      id: 'you',
      name: 'Policy Selection',
      status: 'completed' as const,
      approver: 'You',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'review-bot',
      name: 'Compliance Check',
      status: 'current' as const,
      approver: 'ReviewBot'
    },
    {
      id: 'final',
      name: 'Final Approval',
      status: 'pending' as const,
    }
  ];

  const handleRiskSliderChange = (params: {
    sensitivity: number;
    vendorRisk: number;
    exposure: number;
  }) => {
    // Calculate weighted risk score
    const newScore = (
      (params.sensitivity * 0.4 + 
       params.vendorRisk * 0.3 + 
       params.exposure * 0.3) / 100
    );
    setRiskScore(newScore);
    onRiskChange?.(newScore);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Column 1: Risk Dial + Sliders */}
      <div className="space-y-6">
        <div className="flex justify-center">
          <RiskDial
            riskScore={riskScore}
            riskLevel={getRiskLevel(riskScore)}
            factors={riskFactors}
            size="lg"
          />
        </div>
        <RiskSliders onRiskChange={handleRiskSliderChange} />
      </div>

      {/* Column 2: Controls Checklist */}
      <div>
        <h3 className="font-semibold mb-4">Controls</h3>
        <ControlsChecklist controls={controls} />
      </div>

      {/* Column 3: Approval Path */}
      <div>
        <ApprovalPathViewer stages={approvalStages} />
      </div>
    </div>
  );
};
