# Policy Management System API Documentation

## Overview

The Policy Management System API provides comprehensive endpoints for managing compliance policies, organizations, partners, and audit tracking. The API supports FDA, HIPAA, and AI Act compliance frameworks with role-based access control and comprehensive audit logging.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Format

JWT tokens contain user information and are signed with a secret key. Tokens expire after 24 hours by default.

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {...},
  "count": 1,
  "message": "Operation completed successfully"
}
```

Error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_TOKEN` | Authorization header missing |
| `INVALID_TOKEN` | JWT token is invalid |
| `TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_REQUIRED` | Authentication required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `FOREIGN_KEY_VIOLATION` | Referenced resource not found |

## User Roles

- **admin**: Full system access
- **compliance_officer**: Policy and compliance management
- **partner**: Limited access to assigned policies

---

## Organizations

### GET /api/organizations

List all organizations (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "PharmaCorp Inc.",
      "industry": "pharmaceutical",
      "compliance_tier": "enterprise",
      "contact_email": "compliance@pharmacorp.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/organizations

Create a new organization (admin only).

**Request Body:**
```json
{
  "name": "New Pharma Corp",
  "industry": "pharmaceutical",
  "compliance_tier": "enterprise",
  "contact_email": "admin@newpharma.com",
  "contact_phone": "+1-555-0123",
  "address": "123 Pharma Street, City, State"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Pharma Corp",
    "industry": "pharmaceutical",
    "compliance_tier": "enterprise",
    "contact_email": "admin@newpharma.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Organization created successfully"
}
```

---

## Policy Templates

### GET /api/policy-templates

List available policy templates.

**Query Parameters:**
- `industry`: Filter by industry (pharmaceutical, healthcare, financial)
- `regulation_framework`: Filter by framework (FDA, HIPAA, GDPR, AI_ACT)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "FDA Social Media Compliance",
      "description": "Comprehensive FDA guidelines for pharmaceutical social media marketing",
      "industry": "pharmaceutical",
      "regulation_framework": "FDA",
      "template_rules": {
        "data_handling": {
          "patient_privacy": true,
          "adverse_event_reporting": true
        },
        "content_creation": {
          "medical_claims": false,
          "balanced_presentation": true
        }
      },
      "risk_categories": {
        "high": ["patient_data", "medical_claims"],
        "medium": ["adverse_events", "off_label"],
        "low": ["general_info"]
      },
      "version": "1.0",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/policy-templates/:id

Get specific policy template details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "FDA Social Media Compliance",
    "description": "Comprehensive FDA guidelines...",
    "industry": "pharmaceutical",
    "regulation_framework": "FDA",
    "template_rules": {...},
    "risk_categories": {...},
    "compliance_requirements": {...},
    "version": "1.0",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Policies

### GET /api/policies

List organization's policies.

**Query Parameters:**
- `status`: Filter by status (draft, active, archived, suspended)
- `search`: Search in name and description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Social Media Policy",
      "description": "FDA-compliant social media guidelines",
      "status": "active",
      "compliance_framework": "FDA",
      "created_by_name": "John Admin",
      "template_name": "FDA Social Media Compliance",
      "distributed_to_partners": 5,
      "rule_count": 8,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/policies/:id

Get specific policy details including rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Social Media Policy",
    "description": "FDA-compliant social media guidelines",
    "status": "active",
    "compliance_framework": "FDA",
    "policy_rules": {
      "data_handling": {
        "patient_privacy": true,
        "adverse_event_reporting": true
      },
      "content_creation": {
        "medical_claims": false,
        "balanced_presentation": true
      }
    },
    "risk_scoring": {
      "patient_data_weight": 10,
      "medical_claims_weight": 8
    },
    "created_by_name": "John Admin",
    "approved_by_name": "Jane Compliance",
    "template_name": "FDA Social Media Compliance",
    "rules": [
      {
        "id": "uuid",
        "rule_type": "data_handling",
        "rule_name": "Patient Privacy Protection",
        "description": "Protect patient privacy in all communications",
        "conditions": {
          "data_type": "patient_data",
          "access_level": "restricted"
        },
        "requirements": {
          "encryption": true,
          "access_controls": true,
          "audit_logging": true
        },
        "risk_weight": 8,
        "is_mandatory": true,
        "enforcement_level": "strict"
      }
    ]
  }
}
```

### POST /api/policies

Create a new policy (admin, compliance_officer).

**Request Body:**
```json
{
  "name": "New Social Media Policy",
  "description": "Comprehensive social media guidelines",
  "template_id": "template-uuid",
  "policy_rules": {
    "data_handling": {
      "patient_privacy": true,
      "adverse_event_reporting": true
    },
    "content_creation": {
      "medical_claims": false,
      "balanced_presentation": true
    }
  },
  "compliance_framework": "FDA",
  "effective_date": "2024-02-01",
  "expiry_date": "2025-02-01",
  "risk_scoring": {
    "patient_data_weight": 10,
    "medical_claims_weight": 8
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Social Media Policy",
    "status": "draft",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Policy created successfully"
}
```

### PUT /api/policies/:id

Update a policy (admin, compliance_officer).

**Request Body:**
```json
{
  "name": "Updated Social Media Policy",
  "description": "Updated comprehensive guidelines",
  "status": "active",
  "policy_rules": {
    "data_handling": {
      "patient_privacy": true,
      "adverse_event_reporting": true,
      "encryption_required": true
    }
  }
}
```

### DELETE /api/policies/:id

Archive a policy (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Policy archived successfully"
}
```

---

## Policy Rules

### GET /api/policies/:id/rules

Get rules for a specific policy.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rule_type": "data_handling",
      "rule_name": "Patient Privacy Protection",
      "description": "Protect patient privacy in all communications",
      "conditions": {
        "data_type": "patient_data",
        "access_level": "restricted"
      },
      "requirements": {
        "encryption": true,
        "access_controls": true,
        "audit_logging": true
      },
      "risk_weight": 8,
      "is_mandatory": true,
      "enforcement_level": "strict",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/policies/:id/rules

Add a rule to a policy (admin, compliance_officer).

**Request Body:**
```json
{
  "rule_type": "data_handling",
  "rule_name": "Data Encryption Requirement",
  "description": "All patient data must be encrypted",
  "conditions": {
    "data_type": "patient_data",
    "storage_type": "digital"
  },
  "requirements": {
    "encryption_algorithm": "AES-256",
    "key_management": "required",
    "access_logging": true
  },
  "risk_weight": 9,
  "is_mandatory": true,
  "enforcement_level": "strict"
}
```

---

## Partners

### GET /api/partners

List organization's partners.

**Query Parameters:**
- `status`: Filter by status (active, suspended, pending, terminated)
- `partner_type`: Filter by type (agency, vendor, freelancer, consultant)
- `search`: Search in name and email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Marketing Agency ABC",
      "partner_type": "agency",
      "contact_email": "contact@agencyabc.com",
      "compliance_score": 85.5,
      "risk_level": "low",
      "active_policies": 3,
      "open_violations": 0,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/partners

Create a new partner (admin, compliance_officer).

**Request Body:**
```json
{
  "name": "New Marketing Agency",
  "partner_type": "agency",
  "contact_email": "contact@newagency.com",
  "contact_phone": "+1-555-0123",
  "address": "456 Agency Street, City, State",
  "services_offered": ["social_media", "content_creation", "advertising"],
  "compliance_certifications": ["ISO_27001", "SOC_2"]
}
```

---

## Policy Distribution

### POST /api/policies/:id/distribute

Distribute a policy to partners (admin, compliance_officer).

**Request Body:**
```json
{
  "partner_ids": ["partner-uuid-1", "partner-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policy_id": "policy-uuid",
      "partner_id": "partner-uuid-1",
      "distributed_at": "2024-01-01T00:00:00Z",
      "compliance_status": "pending"
    }
  ],
  "message": "Policy distributed to 2 partners successfully"
}
```

### GET /api/policies/:id/distributions

Get distribution history for a policy.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policy_id": "policy-uuid",
      "partner_id": "partner-uuid",
      "partner_name": "Marketing Agency ABC",
      "partner_type": "agency",
      "compliance_score": 85.5,
      "distributed_at": "2024-01-01T00:00:00Z",
      "acknowledged_at": "2024-01-02T00:00:00Z",
      "compliance_status": "compliant",
      "compliance_score": 92.0
    }
  ],
  "count": 1
}
```

---

## Compliance

### GET /api/compliance/violations

Get compliance violations.

**Query Parameters:**
- `status`: Filter by status (open, investigating, resolved, closed)
- `severity`: Filter by severity (low, medium, high, critical)
- `partner_id`: Filter by partner

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policy_id": "policy-uuid",
      "partner_id": "partner-uuid",
      "policy_name": "Social Media Policy",
      "partner_name": "Marketing Agency ABC",
      "partner_type": "agency",
      "violation_type": "policy_breach",
      "severity": "medium",
      "description": "Posted medical claim without proper disclosure",
      "status": "open",
      "detected_at": "2024-01-01T00:00:00Z",
      "corrective_actions": ["remove_post", "provide_training"]
    }
  ],
  "count": 1
}
```

### GET /api/compliance/checks

Get compliance checks.

**Query Parameters:**
- `status`: Filter by status (passed, failed, warning, pending)
- `check_type`: Filter by type (automated, manual, scheduled)
- `partner_id`: Filter by partner

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policy_id": "policy-uuid",
      "partner_id": "partner-uuid",
      "policy_name": "Social Media Policy",
      "partner_name": "Marketing Agency ABC",
      "check_type": "automated",
      "check_date": "2024-01-01T00:00:00Z",
      "status": "passed",
      "score": 92.0,
      "findings": {
        "compliance_score": 92,
        "violations_found": 0,
        "recommendations": []
      },
      "recommendations": ["Continue monitoring", "Schedule quarterly review"]
    }
  ],
  "count": 1
}
```

---

## Audit Logs

### GET /api/audit-logs

Get audit logs.

**Query Parameters:**
- `action`: Filter by action
- `entity_type`: Filter by entity type
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "org-uuid",
      "user_id": "user-uuid",
      "user_name": "John Admin",
      "action": "policy_created",
      "entity_type": "policy",
      "entity_id": "policy-uuid",
      "details": {
        "policy_name": "Social Media Policy",
        "template_id": "template-uuid",
        "compliance_framework": "FDA"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "risk_level": "low",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

---

## Dashboard

### GET /api/dashboard/stats

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": {
      "total_policies": 15,
      "active_policies": 12,
      "draft_policies": 2,
      "archived_policies": 1
    },
    "partners": {
      "total_partners": 25,
      "active_partners": 23,
      "avg_compliance_score": 87.5,
      "high_risk_partners": 2
    },
    "compliance": {
      "total_violations": 8,
      "open_violations": 3,
      "high_severity_violations": 1
    },
    "recent_activity": [
      {
        "action": "policy_created",
        "entity_type": "policy",
        "created_at": "2024-01-01T00:00:00Z",
        "user_name": "John Admin"
      }
    ]
  }
}
```

---

## Usage Examples

### Creating a Policy from Template

```javascript
// 1. Get available templates
const templates = await fetch('/api/policy-templates?industry=pharmaceutical&regulation_framework=FDA', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Create policy based on template
const policy = await fetch('/api/policies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'PharmaCorp Social Media Policy',
    description: 'Custom FDA-compliant social media policy',
    template_id: templates.data[0].id,
    policy_rules: {
      data_handling: { patient_privacy: true },
      content_creation: { medical_claims: false }
    },
    compliance_framework: 'FDA'
  })
});
```

### Distributing Policies to Partners

```javascript
// 1. Get organization's partners
const partners = await fetch('/api/partners?status=active', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Distribute policy to selected partners
const distribution = await fetch(`/api/policies/${policyId}/distribute`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    partner_ids: partners.data.map(p => p.id)
  })
});
```

### Monitoring Compliance

```javascript
// Get compliance dashboard
const stats = await fetch('/api/dashboard/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get recent violations
const violations = await fetch('/api/compliance/violations?status=open', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per 15 minutes per user
- **Response**: 429 status code with retry-after header
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Webhooks (Future Enhancement)

The API will support webhooks for real-time notifications:

- Policy distribution events
- Compliance violation alerts
- Audit log events
- Partner status changes

---

## SDKs and Libraries

### JavaScript/Node.js

```javascript
import { PolicyManagementAPI } from '@aicomplyr/policy-api';

const api = new PolicyManagementAPI({
  baseURL: 'https://your-domain.com/api',
  token: 'your-jwt-token'
});

// Create policy
const policy = await api.policies.create({
  name: 'Social Media Policy',
  template_id: 'template-uuid',
  policy_rules: {...}
});

// Distribute to partners
await api.policies.distribute(policy.id, ['partner-uuid-1', 'partner-uuid-2']);
```

### Python

```python
from aicomplyr_policy_api import PolicyManagementAPI

api = PolicyManagementAPI(
    base_url="https://your-domain.com/api",
    token="your-jwt-token"
)

# Create policy
policy = api.policies.create(
    name="Social Media Policy",
    template_id="template-uuid",
    policy_rules={...}
)

# Get compliance stats
stats = api.dashboard.get_stats()
```

---

## Support

For API support and questions:

- **Documentation**: https://docs.aicomplyr.com/api
- **Support Email**: api-support@aicomplyr.com
- **Status Page**: https://status.aicomplyr.com
