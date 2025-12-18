import { DemoScenario } from '@/types/intelligenceDemo';

export const ONCOLOGY_TOOL_APPROVAL: DemoScenario = {
  id: 'oncology-tool',
  title: 'CRO Partner AI Tool Governance',
  description: 'Watch agents govern external partner AI tool usage in 18 seconds',
  duration: 90000,
  stages: [
    {
      id: 'intro',
      type: 'intro',
      duration: 5000,
      content: {
        intro: {
          title: 'CRO Partner AI Tool Governance Assessment',
          challenge: 'Ensure CRO\'s AI tool usage meets FDA 21 CFR Part 11 and data governance requirements',
          stakeholders: ['Regulatory Agent', 'Ethics Agent', 'Data Agent', 'Integration Agent'],
          successCriteria: ['Tool usage policy compliant', 'Audit trail comprehensive', 'Access controls verified']
        }
      },
      narrative: 'A pharmaceutical company is onboarding a CRO partner who uses AI tools for clinical trial data analysis. The challenge is ensuring their AI tool usage meets FDA 21 CFR Part 11 electronic records requirements and data governance policies at the partnership boundary.'
    },
    {
      id: 'agent-conversation',
      type: 'conversation',
      duration: 35000,
      narrative: 'Watch as regulatory, ethics, data, and integration agents collaborate to evaluate the CRO partner\'s AI tool usage policies against pharmaceutical compliance requirements. Notice how they verify governance controls, not clinical outcomes.',
      content: {
        messages: [
          {
            id: 'm1',
            agent: 'regulatory',
            content: 'Initiating partner tool governance assessment for CRO-GlobalTrials AI Tool: clinical-data-analyzer-v3.2. Checking against FDA 21 CFR Part 11 usage requirements.',
            timestamp: 0,
            reasoning: 'Starting with FDA Part 11 because the CRO will be handling electronic records that fall under our regulatory oversight.',
            policyReference: 'FDA-21CFR11-2024'
          },
          {
            id: 'm2',
            agent: 'data',
            content: 'Reviewing CRO\'s tool usage policy. Detected: Audit logging enabled, user access controls documented, data handling procedures defined.',
            timestamp: 3000,
            reasoning: 'We need to verify the partner has proper governance controls for their AI tool usage, not validate the tool\'s clinical accuracy.',
            policyReference: 'PARTNER-DATA-GOVERNANCE'
          },
          {
            id: 'm3',
            agent: 'ethics',
            content: 'Scanning tool usage policy for ethical governance. Checking: usage restrictions, transparency requirements, human oversight protocols.',
            timestamp: 6000,
            reasoning: 'Partner must have policies governing HOW they use AI tools, including oversight and accountability measures.',
            policyReference: 'ETHICS-GOVERNANCE-2024'
          },
          {
            id: 'm4',
            agent: 'regulatory',
            content: 'FDA Part 11 compliance check: ✓ Tool generates audit trails, ✓ CRO has access control policy, ✓ Electronic signatures for tool outputs documented.',
            timestamp: 10000,
            reasoning: 'Verifying the partner\'s governance framework ensures their tool usage creates compliant records.',
            policyReference: 'FDA-21CFR11-2024'
          },
          {
            id: 'm5',
            agent: 'ethics',
            content: 'Tool usage policy review complete. Human oversight: REQUIRED for all outputs. Transparency: Full audit trail. Accountability: Clear ownership documented.',
            timestamp: 14000,
            reasoning: 'The CRO has proper governance controls for responsible AI tool usage in our partnership.',
            policyReference: 'ETHICS-GOVERNANCE-2024'
          },
          {
            id: 'm6',
            agent: 'integration',
            content: 'Audit trail integration verified. CRO tool logs will flow to our compliance dashboard. Data exchange: Encrypted, traceable, immutable.',
            timestamp: 17000,
            reasoning: 'We can monitor partner tool usage in real-time through integrated audit systems.',
            policyReference: 'PARTNER-INTEGRATION-2024'
          },
          {
            id: 'm7',
            agent: 'data',
            content: 'Gap detected: CRO\'s tool usage audit retention is 3 years. Our policy requires 5 years for clinical trial data.',
            timestamp: 21000,
            reasoning: 'Identified a mismatch between partner policy and our data governance requirements.',
            policyReference: 'DATA-RETENTION-POLICY'
          },
          {
            id: 'm8',
            agent: 'regulatory',
            content: 'Resolution: CRO must extend audit log retention to 5 years for this partnership. Impact: Minimal - standard practice for clinical trials.',
            timestamp: 25000,
            reasoning: 'Partner can adjust their retention policy for our engagement. This is a governance boundary, not a technical barrier.',
            policyReference: 'PARTNER-GOVERNANCE-ALIGNMENT'
          },
          {
            id: 'm9',
            agent: 'integration',
            content: 'CRO confirmed retention extension feasible. Audit logs will be archived to compliant long-term storage. No partnership delays.',
            timestamp: 28000,
            reasoning: 'Verifying the partner can meet our governance requirements at the partnership boundary.',
            policyReference: 'PARTNER-COMPLIANCE'
          },
          {
            id: 'm10',
            agent: 'regulatory',
            content: 'Partner tool governance approved. Condition: Extend audit retention to 5 years. CRO\'s AI tool usage meets all policy requirements.',
            timestamp: 32000,
            reasoning: 'Governance alignment complete. Partner can use their AI tools under our oversight framework.',
            policyReference: 'PARTNER-APPROVAL-WORKFLOW'
          }
        ]
      }
    },
    {
      id: 'decision-making',
      type: 'decision',
      duration: 15000,
      narrative: 'The decision panel shows how agents evaluated the CRO\'s AI tool governance policies, identified the audit retention gap, and resolved it through partnership alignment. This governance assessment would typically require weeks of manual review.',
      content: {
        decision: {
          policyId: 'PARTNER-GOVERNANCE-FDA-2024',
          policyName: 'Partner AI Tool Governance - FDA 21 CFR Part 11',
          requirements: [
            { text: 'Partner tool generates audit trails for all usage', satisfied: true },
            { text: 'Access control policy documented and enforced', satisfied: true },
            { text: 'Electronic signatures for tool outputs', satisfied: true },
            { text: 'Human oversight required for AI decisions', satisfied: true },
            { text: 'Audit retention meets regulatory timeline', satisfied: true }
          ],
          conflicts: [
            {
              text: 'Audit retention: 3 years (CRO policy) vs 5 years (pharma requirement)',
              resolved: true,
              resolution: 'CRO will extend audit log retention to 5 years for this partnership. Standard practice for clinical trials.'
            }
          ],
          recommendation: 'APPROVE partner tool usage with condition: audit retention extended to 5 years',
          recommendationType: 'approve_with_conditions'
        }
      }
    },
    {
      id: 'proof-generation',
      type: 'proof',
      duration: 10000,
      narrative: 'The system generates a complete audit trail with cryptographic proof. Every governance decision is documented and immutable, ready for FDA inspection of partner oversight.',
      content: {
        proof: {
          auditTrail: [
            { timestamp: '2025-01-15T14:23:17.000Z', event: 'Partner tool governance assessment initiated', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:23:20.000Z', event: 'CRO tool usage policy review started', agent: 'data' },
            { timestamp: '2025-01-15T14:23:23.000Z', event: 'Ethical governance controls scanned', agent: 'ethics' },
            { timestamp: '2025-01-15T14:23:27.000Z', event: 'FDA Part 11 usage requirements verified', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:23:31.000Z', event: 'Tool usage policy approved (human oversight confirmed)', agent: 'ethics' },
            { timestamp: '2025-01-15T14:23:34.000Z', event: 'Audit trail integration validated', agent: 'integration' },
            { timestamp: '2025-01-15T14:23:38.000Z', event: 'Gap detected: audit retention policy', agent: 'data' },
            { timestamp: '2025-01-15T14:23:42.000Z', event: 'Resolution: CRO extends retention to 5 years', agent: 'regulatory' },
            { timestamp: '2025-01-15T14:23:45.000Z', event: 'Partner confirmed retention extension', agent: 'integration' },
            { timestamp: '2025-01-15T14:23:49.000Z', event: 'Partner tool governance approved with condition', agent: 'regulatory' }
          ],
          hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          timestamp: '2025-01-15T14:23:49.892Z',
          compliance: [
            'FDA 21 CFR Part 11 Partner Tool Governance',
            'Partner Data Governance Standards 2024',
            'AI Ethics Governance Framework 2024',
            'External Partner Integration Controls'
          ]
        }
      }
    },
    {
      id: 'outcome',
      type: 'outcome',
      duration: 25000,
      narrative: 'The AI governance system completed partner tool governance assessment in 18 seconds—a process that would typically take 45 days of manual policy review. The CRO can now use their AI tools under proper oversight.',
      content: {
        metrics: {
          timeSaved: '44 days, 23 hours',
          complianceScore: 97,
          riskReduction: 85,
          costImpact: '$2.1M'
        }
      }
    }
  ],
  metrics: {
    timeSaved: '44 days, 23 hours',
    complianceScore: 97,
    riskReduction: 85,
    costImpact: '$2.1M'
  }
};
