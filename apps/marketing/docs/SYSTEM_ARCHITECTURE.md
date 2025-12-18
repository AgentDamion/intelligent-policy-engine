# AI Governance Platform: Complete System Documentation

## Executive Summary

The **aicomply.io AI Governance Platform** is a sophisticated, multi-tenant SaaS application that enables pharmaceutical companies, marketing agencies, and AI vendors to manage AI tool governance, compliance, and policy enforcement. The platform features:

- **Multi-tenant architecture** supporting 3 user types (Enterprise, Agency/Partner, Vendor)
- **AI-native agent system** with 16 specialized agents for automated governance
- **Policy Sandbox** for zero-risk testing before deployment
- **Real-time collaboration** with conflict detection and resolution
- **Audit-ready compliance** with immutable proof packs
- **Supabase backend** with comprehensive RLS security
- **React/TypeScript frontend** with role-based routing

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                           │
│                      (React 18 + TypeScript + Vite)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Marketing Website       Authentication         Application            │
│  ├─ Landing Pages       ├─ Sign Up/In          ├─ Enterprise UI        │
│  ├─ Pricing             ├─ Demo Mode           ├─ Partner/Agency UI    │
│  ├─ Contact/CTA         ├─ Role Selection      ├─ Vendor UI            │
│  └─ Industries          └─ Magic Links         └─ Admin UI             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT LAYER                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  React Context Providers           React Query                         │
│  ├─ AuthContext (user, profile)   ├─ Query Client                     │
│  ├─ ModeContext (role routing)    ├─ Cache Management                 │
│  └─ ErrorBoundaries               └─ Real-time Updates                │
│                                                                         │
│  Custom Hooks                      Services                            │
│  ├─ useSandbox()                  ├─ sandboxService.ts                │
│  ├─ useSandboxAgents()            ├─ policyService.ts                 │
│  ├─ useEnterpriseData()           └─ analyticsService.ts              │
│  └─ useAuth()                                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         API / EDGE FUNCTIONS LAYER                      │
│                     (Supabase Edge Functions - Deno)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  cursor-agent-adapter              sandbox-run                         │
│  ├─ 16 AI Agents                  ├─ Multi-agent orchestration        │
│  ├─ AgentRegistry                 ├─ 4-step pipeline                  │
│  ├─ AIClient (3-tier fallback)    └─ Proof hash generation            │
│  └─ Action routing                                                     │
│                                                                         │
│  generate-test-scenarios           sandbox-export                      │
│  ├─ AI scenario generation        ├─ JSON/Markdown/CSV                │
│  └─ Policy-aware context          └─ AI insights inclusion            │
│                                                                         │
│  governance-ingest                Other Functions                       │
│  ├─ Event validation              ├─ policy-distribution              │
│  └─ Metadata enrichment           └─ submission-scoring               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (PostgreSQL)                       │
│                      (Supabase with RLS Security)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Identity & Access           Governance Core                           │
│  ├─ auth.users              ├─ policies (versioned)                   │
│  ├─ profiles                ├─ policy_versions                         │
│  ├─ user_roles              ├─ policy_distributions (RFPs)            │
│  ├─ enterprises             ├─ submissions                            │
│  └─ workspaces              └─ decisions                              │
│                                                                         │
│  Multi-Tenancy              Agent System                               │
│  ├─ workspace_members       ├─ agent_activities                       │
│  ├─ enterprise_members      ├─ ai_agent_decisions                     │
│  ├─ brand_workspaces        ├─ agent_workflows                        │
│  └─ client_agency_rels      └─ agent_tasks                            │
│                                                                         │
│  Sandbox & Testing          Compliance & Audit                         │
│  ├─ sandbox_runs            ├─ audit_events                           │
│  ├─ sandbox_controls        ├─ governance_events                      │
│  ├─ sandbox_approvals       ├─ compliance_reports                     │
│  └─ exports_log             └─ ai_tool_usage_logs                     │
│                                                                         │
│  Collaboration              Marketplace                                │
│  ├─ collaboration_sessions  ├─ marketplace_tools                      │
│  ├─ collaboration_messages  ├─ vendor_promotions                      │
│  ├─ document_annotations    └─ tool_submissions                       │
│  └─ conflict_resolutions                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
