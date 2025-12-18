# API Screen Routes Documentation

## Overview

All 31 screens have defined API routes with access control. This document lists all routes, their access requirements, and example requests/responses.

## Enterprise Screens (16 routes)

### 1. Enterprise Admin Panel
- **Route**: `GET /api/screens/enterprise/admin`
- **Roles**: `enterprise_owner`, `enterprise_admin`, `platform_super_admin`
- **Context Types**: `enterprise`

### 2. Brand Workspace
- **Route**: `GET /api/screens/enterprise/brand/:brandId`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 3. Brand Policy Authoring
- **Route**: `GET /api/screens/enterprise/policies/author`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 4. Policy Engine Config
- **Route**: `GET /api/screens/enterprise/policies/engine-config`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `platform_super_admin`
- **Context Types**: `enterprise`

### 5. Workflow Builder
- **Route**: `GET /api/screens/enterprise/workflows/builder`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `project_manager`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 6. Review Queue
- **Route**: `GET /api/screens/enterprise/review-queue`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `compliance_manager`, `legal_counsel`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 7. Tool Intelligence Analyzer
- **Route**: `GET /api/screens/enterprise/tools/analyzer`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`
- **Features**: `metaloop-integration`

### 8. Agent Override
- **Route**: `GET /api/screens/enterprise/agent/override`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `compliance_manager`, `legal_counsel`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 9. Decision Workbench
- **Route**: `GET /api/screens/enterprise/decisions/workbench`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 10. Gap Scan
- **Route**: `GET /api/screens/enterprise/compliance/gap-scan`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `enterprise`

### 11. Regulatory Bindings
- **Route**: `GET /api/screens/enterprise/compliance/regulatory-bindings`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `compliance_manager`, `legal_counsel`, `platform_super_admin`
- **Context Types**: `enterprise`

### 12. Compliance Dashboard
- **Route**: `GET /api/screens/enterprise/compliance/dashboard`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `compliance_manager`, `seat_admin`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 13. Campaign Compliance Dashboard
- **Route**: `GET /api/screens/enterprise/compliance/campaigns`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `marketing_manager`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 14. Executive Dashboard
- **Route**: `GET /api/screens/enterprise/dashboard/executive`
- **Roles**: `enterprise_owner`, `enterprise_admin`, `platform_super_admin`
- **Context Types**: `enterprise`

### 15. Scorecards
- **Route**: `GET /api/screens/enterprise/scorecards`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

### 16. Analytics Dashboard
- **Route**: `GET /api/screens/enterprise/analytics`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `seat_admin`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`

## Partner Screens (10 routes)

### 17. Tool Submission Portal
- **Route**: `GET /api/screens/partner/tools/submit`
- **Roles**: `partner_admin`, `partner_user`, `account_manager`, `project_manager`, `platform_super_admin`
- **Context Types**: `partner`, `enterprise`
- **Requires Relationship**: Yes

### 18. Tool Request Workflow
- **Route**: `GET /api/screens/partner/tools/request`
- **Roles**: `partner_admin`, `partner_user`, `account_manager`, `marketing_manager`, `platform_super_admin`
- **Context Types**: `partner`, `enterprise`
- **Requires Relationship**: Yes

### 19. Content Submission Workflow
- **Route**: `GET /api/screens/partner/content/submit`
- **Roles**: `partner_admin`, `partner_user`, `creative_director`, `project_manager`, `platform_super_admin`
- **Context Types**: `partner`
- **Requires Relationship**: Yes

### 20. Submission Form
- **Route**: `GET /api/screens/partner/submissions/form`
- **Roles**: `partner_admin`, `partner_user`, `account_manager`, `project_manager`, `platform_super_admin`
- **Context Types**: `partner`
- **Requires Relationship**: Yes

### 21. Partner Dashboard
- **Route**: `GET /api/screens/partner/dashboard`
- **Roles**: `partner_admin`, `partner_user`, `account_manager`, `platform_super_admin`
- **Context Types**: `partner`

### 22. Multi-Client Policy Sync
- **Route**: `GET /api/screens/partner/policies/sync`
- **Roles**: `partner_admin`, `account_manager`, `platform_super_admin`
- **Context Types**: `partner`
- **Requires Multiple Clients**: Yes

### 23. Multi-Enterprise Dashboard
- **Route**: `GET /api/screens/partner/clients/dashboard`
- **Roles**: `partner_admin`, `account_manager`, `platform_super_admin`
- **Context Types**: `partner`
- **Requires Multiple Clients**: Yes

### 24. Client Communication Portal
- **Route**: `GET /api/screens/partner/clients/communication`
- **Roles**: `partner_admin`, `account_manager`, `project_manager`, `platform_super_admin`
- **Context Types**: `partner`
- **Requires Relationship**: Yes

### 25. Creative Compliance Dashboard
- **Route**: `GET /api/screens/partner/compliance/creative`
- **Roles**: `partner_admin`, `creative_director`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `partner`

### 26. Compliance Status Reports
- **Route**: `GET /api/screens/partner/compliance/reports`
- **Roles**: `partner_admin`, `account_manager`, `compliance_manager`, `platform_super_admin`
- **Context Types**: `partner`

### 27. Status Tracking
- **Route**: `GET /api/screens/partner/submissions/status`
- **Roles**: `partner_admin`, `partner_user`, `account_manager`, `project_manager`, `platform_super_admin`
- **Context Types**: `partner`

## Shared/Universal Screens (5 routes)

### 28. Approved Tools Marketplace
- **Route**: `GET /api/screens/marketplace/tools`
- **Roles**: `*` (All authenticated users)
- **Context Types**: `*` (All context types)

### 29. Context Switcher
- **Route**: `GET /api/screens/context/switch`
- **Roles**: `*` (All authenticated users)
- **Context Types**: `*` (All context types)
- **Requires Multiple Contexts**: Yes

### 30. Support Dashboard
- **Route**: `GET /api/screens/support`
- **Roles**: `*` (All authenticated users)
- **Context Types**: `*` (All context types)

### 31. Audit Package Export
- **Route**: `GET /api/screens/audit/export`
- **Roles**: `enterprise_admin`, `enterprise_owner`, `compliance_manager`, `partner_admin`, `platform_super_admin`
- **Context Types**: `enterprise`, `agencySeat`, `partner`

## Get Available Screens

### Endpoint
`GET /api/screens/available`

### Description
Returns all screens accessible to the current user based on their role and context type.

### Response
```json
{
  "success": true,
  "screens": [
    {
      "screenName": "enterprise-admin-panel",
      "roles": ["enterprise_owner", "enterprise_admin"],
      "contextTypes": ["enterprise"],
      "route": "/enterprise/admin"
    }
  ],
  "count": 15
}
```

## Error Responses

### 403 Forbidden
```json
{
  "error": "Insufficient permissions for screen 'enterprise-admin-panel'",
  "requiredRoles": ["enterprise_owner", "enterprise_admin"],
  "currentRole": "partner_user"
}
```

### 403 Forbidden (Relationship Required)
```json
{
  "error": "No active relationship with client enterprise",
  "details": "Relationship not found or inactive"
}
```

### 403 Forbidden (Multiple Contexts Required)
```json
{
  "error": "This screen requires multiple contexts",
  "currentContexts": 1
}
```

