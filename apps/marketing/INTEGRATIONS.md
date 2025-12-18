# Supabase Integration Matrix

## Page → Supabase Integration Overview

This document maps each page/area to its required Supabase integrations and development-time dependencies.

**Legend:**
- Auth = Supabase Auth (SSO/OAuth/JWT)
- DB = Postgres tables via @supabase/supabase-js or RPC
- Storage = Supabase Storage (files/evidence/exports)
- Realtime = Supabase Realtime (comments/tasks/notifications)
- Edge Fn/RPC = Supabase Edge Functions or Postgres RPC for secure server-side logic
- LLM/Ext = Calls to model providers or other external services (secured in Edge Fn)
- Cursor = Development-time only (migrations, types, schema/RLS automation)

| Area / Page | Core Purpose | Auth | DB Tables | Storage | Realtime | Edge Fn/RPC | LLM/Ext | Cursor (dev-time) |
|-------------|--------------|------|-----------|---------|----------|-------------|---------|-------------------|
| Auth (/auth, /invite, /select-org) | Login/SSO, accept invites, org/workspace context | ✅ | users, orgs, workspaces, partner_seats, invites, policy_acceptances | — | — | accept_invite(), link_identity() | Optional email provider | Define schemas + RLS; seed orgs/workspaces; auth domain rules |
| Enterprise Dashboard (/dashboard) | Org snapshot | ✅ | Aggregated reads on many tables | — | ✅ (live counters) | get_org_summary() | — | SQL views for summary; materialized views if needed |
| Agency Dashboard (/agency/dashboard) | Multi-client snapshot | ✅ | partner_seats, submissions, decisions, requirements, conflicts | — | ✅ | get_partner_summary() | — | Views + RLS by seat |
| Policies (/policies) | List/filters | ✅ | policies, policy_versions, distributions | — | — | — | — | Schema for versioning; RLS by org |
| Policy Studio (/policies/:id) | Author, distribute | ✅ | policies, policy_versions, distributions, audit_events | ✅ (export PDF) | — | distribute_policy(), export_policy_pdf() | ✅ (Meta suggestions) | Migrations for versioning tables; triggers to log edits |
| Workflows (/workflows, /workflows/runs) | Build + run approvals | ✅ | workflows, workflow_steps, workflow_runs, tasks | — | ✅ (task updates) | start_workflow(), advance_task() | — | RLS per role; step templates |
| Audit Trail (/audit-trail) | Immutable events | ✅ | audit_events (append-only) | ✅ (WORM export) | — | export_audit_pack() | — | Row-level append policies; cron retention |
| Partners (/partners, /partners/:id) | Partner 360 | ✅ | partners, partner_seats, tools, submissions, decisions, compliance_scores | — | — | recompute_partner_score() | — | Views with joins + RLS by org |
| Marketplace (/marketplace, /marketplace/tools/:id) | Discover tools | ✅ | tools, tool_versions, vendor_risk, tool_instances | — | — | request_access() | Optional vendor APIs | Seed data; typed enums for categories |
| Submission Wizard (/submission) | Create request | ✅ | submissions, use_cases, data_privacy_answers, risk_answers, technical_specs | ✅ (evidence upload) | ✅ (autosave status optional) | compute_score(submission_id), virus_scan(file_id), moderate_text() | ✅ (scoring/safety) | Migrations; RLS (submitter can read/write own draft) |
| Submission Receipt | Confirmation | ✅ | submissions | — | — | — | — | — |
| Agency Submissions (/agency/submissions, /:id) | List + detail | ✅ | submissions, comments, tasks, scores, evidence, activity | ✅ | ✅ (comments/tasks) | add_comment(), attach_evidence(), recompute_score() | — | RLS (by partner seat); row-level filters |
| Enterprise Queue (/submissions, /:id) | Review/triage | ✅ | Same as above + review_assignments | — | ✅ | request_changes(), approve_with_conditions() | — | Reviewer role policies; task SLAs |
| Decisions (/decisions, /:id) | Outcomes & letters | ✅ | decisions, decision_conditions, submissions | ✅ (decision letter PDFs) | — | issue_decision(), revalidate_schedule() | Optional e-signature | Triggers to lock submission on decision |
| Requirements (/requirements) | Active policies per client | ✅ | distributions, policy_versions, attestations | — | — | acknowledge_requirement() | — | Views of current vs previous version |
| Notifications (/notifications) | Inbox | ✅ | notifications | — | ✅ | mark_read() | — | DB triggers to create events |
| Search (/search) | Cross-entity search | ✅ | fts_index on multiple tables | — | — | search_all(q) (RPC) | Optional vector | Add FTS indexes; pgvector if needed |
| Tool Intelligence (/tool-intelligence) | Fleet & risk | ✅ | tool_instances, usage_events, vendor_risk, version_drift | — | — | sync_vendor_risk() | Vendor APIs | Materialized views |
| Analytics (/analytics) | Ops analytics | ✅ | Aggregates over submissions/decisions/workflows | — | — | get_analytics(range) | — | Materialized views + refresh job |
| Integrations (/agency/integrations) | Connectors | ✅ | integrations, webhook_secrets | — | — | install_integration(), webhooks | Slack/Jira/Drive | Secrets management + webhooks |
| Settings (/settings) | Org/workspace/users/SSO | ✅ | orgs, workspaces, users_roles, api_keys, sso_connections | — | — | rotate_api_key(), configure_sso() | WorkOS/Okta/Azure AD | RLS for admins only |

## Storage Buckets

- **evidence** (private): User-uploaded evidence files for submissions
- **exports** (private): Generated PDF exports (policy docs, decision letters, audit packs)
- **quarantine** (private): Files flagged by virus scanning (Edge Function access only)

## Realtime Channels

- `submissions:<id>` - Comments, tasks, and status updates for specific submissions
- `notifications:<user_id>` - User-specific inbox notifications
- `workflows:<run_id>` - Task updates and workflow progress
- `presence:dashboard` - Live user presence on dashboards

## Edge Function Contracts

### compute_score
**Purpose:** Score a submission and persist results
```typescript
// Input
{ submission_id: UUID, run_mode?: 'fast' | 'full' }

// Output
{ submission_id, overall: number, categories: Record<string,string>, run_id }
```

### distribute_policy
**Purpose:** Distribute a policy version to workspaces/partners
```typescript
// Input
{ policy_version_id: UUID, workspace_ids?: UUID[], partner_ids?: UUID[], note?: string }

// Output
{ policy_version_id, distributions_created: number }
```

### issue_decision
**Purpose:** Create a decision for a submission
```typescript
// Input
{ submission_id: UUID, outcome: 'approved'|'restricted'|'rejected', conditions?: string, expires_at?: ISO, notify?: boolean }

// Output
{ decision_id, submission_id, outcome }
```

### export_pdf
**Purpose:** Generate PDF exports for various entities
```typescript
// Input
{ entity: 'policy'|'submission'|'decision'|'audit_pack', entity_id: UUID }

// Output
{ path, signed_url, expires_in }
```

### virus_scan
**Purpose:** Scan uploaded files for viruses
```typescript
// Input
{ bucket: string, path: string, evidence_id?: UUID }

// Output
{ status: 'clean'|'infected', engine: 'stub', evidence_id?: UUID }
```

## Client Usage Examples

```typescript
// Score a submission
const { data } = await supabase.functions.invoke('compute_score', {
  body: { submission_id: selectedId, run_mode: 'fast' }
});

// Distribute a policy
const { data } = await supabase.functions.invoke('distribute_policy', {
  body: { 
    policy_version_id: versionId, 
    workspace_ids: [workspaceId], 
    note: 'Urgent compliance update' 
  }
});

// Issue a decision
const { data } = await supabase.functions.invoke('issue_decision', {
  body: { 
    submission_id: submissionId, 
    outcome: 'approved',
    conditions: 'Monthly compliance reviews required'
  }
});
```

## Setup Requirements

### Environment Variables (Edge Functions)
Set these in Supabase Functions Configuration:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function use only)

### Required Tables
Core tables referenced in Edge Functions (create via migrations):
- submissions, policies, policy_versions, distributions
- decisions, audit_events, evidence, scores
- workspaces, partners, notifications

### Development Workflow
1. **Migrations**: Use `supabase/migrations/` for schema changes
2. **Types**: Generate TypeScript types with `supabase gen types typescript`
3. **Functions**: Deploy with `supabase functions deploy <function-name>`
4. **Testing**: Use Supabase local development for testing

## Architecture Notes

- **No runtime Cursor dependency**: Pages connect only to Supabase at runtime
- **JWT Authentication**: All Edge Functions require authentication by default
- **RLS Policies**: Implement row-level security for all user-specific data
- **Service Role**: Edge Functions use service role for elevated permissions
- **CORS**: All Edge Functions include proper CORS headers for web client access