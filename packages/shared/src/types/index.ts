// Core types for AICOMPLYR platform

export interface Enterprise {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  enterprise_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  enterprise_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  enterprise_id: string;
  workspace_id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  enterprise_id: string;
  workspace_id: string;
  policy_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  enterprise_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Business operations types
export interface Customer {
  id: string;
  enterprise_id: string;
  health_score: number;
  subscription_status: 'active' | 'inactive' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  email: string;
  company_name?: string;
  pipeline_stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  description?: string;
  price_cents: number;
  vendor_id: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  customer_id: string;
  template_id: string;
  amount_cents: number;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}