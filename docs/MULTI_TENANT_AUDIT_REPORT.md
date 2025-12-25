# Multi-Tenant Technical Audit Report (Supabase + Codebase)

Generated from repository inspection (migrations + app code) on 2025-12-24.

> **Important**: This repo contains multiple, partially overlapping “schema worlds”:
> - **Node/Postgres schema** in `database/` + `database/migrations/` (context-aware JWT + `enterprises`, `user_contexts`, `partner_client_contexts`, etc.).
> - **Supabase schema** in `supabase/migrations/` (Proof Spine, policy artifacts/activations, agent/audit tables).
> - **Marketing Supabase schema** in `apps/marketing/supabase/migrations/` (brand workspaces + onboarding).
>
> Several Supabase migrations reference membership tables (e.g. `enterprise_members`, `workspace_members`) without their `CREATE TABLE` definitions present in the tracked migrations snapshot. Treat those as **required dependencies** to verify in the live Supabase project.

---

## Q1) Supabase Database Audit — Multi-Tenant Schema Assessment

### 1) Enterprise–Partner relationships

#### Node/Postgres model (`database/migrations/`)
- **Junction table**: `partner_enterprise_relationships`
- **Columns**:
  - `id`
  - `partner_enterprise_id` (FK → `enterprises.id`)
  - `client_enterprise_id` (FK → `enterprises.id`)
  - `relationship_status` (`active | pending | suspended | terminated`)
  - `relationship_type` (`agency | vendor | consultant | freelancer | other`)
  - `contract_start_date`, `contract_end_date`
  - `compliance_score`, `risk_level`
  - `settings` (JSONB per-relationship config bucket)
  - `created_at`, `updated_at`, `created_by` (FK → `users.id`)

#### Marketing Supabase model (`apps/marketing/supabase/migrations/`)
- **Sub-tenancy layer**: `brand_workspaces`
  - `agency_workspace_id` (FK → `workspaces.id`)
  - `client_enterprise_id` (FK → `enterprises.id`)
  - `brand_metadata` (JSONB), `is_active`, timestamps, etc.
- **Relationship table referenced but not defined in this repo snapshot**:
  - `client_agency_relationships` (referenced by code and seed data; DDL missing here).

### 2) Partner user structure

#### Node/Postgres model
- **Enterprise membership / roles**: `user_contexts`
  - `user_contexts.user_id` → `users.id`
  - `user_contexts.enterprise_id` → `enterprises.id`
  - optional `agency_seat_id` → `agency_seats.id`
- **Partner multi-client access**: `partner_client_contexts`
  - `user_id` → `users.id`
  - `partner_enterprise_id` → `enterprises.id`
  - `client_enterprise_id` → `enterprises.id`
  - `role`, `permissions` (JSONB), `is_active`, `is_default`
- **Single user → multiple client workspaces**: supported via multiple `partner_client_contexts` rows per user.

#### Supabase model (Policy Studio)
- App code (`apps/platform`) expects:
  - `enterprise_members`
  - `workspace_members`
- Migrations reference these tables in RLS policies and auth metadata functions, but their table definitions are not present in this repo snapshot.

### 3) Workspace/session tracking

#### Node/Postgres model
- **Session table**: `user_sessions`
  - Tracks current active `context_id` → `user_contexts.id`
- **Audit**: `context_audit_log` records context switches and actions.

#### Supabase model
- No `workspace_session_id` table found in migrations.
- Current context is implied by:
  - JWT/app_metadata (`supabase/migrations/20250829150000_add_auth_metadata_functions.sql`)
  - membership-based RLS (enterprise/workspace members).

### 4) Evidence and audit scoping

#### Evidence/proof (Supabase)
- Explicit `enterprise_id` present in:
  - `submissions.enterprise_id` (added by Proof Spine migration)
  - `proof_atoms.enterprise_id` (nullable; NULL = global)
  - `proof_packs.enterprise_id` (nullable; NULL = global)
  - `requirements_profiles.enterprise_id`
  - `submission_atom_states.enterprise_id`
  - `proof_bundles.enterprise_id`
- No `workspace_session_id` found in these tables.

#### Audit / agent observability (Supabase)
- Explicit `enterprise_id` present in:
  - `agent_activities.enterprise_id` (+ `workspace_id` optional)
  - `ai_agent_decisions.enterprise_id`
  - `governance_threads.enterprise_id`
  - `governance_audit_events.enterprise_id`

---

## Q2) Supabase Database Audit — RLS Policy Audit

### Key RLS patterns found in migrations

#### Organization-scoped RLS (`supabase/migrations/002_enhanced_rls_and_features.sql`)
- Typical USING clause: `organization_id IN (SELECT organization_id FROM users_enhanced WHERE id = auth.uid())`
- Applies to: `organizations_enhanced`, `users_enhanced`, `policies`, `contracts`, `audit_entries`, etc.

#### Enterprise/workspace-scoped RLS (`supabase/migrations/20250829140813_schema_standardization_and_improvements.sql`)
- `workspaces`: membership via `enterprise_members` (referenced)
- `tool_submissions`: membership via `workspace_members` (referenced)

#### Proof Spine RLS (`supabase/migrations/20250115000000_proof_requirements_spine_v1.sql`)
- Tenant isolation via:
  - `enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid())`
- Service role bypass exists and is explicit (full access).

#### Governance workflow tables (critical)
- `governance_threads`, `governance_actions`, `governance_audit_events`
  - **RLS is disabled in migrations** (explicit `DISABLE ROW LEVEL SECURITY`) and only placeholder policies are present in comments.
  - This is a **cross-tenant isolation risk** if deployed as-is.

### Summary answers
- **Partner access to multiple enterprises**: supported where users are members of multiple enterprises/workspaces and/or have multiple partner-client contexts (Node model).
- **Cross-tenant isolation risk**: high for governance tables with RLS disabled; also any service-role edge functions must validate inputs because they bypass RLS.
- **Audit trail security**: intended to be enterprise-scoped via `enterprise_id` + membership; currently undermined where RLS is disabled.

---

## Q3) Policy and Evidence Data Model

### Policy structure
- **Legacy org policies**: `policies` (org-scoped; `organization_id`, `content`, `version`, `status`)
- **Immutable policy references**:
  - `policy_artifacts` (OCI digests; immutable versioning)
  - `policy_activations` (what digest is active for `enterprise_id` and optional `workspace_id`)
  - Functions:
    - `get_active_policy_digest(enterprise, workspace)`
    - `get_policy_digest_at_time(enterprise, workspace, time)`

### Evidence attribution / “what policy was in effect”
- `policy_digest` exists on:
  - `governance_audit_events`
  - `agent_activities`
  - `ai_agent_decisions`
- Proof Spine seeds a `POLICY_SNAPSHOT_ID` atom intended to record the policy reference at decision time.

### Audit event structure / immutability
- `governance_actions` is designed as an immutable action log (no `updated_at`, stores `before_state` and `after_state`).
- `governance_audit_events` captures the full “action envelope” (surface, actor role, denial tracking, enterprise_id, etc.).

---

## Q4) Frontend Context Management

### `apps/platform`
- React context: `apps/platform/src/contexts/EnterpriseContext.tsx`
  - Determines enterprises from `enterprise_members` for current user
  - Stores `currentEnterprise`
- Policy scoping: `apps/platform/src/hooks/usePolicyContext.ts`
  - Fetches active policy digest via RPC + `policy_artifacts`/`policy_activations`
- UI switching:
  - `apps/platform/src/components/Layout.tsx` shows an enterprise dropdown, but does not perform an actual enterprise/workspace switch.

### `ui-`
- Zustand store: `ui-/src/stores/hierarchicalContextStore.js`
- Switcher component: `ui-/src/components/HierarchicalContextSwitcher.jsx`
  - Supports context switching and visual “active context” indicator.

### `apps/marketing`
- `useClientContext` + `ClientContextSwitcher` exist, but currently use sample/mock workspace identifiers.
- Real sub-tenancy UI exists via:
  - `BrandWorkspaceManager` (uses `brand_workspaces`, `brand_workspace_members`, `client_agency_relationships`).

---

## Q5) Backend API + Edge Functions (tenant context + validation)

### Node API (`api/`)
- Context-aware JWT includes: `contextId`, `contextType`, `enterpriseId`, `agencySeatId`, `role`, `permissions`.
- Partner context switching validates:
  - user has active `partner_client_contexts`
  - relationship active in `partner_enterprise_relationships`
- Context switch attempts are logged to `context_audit_log`.

### Supabase edge functions (`supabase/functions`)
- `validate-ai-usage` uses service role and logs `enterprise_id`/`workspace_id` to `audit_events` / `policy_validation_events`.
- `policy-process` requires explicit `enterpriseId` in request body and passes it to the agent adapter.
- **Risk**: service role bypass means the function must enforce membership/tenant validation explicitly.

---

## Q6) Agent Architecture Review

- Node agent: `agents/multi-tenant-orchestrator-agent.js` resolves best-effort tenant context from `enterpriseId`/`agencyId`.
- Supabase observability supports tenant attribution via `enterprise_id` plus `policy_digest` and trace IDs.
- **Risk**: governance tables have RLS disabled; without RLS or explicit checks, agent-driven writes/reads can become cross-tenant.

---

## Q7) Gap Analysis Checklist (Current vs Target)

### ✅ Already exists
- **Partner↔enterprise junction with status**: `partner_enterprise_relationships` (Node schema).
- **Partner user multi-client access model**: `partner_client_contexts` (Node schema).
- **Context/session tracking**: `user_sessions` + `context_audit_log` (Node schema).
- **Immutable policy referencing**: `policy_artifacts` + `policy_activations` + digest lookup RPCs (Supabase schema).
- **Evidence/proof isolation primitives**: Proof Spine tables with `enterprise_id` + RLS patterns (Supabase schema).
- **UI context switching**: `ui-` hierarchical context switcher + store.

### 🟨 Partially built / needs work
- **Per-relationship permissions**:
  - Node schema has `partner_enterprise_relationships.settings` (generic JSONB) and `partner_client_contexts.permissions`.
  - Marketing Supabase references `client_agency_relationships.permissions`, but DDL is missing in tracked migrations snapshot.
- **Unified frontend context management**:
  - Multiple parallel implementations (`apps/platform` vs `ui-` vs `apps/marketing`) need consolidation.

### ❌ Missing
- **Supabase workspace session tracking** (e.g., `workspace_sessions` / `workspace_session_id`): not found in migrations.
- **Authoritative membership table definitions** in tracked migrations (`enterprise_members`, `workspace_members`) for RLS verification.
- **Cross-client evidence reference detection pipeline**: not found as an implemented DB/agent feature.

### ⚠️ Conflicts / risks
- **Multiple schema lineages** coexisting (organizations_enhanced vs enterprises; Node vs Supabase).
- **Governance tables ship with RLS disabled** in migrations — must be re-enabled with correct policies before production.
- **Service-role edge functions** require explicit tenant validation.

