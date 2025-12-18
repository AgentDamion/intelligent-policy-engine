// Governance data layer - stub for future Supabase/FastAPI integration

export type GovernanceEventType = 'policy' | 'audit' | 'tool_request';
export type GovernanceStatus = 'pending' | 'approved' | 'flagged';

export interface GovernanceEvent {
  id: string;
  type: GovernanceEventType;
  title: string;
  summary?: string;
  status: GovernanceStatus;
  reviewed_by?: string;
  ai_confidence?: number;
  metaLoopValidated?: boolean;
  timestamp: string;
  source?: string;
  partner?: string;
  policy_id?: string;
  tool_name?: string;
}

export interface GovernanceKPIs {
  totalEvents: number;
  pendingReview: number;
  approvedToday: number;
  flaggedItems: number;
  avgConfidence: number;
  metaLoopActive: boolean;
}

// TODO: Replace with Supabase Realtime subscription
export async function fetchGovernanceEvents(): Promise<GovernanceEvent[]> {
  // Simulate latency
  await new Promise(r => setTimeout(r, 400));
  
  // Mock data for development
  return [
    {
      id: '1',
      type: 'policy',
      title: 'New AI Usage Policy - GPT-4 Integration',
      summary: 'Policy requires approval for GPT-4 usage in customer-facing content',
      status: 'pending',
      ai_confidence: 0.92,
      metaLoopValidated: true,
      timestamp: new Date().toISOString(),
      partner: 'Acme Marketing Agency',
      policy_id: 'POL-2025-001'
    },
    {
      id: '2',
      type: 'audit',
      title: 'Tool Usage Audit - Midjourney v6',
      summary: 'Detected usage of Midjourney v6 without prior approval',
      status: 'flagged',
      ai_confidence: 0.87,
      metaLoopValidated: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      partner: 'Creative Studio Plus',
      tool_name: 'Midjourney v6'
    },
    {
      id: '3',
      type: 'tool_request',
      title: 'Tool Request - Claude 3 Opus',
      summary: 'Agency requesting approval for Claude 3 Opus for legal document review',
      status: 'pending',
      ai_confidence: 0.95,
      metaLoopValidated: true,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      partner: 'Legal Services Co',
      tool_name: 'Claude 3 Opus'
    },
    {
      id: '4',
      type: 'policy',
      title: 'Policy Update - Data Retention Requirements',
      summary: 'Updated retention policy for AI-generated content',
      status: 'approved',
      reviewed_by: 'Sarah Chen',
      ai_confidence: 0.98,
      metaLoopValidated: true,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      partner: 'Enterprise Client A'
    }
  ];
}

// TODO: Replace with FastAPI /live_metrics endpoint
export async function fetchGovernanceKPIs(): Promise<GovernanceKPIs> {
  await new Promise(r => setTimeout(r, 300));
  
  return {
    totalEvents: 247,
    pendingReview: 12,
    approvedToday: 34,
    flaggedItems: 3,
    avgConfidence: 0.91,
    metaLoopActive: true
  };
}

export async function approveEvent(eventId: string): Promise<void> {
  // TODO: Implement Supabase update
  console.log('Approving event:', eventId);
  await new Promise(r => setTimeout(r, 200));
}

export async function flagEvent(eventId: string, reason: string): Promise<void> {
  // TODO: Implement Supabase update
  console.log('Flagging event:', eventId, 'Reason:', reason);
  await new Promise(r => setTimeout(r, 200));
}

export async function exportEvents(filters: any): Promise<Blob> {
  // TODO: Implement CSV export
  const csv = 'id,type,title,status,timestamp\n' +
    '1,policy,Sample Policy,pending,2025-01-15T10:00:00Z\n';
  return new Blob([csv], { type: 'text/csv' });
}
