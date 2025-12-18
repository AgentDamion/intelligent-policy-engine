import { TransformedMessage } from '@/types/agentic';

export const W2_MOCK_THREADS = [
  {
    id: 'thread-1',
    title: 'HCP Image Generation Policy — Watermark Requirement',
    pills: [
      { label: 'PolicyAgent', kind: 'agent' as const },
      { label: 'EvidenceAgent', kind: 'agent' as const },
      { label: 'Sarah Chen', kind: 'agent' as const },
      { label: 'ComplianceAgent', kind: 'agent' as const },
      { label: 'Harmonizing', kind: 'status' as const }
    ],
    meta: '2m ago · 14 exchanges',
    status: 'active',
    participantCount: 4
  },
  {
    id: 'thread-2',
    title: 'Override Rate Spike — Midjourney v6.1',
    pills: [
      { label: 'AuditAgent', kind: 'agent' as const },
      { label: 'Marcus Liu', kind: 'agent' as const },
      { label: 'Needs Human Input', kind: 'status' as const }
    ],
    meta: '8m ago · 7 exchanges',
    status: 'active',
    participantCount: 2
  },
  {
    id: 'thread-3',
    title: 'Evidence Gap — Data Residency Proof',
    pills: [
      { label: 'ProofAgent', kind: 'agent' as const },
      { label: 'PolicyAgent', kind: 'agent' as const },
      { label: 'Aisha Patel', kind: 'agent' as const },
      { label: 'Complete', kind: 'status' as const }
    ],
    meta: '1h ago · 23 exchanges',
    status: 'complete',
    participantCount: 3
  }
];

export const W2_MOCK_MESSAGES: TransformedMessage[] = [
  {
    id: 'msg-1',
    agent: 'PolicyAgent',
    time: '14:32',
    text: "I've detected a conflict between POL-247 (watermark required) and the current Midjourney binding (watermark: optional). This affects 127 pending requests.",
    chips: [{ label: 'Pattern: Policy drift', kind: 'fact' }]
  },
  {
    id: 'msg-2',
    agent: 'EvidenceAgent',
    time: '14:33',
    text: 'Retrieving watermark compliance data from last 30 days across all image generation tools…',
    chips: []
  },
  {
    id: 'msg-3',
    agent: 'EvidenceAgent',
    time: '14:33',
    text: 'Found: Midjourney (watermark present: 23%), DALL-E (94%), Stable Diffusion (67%). Compliance gap: 71% of Midjourney outputs.',
    chips: [{ label: 'Evidence retrieved: 3,421 images analyzed', kind: 'fact' }]
  },
  {
    id: 'msg-4',
    agent: 'Sarah Chen',
    time: '14:35',
    text: 'Why is Midjourney so low? Are users disabling it or is the default off?',
    chips: []
  },
  {
    id: 'msg-5',
    agent: 'PolicyAgent',
    time: '14:35',
    text: 'Default binding sets watermark=false; only 12% users enable it. Recommend: set watermark=true.',
    chips: [{ label: 'Root cause: Default configuration', kind: 'fact' }]
  },
  {
    id: 'msg-6',
    agent: 'ComplianceAgent',
    time: '14:36',
    text: 'If enforced, 34% of users must update workflows. Disruption: Low (auto-fix). Risk reduction: High.',
    chips: [{ label: 'Harmonization proposal ready', kind: 'status' }]
  },
  {
    id: 'msg-7',
    agent: 'Sarah Chen',
    time: '14:38',
    text: 'Run a 10% canary for 7 days. Draft the EPS update?',
    chips: []
  },
  {
    id: 'msg-8',
    agent: 'PolicyAgent',
    time: '14:38',
    text: 'Drafting EPS v1.3 with watermark=true. Canary: 10% cohort, 7 days, success <5% complaints & >85% watermark presence.',
    chips: [{ label: 'Action: Canary plan', kind: 'status' }]
  }
];

export const W2_THREAD_METADATA = {
  'thread-1': {
    startedTime: '42m ago',
    exchangeCount: 14,
    participantCount: 4
  }
};
