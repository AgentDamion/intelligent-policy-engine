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

---

## Universal Platform Adapter — README

### What this is
A modular, Edge-safe adapter layer for integrating external platforms (e.g., Veeva Vault, SharePoint) from Supabase Edge Functions. It standardizes auth, upload, and metadata operations, with a clear path to add new platforms quickly.

---

## Directory map

```
supabase/
  functions/
    shared/
      platform-adapter-types.ts      # Canonical contracts/types
      platform-adapter-base.ts       # Reusable base with retry, HTTP, health
      metadata-transformer.ts        # Universal → platform-specific mapping
      credential-manager.ts          # Env-backed credential loader
      validation-schemas.ts          # Zod schemas (Edge-safe)
      auth-headers.ts                # Authorization header builders

    platform-universal/
      index.ts                       # Generic Universal Platform API stub

    platform-manager/
      index.ts                       # Placeholder manager API

    webhook-manager/
      index.ts                       # Generic webhook receiver stub

    platform-veeva/
      index.ts                       # Function entrypoint (/health, /upload)
      adapter.ts                     # VeevaAdapter (upload + metadata)

    platform-sharepoint/
      index.ts                       # Function entrypoint (/health, /upload)
      adapter.ts                     # SharePointAdapter (upload + metadata)

    # Initial prototype components (optional utility / registry)
    platform-adapter/
      interface.ts                   # Prototype interface + helpers
      registry.ts                    # Prototype registry/factory
      auth.ts                        # Prototype auth helpers

  migrations/
    20250107000000_platform_adapter_foundation.sql
    20250107000001_platform_configurations.sql
```

Tests and fixtures:
```
tests/platform-integration/
  fixtures/sample-upload.json        # Example upload payload
  integration/upload.test.mjs        # Posts to /platform-veeva/upload and /platform-sharepoint/upload
```

Docs (you can place this README under `docs/platform-adapters/README.md`).

---

## Core concepts

### Shared contracts
- `platform-adapter-types.ts`
  - Defines `PlatformAdapter`, `ComplianceMetadata`, `FileUploadRequest/Result`, `PlatformCredentials`, `Webhook*` types, and health/metrics contracts.
- `validation-schemas.ts`
  - Zod schemas for inputs; safe to use in Supabase Edge Functions.

### Base adapter
- `platform-adapter-base.ts`
  - Provides `makeRequest` with retry/backoff, basic error shaping, `ensureAuthenticated`, `validateConnection`, `getHealth`, and utility validators (`validateFileSize`, `validateFileType`).
  - Adapters extend this to implement `authenticate`, `uploadFile`, `attachMetadata`.

### Metadata transformer
- `metadata-transformer.ts`
  - Maps universal metadata to each platform via deterministic, flat key mapping.
  - Includes `toVeeva` and `toSharePoint`, and a `flatten` utility to add mappings incrementally.

### Credential manager
- `credential-manager.ts`
  - Loads credentials from environment (`VEEVA_*`, `SHAREPOINT_*`, …). Designed to be replaced by a KMS or Supabase secrets service later.

### Auth header builders
- `auth-headers.ts`
  - `buildAuthHeaders(credentials)`: produces `Authorization` / `Cookie` headers for `oauth2`, `api_key`, `basic`, `session`, `jwt`.
  - `mergeHeaders(base, extra)` helper.

---

## Implemented adapters

### Veeva Vault
- Files: `platform-veeva/adapter.ts`, `platform-veeva/index.ts`
- Capabilities: file upload, metadata attach, webhook-ready stub.
- Endpoints:
  - `GET /health` → `{ platform: "veeva", status: "ok" }`
  - `POST /upload` → `FileUploadResult`

### SharePoint
- Files: `platform-sharepoint/adapter.ts`, `platform-sharepoint/index.ts`
- Capabilities: file upload, metadata attach, webhook-ready stub.
- Endpoints:
  - `GET /health` → `{ platform: "sharepoint", status: "ok" }`
  - `POST /upload` → `FileUploadResult`

Both adapters:
- Extend `BasePlatformAdapter`
- Use `buildAuthHeaders` for platform-specific Authorization/Cookie headers
- Use `MetadataTransformer` to map the universal metadata into platform fields

---

## Database foundation

`20250107000000_platform_adapter_foundation.sql` creates:
- `platform_configurations` — per-org platform setup, encrypted creds reference
- `platform_integration_logs` — operation log table (upload, metadata, webhook)
- `platform_integration_jobs` — queue table for async ops
- `platform_webhooks` — platform webhook registry
- `platform_metrics` — basic metrics storage

Use your existing migration runner or Supabase CLI to apply.

---

## Environment variables

Set per-platform variables (example):

Veeva:
- `VEEVA_AUTH_TYPE` (e.g., `oauth2`, `api_key`, `jwt`, `basic`, `session`)
- `VEEVA_BASE_URL`
- `VEEVA_ACCESS_TOKEN` / `VEEVA_API_KEY` / `VEEVA_USERNAME` / `VEEVA_PASSWORD` (as applicable)
- Optional: `VEEVA_AUTH_URL`, `VEEVA_TOKEN_URL`, `VEEVA_API_VERSION`, `VEEVA_EXPIRES_AT`

SharePoint:
- `SHAREPOINT_AUTH_TYPE`
- `SHAREPOINT_BASE_URL`
- `SHAREPOINT_ACCESS_TOKEN` (or `SHAREPOINT_USERNAME`/`SHAREPOINT_PASSWORD`, etc.)
- Optional: `SHAREPOINT_AUTH_URL`, `SHAREPOINT_TOKEN_URL`, `SHAREPOINT_API_VERSION`, `SHAREPOINT_EXPIRES_AT`

The `CredentialManager` reads `*_BASE_URL`, `*_AUTH_TYPE`, and corresponding credential fields.

---

## Function endpoints

- Universal/API Stubs:
  - `platform-universal/index.ts`: `POST /test` — basic echo
  - `platform-manager/index.ts`: informational stub
  - `webhook-manager/index.ts`: generic webhook receiver stub

- Veeva:
  - `GET platform-veeva/health`
  - `POST platform-veeva/upload`

- SharePoint:
  - `GET platform-sharepoint/health`
  - `POST platform-sharepoint/upload`

Base URL in local dev usually: `http://localhost:54321/functions/v1`

---

## Payload example

`tests/platform-integration/fixtures/sample-upload.json`
```json
{
  "file": {
    "name": "compliance-report.pdf",
    "content": "JVBERi0xLjQK...BASE64_OR_TEXT_SAMPLE...",
    "mime_type": "application/pdf",
    "size": 12345
  },
  "metadata": {
    "aicomplyr": {
      "version": "1.0",
      "generated_at": "2025-01-01T00:00:00Z",
      "project_id": "proj_123",
      "organization_id": "org_abc"
    },
    "compliance": {
      "status": "compliant",
      "score": 98,
      "risk_level": "low",
      "last_checked": "2025-01-01T00:00:00Z"
    },
    "ai_tools": [],
    "policy_checks": [],
    "violations": [],
    "references": {
      "detailed_report_url": "https://example.com/report",
      "audit_trail_url": "https://example.com/audit"
    }
  },
  "overwrite": true
}
```

Note: If sending binary content to Edge functions, encode to base64 or provide as `Uint8Array`. The current adapters accept string or `Uint8Array`.

---

## Running a smoke test

1. Ensure functions are running (Supabase local or your dev stack).
2. Export environment variables for each platform as above.
3. Run the test runner:
```bash
node aicomplyr-intelligence/tests/platform-integration/integration/upload.test.mjs
```
- It posts the same payload to `platform-veeva/upload` and `platform-sharepoint/upload`.
- Use `FUNCTIONS_BASE_URL` to override the default `http://localhost:54321/functions/v1`.

---

## Extending to a new platform

1. Create `supabase/functions/platform-<name>/adapter.ts` that:
   - Extends `BasePlatformAdapter`
   - Implements `authenticate`, `uploadFile`, `attachMetadata`
   - Calls `buildAuthHeaders` for requests
   - Adds a mapping in `metadata-transformer.ts` (e.g., `to<Platform>()`)
2. Add a function entrypoint `platform-<name>/index.ts` with `/health` and `/upload`.
3. Define env variables: `<NAME>_AUTH_TYPE`, `<NAME>_BASE_URL`, and corresponding credentials.
4. (Optional) Write a `tests/platform-integration` fixture and expand the test runner.

---

## Notes on field naming

- The universal metadata includes `organization_id`. If your preferred naming is `enterprise_id`, keep mappings in the transformer to support both and standardize on `enterprise_id` for new data while maintaining backward compatibility [[memory:7616535]].

---

## Roadmap

- OAuth2 token refresh flows per platform (auth handlers)
- Webhook signing/verification helpers
- Job worker using `platform_integration_jobs` for async processing and retries
- Expand `metadata-transformer` maps with complete field coverage
- Add formal unit/integration tests per adapter and CI gates

---

## Security

- Use Supabase secrets or a secure env mechanism for credentials.
- Avoid logging sensitive fields; adapters currently only log high-level operation summaries.
- Consider encrypting `credentials_encrypted` at rest and managing decrypt in a secure runtime.

---

## Status

- Veeva and SharePoint adapters implemented (upload + metadata), including auth header injection.
- Universal API, Manager, and Webhook stubs ready.
- Database foundation migration added.
- Smoke tests and fixtures included.
