# aicomplyr.io Technical Architecture

Author: Manus AI
Date: August 26, 2025
Version: 1.0

## Overview

aicomplyr.io is an AI governance platform purpose-built to manage compliance risks between regulated enterprises and their external agencies/vendors who use AI tools. The platform implements an AI-native, multi-tenant architecture with real-time policy enforcement and comprehensive auditability.

## Layered Architecture

- Frontend (Lovable/Next.js)
  - Marketing site and role-based platform app
  - Real-time dashboards, MLR workflows, and policy management UIs
- API Layer (Node/Express, Supabase Edge Functions ready)
  - AI Governance API, Usage Logging API, Compliance API, MLR Review API
  - Integration endpoints for OpenTools, Slack, Google Sheets, Zapier
- Data Layer (PostgreSQL via Supabase)
  - Multi-tenant schema with organizations, users, policies, agency onboarding, audit, and usage events
  - JSONB for flexible rules, comprehensive indexing
- Realtime Layer (Supabase Realtime / WebSockets)
  - Live usage monitoring, instant policy violation alerts, collaborative reviews

## Core Domain Tables (as implemented or scaffolded)

- Agency onboarding and tool submissions: `agency_ai_tools`, `agency_compliance_requirements`, `agency_compliance_submissions`, `agency_onboarding_steps`, `agency_onboarding_progress`, `agency_audit_log`
- Multi-tenant access + policy: `enterprises`, `agency_seats`, `users`, `user_contexts`, `policies`, `seat_policy_assignments`
- Policy distribution and compliance: `policy_distributions`, `agency_policy_compliance`, `policy_conflicts`
- Contracts and metering: `contracts`, `usage_events`, `invoices`, etc. (009 migration)
- Audit trails: `audit_sessions`, `audit_entries`, `audit_policy_references`, `audit_chains`

## AI Agent System

- Orchestrator Agent (Claude/GPT): coordinates specialized agents, QA, escalation
- Discovery Agent: scans OpenTools, GitHub, Product Hunt, vendor sites
- Verification Agent: validates data and vendors
- Monitoring Agent: tracks ToS/security/regulatory changes
- Data Extraction Agent: scrapes docs, API references, pricing, integrations
- Compliance Scoring Agent: risk scoring, regulatory mapping, recommendations

Agents operate behind the Orchestrator and interact with Governance/Compliance APIs to enrich the `ai_tools` catalogue (backed by `agency_ai_tools` today) and drive automated policy checks.

## Integrations

- OpenTools Connector for tool catalogue sync (webhooks + polling)
- Slack notifications and usage logging commands
- Google Sheets bulk upload for usage and policy mappings
- Zapier hooks for enterprise automation

## Security

- RBAC boundaries by enterprise → agency seat → user context
- TLS in transit, AES-256 at rest (Supabase default)
- Comprehensive auditing across APIs and agents
- Rate limiting and security headers middleware in API

## Scalability

- Serverless-ready functions, horizontal scaling
- Indexed queries, JSONB payloads, connection pooling
- Realtime streams for instant feedback with backpressure controls

## Deployment

- Railway for app and database deployments
- Dev/Staging/Prod with promotion, rollbacks, and monitoring

## Real-time Compliance Flow (happy path)

1) Agency user action produces usage context
2) Context sent to Policy Engine -> `policy-check` workflow (`api/routes.js`)
3) Decision logged to audit; violations trigger alerts and MLR queue
4) Dashboards update via Realtime

## Notes

- `ai_tools`, `tool_policies`, and `tool_usage_logs` names in the diagrams map to existing scaffolded equivalents: `agency_ai_tools`, `policies`, and `usage_events`/`agency_audit_log` in this codebase. A migration can align names later if desired.
