export type InboxItemType = 
  | 'variance' 
  | 'pcp_review' 
  | 'recertify' 
  | 'drift_alert' 
  | 'proof_incomplete'
  | 'policy_snapshot'
  | 'tool_approval'
  | 'audit'
  | 'evidence_review'
  | 'system_notice';

export type NarrativeStatus = 
  | 'Meta-Loop Validated'
  | 'Pending Human Review'
  | 'Human Verified'
  | 'In Review'
  | 'Needs Review'
  | 'Under Investigation'
  | 'Approved';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type QuickViewFilter = 'all' | 'reviews' | 'approvals' | 'alerts' | 'proofs' | 'system';
export type StatusFilter = 'open' | 'in_review' | 'blocked' | 'resolved';
export type TimeFilter = 'today' | 'last_7_days' | 'last_30_days' | 'custom';

export interface InboxItem {
  item_id: string;
  title: string;
  subtitle: string;
  participants: string[];
  narrative_status: NarrativeStatus;
  last_updated_at: string;
  is_read: boolean;
  severity: SeverityLevel;
  item_type: InboxItemType;
  metadata_badges: { icon: string; label: string; count?: number }[];
}

export interface InboxFilters {
  quickView: QuickViewFilter;
  status: StatusFilter[];
  severity: SeverityLevel[];
  time: TimeFilter;
  itemTypes: InboxItemType[];
  searchQuery: string;
  sortBy: 'most_recent' | 'oldest' | 'priority';
}
