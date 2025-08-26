# Architecture ⇄ Code Mapping

This document links the technical architecture and user stories to concrete implementations in this repository.

## Databases (migrations in `database/migrations/`)

- Agency onboarding and tool submissions
  - `006_create_agency_onboarding_system.sql`
    - `agency_ai_tools` (agency tool requests, status workflow)
    - `agency_compliance_requirements`, `agency_compliance_submissions`
    - `agency_onboarding_steps`, `agency_onboarding_progress`, `agency_audit_log`
- Multi-tenant and policies
  - `004_create_hierarchical_access_control.sql`: `enterprises`, `agency_seats`, `users`, `user_contexts`, `policies`, `seat_policy_assignments`, `context_audit_log`
  - `007_create_policy_distribution_system.sql`: `policy_distributions`, `agency_policy_compliance`, `policy_conflicts`
  - `008_create_policy_management_system.sql`: `organizations_enhanced`, `users_enhanced`, `policy_templates_enhanced`, `policies_enhanced`, `policy_rules`, `partners`
- Audit & contracts
  - `001_create_audit_premium_tables.sql`, `002_add_missing_audit_tables.sql`
  - `009_create_contract_management_system.sql`: `usage_events` (usage/metering), invoices, etc.

Notes: Diagram terms `ai_tools`, `tool_policies`, `tool_usage_logs` map to `agency_ai_tools`, `policies`/`policy_rules`, and `usage_events`/`agency_audit_log` respectively.

## APIs (selected)

- Agency Onboarding and Tool Approval: `api/agency-onboarding.js`
  - POST `/api/agency-onboarding/submit-tool` → inserts into `agency_ai_tools`
  - GET `/api/agency-onboarding/tools` → lists submissions with relationship status
  - PUT `/api/agency-onboarding/tools/:id/status` → updates submission status
- Policy Processing (Realtime Compliance): `api/routes.js`
  - POST `/api/process/policy` → executes `policy-check` workflow via `workflow-engine`
  - POST `/api/process/negotiation` → handles negotiation paths
- Policy Templates and Customization: `api/policy-templates.js`
  - GET `/api/policy-templates` and `/api/policy-templates/:id`
  - POST `/api/policy-templates/customize-policy` → creates org policies
- Validation Schemas: `api/validation/validation-schemas.js`, `api/validation/input-validator.js`

## Agents and Engines

- Agents: `agents/` (policy-agent, audit-agent, conflict-detection-agent, etc.)
- Orchestration & Workflow: `core/enhanced-orchestration-engine.js`, `core/workflow-engine.js`

## Frontend (UI)

- Tool Submission UI: `ui/src/app/tools/submit/ToolSubmitPage.tsx` and `ui/src/app/tools/submit/components/PolicyHints.tsx`
- Dashboards & Policy Distribution: `ui/src/components/PolicyDistributionDashboard.jsx`, `ui/src/components/SeatManagementDashboard.jsx`, `ui/src/components/LiveGovernanceStream.jsx`
- Services: `ui/src/services/contextApi.js`, `ui/src/services/hierarchicalContextApi.js`, `ui/src/services/tools.api.ts`

## Realtime & Events

- WebSocket endpoints and live streams integrated via `LiveGovernanceStream.jsx`
- Usage/metering events: `usage_events` in migration 009; audit via `audit_entries`

## Security & Middleware

- Middleware: `api/middleware/` (rate-limiting, security-headers, audit-logging, cors-security)
- Auth bridges: `api/auth/` (auth0 integration, hierarchical auth)

## Gaps & Next Steps

- Standardize naming to `ai_tools`, `tool_policies`, `tool_usage_logs` via new migrations, or continue with current names and add views.
- Implement explicit usage logging endpoints writing to `usage_events` and broadcasting via Realtime.
- Expand marketplace endpoints for discovery/verification agents to populate tool catalogue.