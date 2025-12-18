import type { InboxItem } from '@/components/agentic/inbox/types';

export const INBOX_MOCK_DATA: InboxItem[] = [
  {
    item_id: 'inbox-1',
    title: 'Stable Diffusion 3.0.1 policy check for Novartis Oncology',
    subtitle: 'Policy: eps_2025-11-08_a3f2 • Tool: stable-diffusion@3.0.1',
    participants: ['compliance-agent-v3', 'bias-detector-v2', 'sarah.chen@novartis'],
    narrative_status: 'Pending Human Review',
    last_updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    is_read: false,
    severity: 'high',
    item_type: 'tool_approval',
    metadata_badges: [
      { icon: '✓', label: 'Et PO', count: 2 },
      { icon: '⚠', label: 'Risks', count: 1 },
    ],
  },
  {
    item_id: 'inbox-2',
    title: 'GPT-4o drift detected in Pfizer promotional review workflow',
    subtitle: 'Workflow: pfizer-mlr-review-2024 • Alert: Version mismatch',
    participants: ['drift-monitor-v1', 'policy-resolver-v2', 'james.wilson@pfizer'],
    narrative_status: 'Under Investigation',
    last_updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
    is_read: false,
    severity: 'critical',
    item_type: 'drift_alert',
    metadata_badges: [
      { icon: '🔍', label: 'Analyzing' },
      { icon: '📊', label: 'Evidence', count: 5 },
    ],
  },
  {
    item_id: 'inbox-3',
    title: 'Policy snapshot #782 approved for Johnson & Johnson',
    subtitle: 'Policy: jnj_global_ai_v2.1 • Snapshot: 2025-11-08',
    participants: ['policy-validator-v3', 'meta-loop-agent', 'lisa.martinez@jnj'],
    narrative_status: 'Meta-Loop Validated',
    last_updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1d ago
    is_read: true,
    severity: 'low',
    item_type: 'policy_snapshot',
    metadata_badges: [
      { icon: '✓', label: 'Validated' },
      { icon: '📋', label: 'Clauses', count: 47 },
    ],
  },
  {
    item_id: 'inbox-4',
    title: 'Claude API 3.5 recertification required for GSK regulatory docs',
    subtitle: 'Client: GlaxoSmithKline • Tool: claude-3.5-sonnet',
    participants: ['cert-agent-v2', 'compliance-agent-v3', 'kevin.patel@gsk'],
    narrative_status: 'Needs Review',
    last_updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
    is_read: false,
    severity: 'medium',
    item_type: 'recertify',
    metadata_badges: [
      { icon: '🔄', label: 'Recert' },
      { icon: '⏰', label: 'Due', count: 3 },
    ],
  },
  {
    item_id: 'inbox-5',
    title: 'Midjourney v6 variance detected in Merck brand guidelines',
    subtitle: 'Brand: Merck Oncology • Variance: Image generation parameters',
    participants: ['variance-detector-v1', 'brand-guardian-v2', 'emma.taylor@merck'],
    narrative_status: 'In Review',
    last_updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago
    is_read: false,
    severity: 'medium',
    item_type: 'variance',
    metadata_badges: [
      { icon: '📸', label: 'Images', count: 12 },
      { icon: '⚖', label: 'Variance' },
    ],
  },
  {
    item_id: 'inbox-6',
    title: 'PCP review pending for AstraZeneca AI-generated patient education',
    subtitle: 'Campaign: AZ-Patient-Ed-2025 • PCP: Medical-legal review',
    participants: ['pcp-coordinator-v1', 'content-validator-v2', 'dr.michaels@astrazeneca'],
    narrative_status: 'Pending Human Review',
    last_updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
    is_read: false,
    severity: 'high',
    item_type: 'pcp_review',
    metadata_badges: [
      { icon: '👨‍⚕️', label: 'PCP' },
      { icon: '📄', label: 'Pages', count: 8 },
    ],
  },
  {
    item_id: 'inbox-7',
    title: 'DALL-E 3 proof incomplete for Roche HCP materials',
    subtitle: 'Project: Roche-HCP-Q4 • Missing: Usage attestation',
    participants: ['proof-auditor-v1', 'compliance-agent-v3', 'olivia.chen@roche'],
    narrative_status: 'Needs Review',
    last_updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
    is_read: true,
    severity: 'medium',
    item_type: 'proof_incomplete',
    metadata_badges: [
      { icon: '📋', label: 'Proof' },
      { icon: '⚠', label: 'Missing', count: 2 },
    ],
  },
  {
    item_id: 'inbox-8',
    title: 'System notice: New FDA guidance on AI transparency (November 2025)',
    subtitle: 'Regulation: FDA-AI-2025-113 • Impact: High',
    participants: ['regulatory-monitor-v1', 'policy-updater-v2'],
    narrative_status: 'Approved',
    last_updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2d ago
    is_read: true,
    severity: 'low',
    item_type: 'system_notice',
    metadata_badges: [
      { icon: '🏛', label: 'FDA' },
      { icon: '📢', label: 'Notice' },
    ],
  },
  {
    item_id: 'inbox-9',
    title: 'ChatGPT Enterprise evidence review for Sanofi clinical trial docs',
    subtitle: 'Trial: SANOFI-2025-CT-047 • Evidence: Usage logs',
    participants: ['evidence-collector-v2', 'audit-agent-v1', 'nathan.brooks@sanofi'],
    narrative_status: 'Under Investigation',
    last_updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
    is_read: false,
    severity: 'high',
    item_type: 'evidence_review',
    metadata_badges: [
      { icon: '🔍', label: 'Evidence' },
      { icon: '📊', label: 'Logs', count: 247 },
    ],
  },
  {
    item_id: 'inbox-10',
    title: 'Adobe Firefly audit complete for Eli Lilly patient campaigns',
    subtitle: 'Campaign: LL-Patient-Awareness-2025 • Status: Passed',
    participants: ['audit-agent-v1', 'compliance-agent-v3', 'sophia.garcia@lilly'],
    narrative_status: 'Human Verified',
    last_updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5d ago
    is_read: true,
    severity: 'low',
    item_type: 'audit',
    metadata_badges: [
      { icon: '✓', label: 'Passed' },
      { icon: '📊', label: 'Audit' },
    ],
  },
];
