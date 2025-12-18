import { DemoScenario } from '@/types/intelligenceDemo';
import { ONCOLOGY_TOOL_APPROVAL } from './oncologyToolApproval';
import { PARTNER_RISK_ASSESSMENT } from './partnerRiskAssessment';
import { REGULATORY_CONFLICT } from './regulatoryConflict';

export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  'oncology-tool': ONCOLOGY_TOOL_APPROVAL,
  'partner-risk': PARTNER_RISK_ASSESSMENT,
  'regulatory-conflict': REGULATORY_CONFLICT
};

export const DEFAULT_SCENARIO_ID = 'oncology-tool';
