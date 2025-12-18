import { DemoScenario } from '@/types/intelligenceDemo';

export const REGULATORY_CONFLICT: DemoScenario = {
  id: 'regulatory-conflict',
  title: 'Cross-Border Partner Tool Governance',
  description: 'Watch AI agents resolve conflicting partner AI tool governance requirements in 2 minutes',
  duration: 120000,
  stages: [
    {
      id: 'intro',
      type: 'intro',
      duration: 5000,
      content: {
        intro: {
          title: 'Cross-Border AI Tool Governance Conflict',
          challenge: 'Harmonize conflicting AI tool governance requirements between US and EU partner operations',
          stakeholders: ['Regulatory Agent', 'Integration Agent', 'Data Agent'],
          successCriteria: ['Unified governance framework', 'Both jurisdictions compliant', 'Partner alignment achieved']
        }
      },
      narrative: 'A pharmaceutical company works with a CRO partner operating in both US and EU. The partner\'s AI tool usage must satisfy FDA 21 CFR Part 11 (US) and EMA Annex 11 (EU) governance requirements, which have conflicting audit trail specifications.'
    },
    {
      id: 'agent-conversation',
      type: 'conversation',
      duration: 50000,
      narrative: 'Watch how agents analyze partner AI tool governance across US and EU jurisdictions, identify conflicting audit trail requirements, and harmonize a unified governance framework that satisfies both regulatory boundaries.',
      content: {
        messages: [
          {
            id: 'm1',
            agent: 'regulatory',
            content: 'Cross-border partner tool governance assessment initiated. Partner: GlobalCRO operates in US and EU. AI Tool: trial-management-ai-v4.1',
            timestamp: 0,
            reasoning: 'Partners operating across jurisdictions must align AI tool governance with each region\'s requirements.',
            policyReference: 'CROSS-BORDER-GOVERNANCE'
          },
          {
            id: 'm2',
            agent: 'regulatory',
            content: 'FDA 21 CFR Part 11 requirement: AI tool audit trails must capture user identity, timestamp, reason for change, before/after values. Retention: 5 years.',
            timestamp: 5000,
            reasoning: 'FDA requires comprehensive audit trails for electronic records in clinical trials.',
            policyReference: 'FDA-21CFR11-AUDIT'
          },
          {
            id: 'm3',
            agent: 'regulatory',
            content: 'EMA Annex 11 requirement: AI tool audit trails must capture user, timestamp, and action. GDPR compliance: data minimization, 7-year retention for clinical trials.',
            timestamp: 10000,
            reasoning: 'EMA has similar audit requirements but GDPR adds data minimization and longer retention.',
            policyReference: 'EMA-ANNEX11-GDPR'
          },
          {
            id: 'm4',
            agent: 'data',
            content: 'Conflict identified: FDA requires "reason for change" field. GDPR data minimization discourages collecting unnecessary data. Retention: FDA 5 years vs EMA/GDPR 7 years.',
            timestamp: 16000,
            reasoning: 'Different regulatory philosophies: FDA wants more data for oversight, GDPR wants less data for privacy.',
            policyReference: 'AUDIT-GOVERNANCE-CONFLICT'
          },
          {
            id: 'm5',
            agent: 'regulatory',
            content: 'Analyzing harmonization strategies. Option A: Dual audit systems (expensive). Option B: Unified system meeting both requirements. Option C: Regional configuration.',
            timestamp: 22000,
            reasoning: 'Partners need a practical governance framework that works across both jurisdictions without dual systems.',
            policyReference: 'HARMONIZATION-OPTIONS'
          },
          {
            id: 'm6',
            agent: 'integration',
            content: 'Cost analysis: Option A: $400K dual systems. Option B: $180K unified system with conditional fields. Option C: $250K with regional complexity.',
            timestamp: 29000,
            reasoning: 'Unified governance system is most cost-effective if we can satisfy both regulatory requirements.',
            policyReference: 'GOVERNANCE-ECONOMICS'
          },
          {
            id: 'm7',
            agent: 'regulatory',
            content: 'Recommendation: Unified audit system with conditional "reason" field (optional in EU, required in US). Retention: 7 years globally (satisfies both).',
            timestamp: 36000,
            reasoning: 'Making "reason" field optional in EU satisfies GDPR minimization while keeping FDA compliance in US operations.',
            policyReference: 'UNIFIED-AUDIT-FRAMEWORK'
          },
          {
            id: 'm8',
            agent: 'data',
            content: 'Validating unified approach: FDA compliance maintained with required fields. GDPR compliance achieved through conditional collection and 7-year retention.',
            timestamp: 42000,
            reasoning: 'Checking that the unified governance framework meets both jurisdictions\' underlying compliance goals.',
            policyReference: 'DUAL-COMPLIANCE-VALIDATION'
          },
          {
            id: 'm9',
            agent: 'integration',
            content: 'Partner infrastructure assessment: GlobalCRO can implement unified audit system. Implementation: 6 weeks. Partner training: 2 weeks. No operational delays.',
            timestamp: 47000,
            reasoning: 'Ensuring the partner can adopt the unified governance framework without disrupting ongoing trials.',
            policyReference: 'PARTNER-READINESS'
          }
        ]
      }
    },
    {
      id: 'decision-making',
      type: 'decision',
      duration: 20000,
      narrative: 'The unified governance framework provides a clear path forward that satisfies both US and EU regulatory requirements while eliminating the need for expensive dual audit systems.',
      content: {
        decision: {
          policyId: 'CROSS-BORDER-TOOL-GOV-2024',
          policyName: 'FDA-EMA Unified Partner AI Tool Governance',
          requirements: [
            { text: 'FDA 21 CFR Part 11: User, timestamp, reason, before/after in audit trail', satisfied: true },
            { text: 'EMA Annex 11: User, timestamp, action in audit trail', satisfied: true },
            { text: 'GDPR: Data minimization in audit collection', satisfied: true },
            { text: 'FDA: 5-year audit retention minimum', satisfied: true },
            { text: 'EMA/GDPR: 7-year audit retention for clinical trials', satisfied: true }
          ],
          conflicts: [
            {
              text: 'Audit field requirements: FDA "reason" field vs GDPR data minimization',
              resolved: true,
              resolution: 'Unified system with conditional "reason" field: Required for US operations (FDA), Optional for EU operations (GDPR). 7-year retention globally satisfies both jurisdictions.'
            }
          ],
          recommendation: 'APPROVE unified partner AI tool governance framework for cross-border operations',
          recommendationType: 'approve_with_conditions'
        }
      }
    },
    {
      id: 'proof-generation',
      type: 'proof',
      duration: 15000,
      narrative: 'Governance documentation package includes compliance justification for both FDA and EMA jurisdictions, ready for partner implementation and regulatory inspection.',
      content: {
        proof: {
          auditTrail: [
            { timestamp: '2025-01-15T14:30:00.000Z', event: 'Cross-border partner governance assessment initiated', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:30:05.000Z', event: 'FDA 21 CFR Part 11 audit requirements documented', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:30:10.000Z', event: 'EMA Annex 11 + GDPR requirements documented', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:30:16.000Z', event: 'Conflict identified: audit trail governance', agent: 'data' },
            { timestamp: '2025-01-15T14:30:22.000Z', event: 'Governance harmonization options analyzed', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:30:29.000Z', event: 'Cost-benefit analysis completed', agent: 'integration' },
            { timestamp: '2025-01-15T14:30:36.000Z', event: 'Unified governance framework recommended', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:30:42.000Z', event: 'Dual-compliance validation verified', agent: 'data' },
            { timestamp: '2025-01-15T14:30:47.000Z', event: 'Partner implementation feasibility confirmed', agent: 'integration' },
            { timestamp: '2025-01-15T14:30:52.000Z', event: 'Cross-border governance framework approved', agent: 'regulatory' }
          ],
          hash: 'a4f2c8b91e7d3fa65c9b1d8e2f4a7c3b9d1e8f2a4c7b9d1e3f5a7c9b1d3e5f7a9',
          timestamp: '2025-01-15T14:30:52.445Z',
          compliance: [
            'FDA 21 CFR Part 11 Partner Tool Governance',
            'EMA Annex 11 Computerized Systems',
            'GDPR Data Protection in Clinical Trials',
            'ICH E6(R2) Good Clinical Practice'
          ]
        }
      }
    },
    {
      id: 'outcome',
      type: 'outcome',
      duration: 30000,
      narrative: 'The unified governance framework enables seamless cross-border partner operations while reducing governance costs by $220K and eliminating dual audit system complexity.',
      content: {
        metrics: {
          timeSaved: '89 days',
          complianceScore: 94,
          riskReduction: 78,
          costImpact: '$3.8M'
        }
      }
    }
  ],
  metrics: {
    timeSaved: '89 days',
    complianceScore: 94,
    riskReduction: 78,
    costImpact: '$3.8M'
  }
};
