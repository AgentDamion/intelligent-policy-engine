# aicomplyr.io User Stories

Version: 1.0
Date: August 26, 2025

This document summarizes key user stories across roles to guide feature development.

## Enterprise Users

- Create and manage AI tool policies to govern approved/restricted/blocked tools.
- Build policy templates reusable across agency relationships.
- Assign risk levels to tools and prioritize monitoring.
- Invite and onboard agencies with workspace-level policies.
- Manage multiple agency relationships and workspaces.
- Control agency user access via RBAC and revoke when needed.
- Monitor real-time usage across agencies with drill-down.
- Generate audit reports for periods, projects, and agencies.
- Receive alerts on violations via email/Slack/SMS with escalation.
- Review/approve agency tool submissions with compliance evidence.
- Discover vetted tools in a marketplace with compliance ratings.
- Evaluate enterprise features and pricing prior to approval.

## Agency/Partner Users

- View each client’s AI policies in one place with clear approved/restricted/blocked states.
- Assign team members to client workspaces with appropriate access.
- Receive training/guidance for each client’s AI policies.
- Log AI tool usage automatically with minimal workflow disruption.
- Track usage across accounts and provide transparency to clients.
- Bulk upload usage from existing tools (CSV) with validation.
- Get real-time feedback when attempting non-compliant usage with alternatives.
- Understand specific conditions/restrictions for approved tools.
- Integrate compliance checks into dev/creative workflows.
- Submit new tools for approval with justification and docs.
- Provide technical/security details for requested tools.
- Communicate business value and ROI of new tools to clients.
- Generate professional compliance reports for clients.
- Ask questions to enterprise compliance with recorded threads.
- Perform QA review of usage before deliverables are submitted.

## System Administrators

- Monitor platform health and performance; manage DB resources.
- Manage security posture across tenants with isolation.
- Ensure platform regulatory compliance posture.
- Monitor and optimize AI agent performance and costs.
- Maintain data quality and validation pipelines for agent outputs.
- Manage and maintain third‑party integrations.

## Regulatory/Compliance Users

- Ensure audit trails and reports meet pharmaceutical regulations.
- Validate platform governance processes against best practices.
- Validate data handling, privacy, and legal compliance globally.

## Acceptance Considerations

- Every action generates audit events and is attributable to a user/context.
- Multi-tenant isolation is enforced at the query and API layers.
- Realtime feedback is provided within 1–2 seconds under nominal load.
- Exports available as CSV/PDF/JSON; APIs follow least-privilege access.
