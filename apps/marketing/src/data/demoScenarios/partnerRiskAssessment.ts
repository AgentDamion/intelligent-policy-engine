import { DemoScenario } from '@/types/intelligenceDemo';

export const PARTNER_RISK_ASSESSMENT: DemoScenario = {
  id: 'partner-risk',
  title: 'Multi-Vendor AI Tool Governance',
  description: 'Multi-policy AI tool governance assessment across HIPAA, GCP, and GDPR in 45 seconds',
  duration: 60000,
  stages: [
    {
      id: 'intro',
      type: 'intro',
      duration: 5000,
      content: {
        intro: {
          title: 'Multi-Vendor AI Tool Governance Assessment',
          challenge: 'Assess third-party vendor AI tool usage policies across HIPAA, GCP, and GDPR',
          stakeholders: ['Regulatory Agent', 'Data Agent', 'Integration Agent'],
          successCriteria: ['Multi-policy governance verified', 'Tool usage risk score < 30', 'Remediation plan ready']
        }
      },
      narrative: 'A pharmaceutical company is evaluating multiple CRO vendors who use AI tools for clinical trial operations. Each vendor must demonstrate proper AI tool governance across HIPAA, GCP, and GDPR before partnership approval.'
    },
    {
      id: 'agent-conversation',
      type: 'conversation',
      duration: 25000,
      narrative: 'Agents simultaneously assess vendor AI tool governance across three major regulatory frameworks: HIPAA (US healthcare data), GCP (clinical trials), and GDPR (EU data protection). Focus is on HOW vendors govern their AI tool usage, not what the tools do.',
      content: {
        messages: [
          {
            id: 'm1',
            agent: 'regulatory',
            content: 'Multi-vendor AI tool governance assessment initiated. Evaluating: CRO-GlobalTrials AI tools. Frameworks: HIPAA, GCP, GDPR.',
            timestamp: 0,
            reasoning: 'Vendors using AI tools across international clinical trials must have governance policies aligned with multiple regulatory frameworks.',
            policyReference: 'MULTI-FRAMEWORK-TOOL-GOVERNANCE'
          },
          {
            id: 'm2',
            agent: 'data',
            content: 'HIPAA tool usage analysis: Vendor\'s AI tools process PHI. Governance policy shows: audit logging enabled, access controls defined, data encryption enforced.',
            timestamp: 4000,
            reasoning: 'We verify the vendor has proper governance for AI tools that handle Protected Health Information, not the tools themselves.',
            policyReference: 'HIPAA-TOOL-GOVERNANCE'
          },
          {
            id: 'm3',
            agent: 'regulatory',
            content: 'GCP tool governance check: Vendor AI tool usage follows ICH-GCP E6(R2). Tool outputs have human review requirement. Data integrity controls documented.',
            timestamp: 8000,
            reasoning: 'Good Clinical Practice requires human oversight of AI tool usage and proper documentation of tool-generated data.',
            policyReference: 'GCP-AI-GOVERNANCE'
          },
          {
            id: 'm4',
            agent: 'data',
            content: 'GDPR tool governance assessment: Vendor\'s AI tool usage policy addresses data subject rights. Cross-border tool access controls: Standard Contractual Clauses in place.',
            timestamp: 13000,
            reasoning: 'GDPR requires governance of how AI tools access and process EU citizen data across borders.',
            policyReference: 'GDPR-TOOL-GOVERNANCE'
          },
          {
            id: 'm5',
            agent: 'integration',
            content: 'Gap detected: Vendor\'s AI tool audit trail retention is 3 years. Our governance policy requires 5 years for clinical trial tools.',
            timestamp: 18000,
            reasoning: 'Identified a governance gap between vendor\'s AI tool audit practices and our partnership requirements.',
            policyReference: 'TOOL-AUDIT-RETENTION'
          },
          {
            id: 'm6',
            agent: 'regulatory',
            content: 'Remediation: Vendor must extend AI tool audit retention to 5 years for this partnership. Risk level: LOW. Standard governance alignment.',
            timestamp: 22000,
            reasoning: 'This is a standard governance boundary adjustment that ensures proper oversight of partner AI tool usage.',
            policyReference: 'GOVERNANCE-ALIGNMENT'
          }
        ]
      }
    },
    {
      id: 'decision-making',
      type: 'decision',
      duration: 12000,
      narrative: 'The system generates a comprehensive AI tool governance risk score and provides actionable remediation steps for partnership boundary alignment.',
      content: {
        decision: {
          policyId: 'MULTI-FRAMEWORK-TOOL-GOV-2024',
          policyName: 'International Vendor AI Tool Governance Framework',
          requirements: [
            { text: 'HIPAA: AI tool governance for PHI processing', satisfied: true },
            { text: 'GCP: Human oversight of AI tool usage documented', satisfied: true },
            { text: 'GDPR: Data subject rights in AI tool policy', satisfied: true },
            { text: 'Cross-border AI tool access controls in place', satisfied: true },
            { text: 'AI tool audit retention meets requirements', satisfied: false }
          ],
          conflicts: [
            {
              text: 'AI tool audit retention: 3 years (vendor) vs 5 years (pharma requirement)',
              resolved: false,
              resolution: 'Vendor must extend AI tool audit log retention to 5 years for clinical trial partnerships'
            }
          ],
          recommendation: 'APPROVE vendor AI tool usage with governance alignment required within 14 days',
          recommendationType: 'approve_with_conditions'
        }
      }
    },
    {
      id: 'outcome',
      type: 'outcome',
      duration: 18000,
      narrative: 'AI tool governance assessment completed with clear remediation path. The vendor can align their AI tool policies with our governance requirements before partnership begins.',
      content: {
        metrics: {
          timeSaved: '12 days',
          complianceScore: 89,
          riskReduction: 72,
          costImpact: '$450K'
        }
      }
    }
  ],
  metrics: {
    timeSaved: '12 days',
    complianceScore: 89,
    riskReduction: 72,
    costImpact: '$450K'
  }
};
