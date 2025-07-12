# AIComplyr.io API Documentation

## Overview

AIComplyr.io is an AI compliance and governance system designed for marketing agencies and enterprises. It provides intelligent policy management, conflict detection, negotiation support, and comprehensive audit trails for AI tool usage.

## Table of Contents

1. [Authentication](#authentication)
2. [Core API Endpoints](#core-api-endpoints)
3. [Agent APIs](#agent-apis)
4. [Dashboard APIs](#dashboard-apis)
5. [Proof Center APIs](#proof-center-apis)
6. [Database Schema](#database-schema)
7. [Agent Classes](#agent-classes)
8. [Usage Examples](#usage-examples)

---

## Authentication

### Authentication Middleware

The system uses JWT-based authentication with role-based access control.

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "organization_id": "uuid",
    "role": "admin"
  }
}
```

### Authentication Levels

#### 1. Regular User Authentication
- Access to organization-specific resources
- Basic API operations

#### 2. Admin Authentication (`requireAdminAuth`)
- Required for administrative operations
- Uses Bearer token authentication

**Example:**
```javascript
// Header required for admin endpoints
Authorization: Bearer <jwt-token>
```

#### 3. Super Admin Authentication (`requireSuperAdminAuth`)
- Required for system-wide operations
- Highest privilege level

#### 4. Action-Based Authentication (`requireActionAuth`)
- Granular permission control for specific actions

**Available Actions:**
- `restart_agent` - Restart AI agents
- `clear_cache` - Clear system cache
- `backup_database` - Create database backup
- `suspend_user` - Suspend user access
- `reset_password` - Reset user password
- `grant_admin` - Grant admin privileges
- `suspend_client` - Suspend client (super-admin only)
- `force_sync` - Force system sync (super-admin only)

---

## Core API Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "Policy engine is running",
  "timestamp": "2024-01-19T16:00:00Z",
  "activeAgents": ["audit", "policy", "negotiation", "context", "conflict-detection"]
}
```

### Agent Activity
```http
GET /api/agent/activity?limit=20
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 20)

**Response:**
```json
{
  "activities": [
    {
      "id": 1705680000000,
      "agent": "Conflict Detection Agent",
      "action": "Analyzed Policies",
      "details": {
        "policiesAnalyzed": 3,
        "conflictsFound": 2,
        "severity": "medium"
      },
      "timestamp": "2024-01-19T16:00:00Z"
    }
  ],
  "total": 45
}
```

### System Summary
```http
GET /api/summary
```

**Response:**
```json
{
  "system": {
    "status": "operational",
    "activeAgents": ["audit", "policy", "negotiation", "context", "conflict-detection"],
    "totalActivities": 150,
    "totalOverrides": 12
  },
  "recentActivity": [...],
  "stats": {
    "activitiesLast24h": 45,
    "mostActiveAgent": {
      "name": "Policy Agent",
      "activities": 32
    }
  }
}
```

---

## Agent APIs

### 1. Context Agent

Processes user messages to understand context and urgency.

```http
POST /api/process/context
```

**Request Body:**
```json
{
  "userMessage": "Need to use ChatGPT for Monday's presentation!!!",
  "organizationId": "org-uuid",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "timestamp": "2024-01-19T16:00:00Z",
  "urgency": {
    "level": 0.85,
    "emotionalState": "stressed",
    "timePressure": 0.9
  },
  "context": {
    "inferredType": "client_presentation",
    "confidence": 0.75,
    "reasoning": ["Matched 2 keywords for client_presentation"]
  },
  "clarification": {
    "question": "Is this for the Johnson & Co. quarterly review we've been prepping?",
    "purpose": "refine_context_and_urgency"
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Start with ChatGPT immediately for content generation",
      "reasoning": "High urgency detected - immediate action needed"
    }
  ],
  "nextSteps": [
    "Immediately open ChatGPT",
    "Start with presentation outline",
    "Set aside 2-3 hours for focused work"
  ]
}
```

### 2. Policy Agent

Evaluates requests against organizational policies.

```http
POST /api/process/policy
```

**Request Body:**
```json
{
  "contextOutput": {
    "urgency": { "level": 0.85 },
    "context": { "inferredType": "client_presentation" }
  },
  "organizationId": "org-uuid",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "decision": {
    "status": "pending",
    "type": "ai_usage_request"
  },
  "risk": {
    "score": 0.85,
    "level": "high"
  },
  "conditions": {
    "guardrails": {
      "content_review": { "required": true },
      "time_limits": { "required": true },
      "quality_checks": { "required": true },
      "client_approval": { "required": true }
    },
    "compliance_requirements": [
      "Follow AI usage guidelines",
      "Maintain audit trail",
      "Review output for accuracy"
    ]
  },
  "monitoring": {
    "requirements": {
      "usage_tracking": { "enabled": true },
      "quality_monitoring": { "enabled": true },
      "client_feedback": { "enabled": true }
    }
  },
  "next_steps": [
    "Get immediate supervisor approval",
    "Schedule urgent review meeting",
    "Prepare compliance documentation"
  ]
}
```

### 3. Negotiation Agent

Handles multi-client conflicts and competitive requirements.

```http
POST /api/process/negotiation
```

**Request Body:**
```json
{
  "contextOutput": {...},
  "policyDecision": {...},
  "organizationId": "org-uuid",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "competitors": [
    {
      "client1": "Pfizer",
      "client2": "Novartis",
      "industry": "pharmaceutical"
    }
  ],
  "conflicts": [
    {
      "type": "urgency_conflict",
      "description": "High urgency may conflict with thorough compliance review",
      "severity": "medium"
    }
  ],
  "solution": {
    "requirements": [
      "Use only approved AI tools",
      "Maintain separate workspaces for each client",
      "Ensure no data cross-contamination",
      "Follow strictest compliance requirements"
    ]
  },
  "escalation": {
    "required": true,
    "reason": "High risk request requires management approval",
    "next_steps": [
      "Schedule review with compliance team",
      "Document business justification",
      "Prepare risk mitigation plan"
    ]
  },
  "client_requirements": {
    "pfizer": {
      "requirements": [...],
      "guardrails": [...],
      "monitoring": [...]
    }
  }
}
```

### 4. Conflict Detection Agent

Analyzes multiple policies for conflicts.

```http
POST /api/analyze-conflicts
```

**Request Body:**
```json
{
  "policies": [
    {
      "name": "AI Usage Policy",
      "content": "All AI tools must be approved before use..."
    },
    {
      "name": "Emergency Response Policy",
      "content": "In urgent situations, employees may use any available tools..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-19T16:00:00Z",
    "analysis_id": "CON-1705680000000-abc123",
    "summary": {
      "policies_analyzed": 2,
      "conflicts_found": 3,
      "severity_level": "medium",
      "resolution_complexity": "medium_complexity",
      "estimated_resolution_time": "1-2 days"
    },
    "conflicts": {
      "list": [
        {
          "type": "direct_contradiction",
          "severity": 0.9,
          "policies": ["policy_1", "policy_2"],
          "description": "Direct contradiction found between AI Usage Policy and Emergency Response Policy",
          "location": "content_analysis",
          "impact": "high"
        }
      ],
      "severity_breakdown": {...},
      "impact_analysis": {...}
    },
    "resolution": {
      "strategy": {
        "strategy": "guided_resolution",
        "type": "medium_complexity",
        "reasoning": "Medium severity conflicts require guided human resolution",
        "requires_human_review": true,
        "estimated_time": "1-2 days"
      },
      "recommendations": {
        "immediate_actions": [...],
        "short_term_solutions": [...],
        "long_term_improvements": [...]
      },
      "implementation_plan": {...}
    }
  }
}
```

---

## Dashboard APIs

### Policies Management

#### Get All Policies
```http
GET /api/policies
```

**Response:**
```json
{
  "success": true,
  "policies": [
    {
      "id": "1705680000000",
      "title": "AI Usage Guidelines",
      "description": "Company-wide AI tool usage policy",
      "createdAt": "2024-01-19T16:00:00Z",
      "status": "active"
    }
  ]
}
```

#### Create New Policy
```http
POST /api/policies
```

**Request Body:**
```json
{
  "title": "Social Media AI Policy",
  "description": "Guidelines for using AI in social media content creation"
}
```

### Agency Management

#### Get All Agencies
```http
GET /api/agencies
```

**Response:**
```json
{
  "success": true,
  "agencies": [
    {
      "id": "1",
      "name": "Ogilvy Health",
      "compliance": 92,
      "violations": 0,
      "lastAudit": "2 days ago",
      "status": "active"
    }
  ]
}
```

#### Get Agency Clients
```http
GET /api/agency/:agencyId/clients
```

**Response:**
```json
{
  "agency": "agency-123",
  "clients": [
    {
      "id": 1,
      "name": "Pfizer Inc.",
      "status": "active",
      "policies": 3
    }
  ],
  "total": 3
}
```

### Enterprise Statistics
```http
GET /api/enterprise/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAgencies": 3,
    "activePolicies": 12,
    "pendingSubmissions": 5,
    "averageComplianceRate": 92,
    "totalAgentActivities": 150,
    "totalOverrides": 8
  }
}
```

---

## Proof Center APIs

### 1. Audit Feed
```http
GET /api/audit-feed
```

**Response:**
```json
{
  "success": true,
  "feed": [
    {
      "timestamp": "2024-06-01T09:15:00Z",
      "event": "AI Decision Approved",
      "user": "jane.doe@agency.com",
      "tool": "ChatGPT",
      "outcome": "approved",
      "regTag": "FDA 21 CFR Part 11",
      "explanation": "AI-generated content for client presentation approved under FDA digital marketing guidelines."
    }
  ]
}
```

### 2. Compliance Metrics
```http
GET /api/metrics
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "avgApprovalTime": "2.3 min",
    "humanInLoopRate": "98%",
    "regulatoryCoverage": "9 frameworks",
    "auditCompleteness": "100%"
  }
}
```

### 3. Case Studies
```http
GET /api/case-studies
```

**Response:**
```json
{
  "success": true,
  "studies": [
    {
      "title": "Accelerating FDA Approval with AI Audit Trails",
      "summary": "How a top-5 pharma agency reduced approval times by 40% using AI-powered audit trails and real-time compliance mapping.",
      "proof": "https://pharma-proof-center.com/case1"
    }
  ]
}
```

### 4. Regulatory Mapping
```http
GET /api/regulatory-mapping
```

**Response:**
```json
{
  "success": true,
  "frameworks": [
    {
      "name": "FDA 21 CFR Part 11",
      "decisions": 120,
      "conflicts": 2,
      "completion": 100
    }
  ]
}
```

### 5. Compliance Trends
```http
GET /api/trends
```

**Response:**
```json
{
  "success": true,
  "scores": [
    {
      "date": "2024-01-19",
      "score": 0.95
    }
  ]
}
```

---

## Database Schema

### Core Tables

#### Organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR CHECK (type IN ('enterprise', 'agency', 'client', 'partner', 'other')),
    competitive_group VARCHAR,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Audit Sessions
```sql
CREATE TABLE audit_sessions (
    session_id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    workflow_path JSONB,
    agents_engaged TEXT[],
    final_decision JSONB,
    total_processing_time INTEGER,
    status VARCHAR DEFAULT 'active'
);
```

#### Audit Entries
```sql
CREATE TABLE audit_entries (
    entry_id UUID PRIMARY KEY,
    session_id UUID REFERENCES audit_sessions(session_id),
    timestamp TIMESTAMP DEFAULT NOW(),
    agent VARCHAR NOT NULL,
    decision_type VARCHAR,
    decision JSONB,
    reasoning TEXT[],
    policies_referenced TEXT[],
    risk_level VARCHAR,
    status VARCHAR,
    processing_time_ms INTEGER,
    metadata JSONB
);
```

#### Policies
```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR NOT NULL,
    risk_profiles JSONB,
    rules JSONB,
    version INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Negotiations
```sql
CREATE TABLE negotiations (
    negotiation_id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    clients JSONB,
    relationships JSONB,
    conflicts JSONB,
    solution JSONB,
    client_requirements JSONB,
    status VARCHAR DEFAULT 'active'
);
```

#### Relationships
```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY,
    source_id UUID NOT NULL,
    source_type VARCHAR CHECK (source_type IN ('organization', 'project', 'agency')),
    target_id UUID NOT NULL,
    target_type VARCHAR CHECK (target_type IN ('organization', 'project', 'agency')),
    relationship_type VARCHAR NOT NULL,
    competitive_group VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Agent Classes

### ConflictDetectionAgent

Analyzes multiple policies for conflicts and provides resolution strategies.

```javascript
const { ConflictDetectionAgent } = require('./agents/conflict-detection-agent');

const agent = new ConflictDetectionAgent();

// Analyze conflicts between policies
const conflictReport = agent.analyzeConflicts([
  { name: "Policy A", content: "..." },
  { name: "Policy B", content: "..." }
]);
```

**Key Methods:**
- `analyzeConflicts(policies)` - Main analysis method
- `parsePolicyDocuments(policiesData)` - Structures policy data
- `identifyConflicts(structuredPolicies)` - Finds conflicts
- `determineResolutionStrategy(conflictAssessment)` - Suggests resolution approach
- `generateRecommendations(resolutionStrategy, structuredPolicies)` - Creates actionable recommendations

### ContextAgent

Processes user messages to understand urgency, context, and emotional state.

```javascript
const { ContextAgent } = require('./agents/context-agent');

const agent = new ContextAgent();

// Process user input
const response = agent.processUserInput("Need to use ChatGPT for Monday's presentation!!!");
```

**Key Methods:**
- `processUserInput(userMessage)` - Main processing method
- `analyzeUrgency(message)` - Determines urgency level
- `inferContext(message)` - Infers presentation/work context
- `generateClarifyingQuestion(contextInference)` - Creates smart follow-up questions
- `buildStructuredResponse(urgencyAnalysis, contextInference, clarifyingQuestion)` - Builds complete response

### PolicyAgent

Evaluates requests against organizational policies and generates decisions.

```javascript
const { PolicyAgent } = require('./agents/policy-agent');

const agent = new PolicyAgent();

// Evaluate a request
const decision = await agent.evaluateRequest(contextOutput, organizationId);
```

### NegotiationAgent

Handles multi-client scenarios and competitive conflicts.

```javascript
const { NegotiationAgent } = require('./agents/negotiation-agent');

const agent = new NegotiationAgent();

// Process negotiation
const result = await agent.negotiate(contextOutput, policyDecision, organizationId);
```

### AuditAgent

Creates comprehensive audit trails for all decisions and actions.

```javascript
const { AuditAgent } = require('./agents/audit-agent');

const agent = new AuditAgent();

// Log an audit entry
await agent.logEntry(sessionId, agentName, decision, metadata);
```

---

## Usage Examples

### Complete Workflow Example

Here's how to process a user request through the complete agent workflow:

```javascript
// 1. Process user context
const contextAgent = new ContextAgent();
const contextOutput = contextAgent.processUserInput("Need ChatGPT for urgent client presentation!");

// 2. Evaluate against policies
const response = await fetch('/api/process/policy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contextOutput,
    organizationId: 'org-123',
    userId: 'user-456'
  })
});
const policyDecision = await response.json();

// 3. Handle negotiation if needed
if (policyDecision.risk.level === 'high') {
  const negotiationResponse = await fetch('/api/process/negotiation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contextOutput,
      policyDecision,
      organizationId: 'org-123',
      userId: 'user-456'
    })
  });
  const negotiationResult = await negotiationResponse.json();
}
```

### Conflict Detection Example

```javascript
// Detect conflicts between multiple policies
const policies = [
  {
    name: "Standard AI Usage Policy",
    content: "All AI tools must be pre-approved by the compliance team before use..."
  },
  {
    name: "Emergency Protocol",
    content: "In urgent client situations, teams may use any necessary tools..."
  }
];

const response = await fetch('/api/analyze-conflicts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ policies })
});

const conflictReport = await response.json();
console.log(`Found ${conflictReport.data.summary.conflicts_found} conflicts`);
```

### Admin Action Example

```javascript
// Perform admin action with proper authentication
const response = await fetch('/api/admin/action/restart_agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + adminToken
  },
  body: JSON.stringify({
    agentName: 'PolicyAgent',
    reason: 'Scheduled maintenance'
  })
});
```

### Creating a New Policy

```javascript
const response = await fetch('/api/policies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Social Media AI Guidelines",
    description: "Guidelines for using AI tools in social media content creation"
  })
});

const newPolicy = await response.json();
console.log(`Created policy: ${newPolicy.policy.id}`);
```

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Standard endpoints: 100 requests per minute
- Agent processing endpoints: 20 requests per minute
- Admin endpoints: 50 requests per minute

---

## Webhooks

The system supports webhooks for real-time notifications:

```javascript
// Register a webhook
POST /api/webhooks
{
  "url": "https://your-domain.com/webhook",
  "events": ["policy.updated", "conflict.detected", "audit.created"]
}
```

---

## Best Practices

1. **Always authenticate** - Include proper authentication headers
2. **Handle errors gracefully** - Check response status codes
3. **Use pagination** - For endpoints returning large datasets
4. **Implement retries** - For transient failures
5. **Monitor rate limits** - Respect API rate limits
6. **Cache responses** - Where appropriate to reduce API calls
7. **Use webhooks** - For real-time updates instead of polling

---

## Support

For additional support or questions:
- Email: support@aicomplyr.io
- Documentation: https://docs.aicomplyr.io
- API Status: https://status.aicomplyr.io

---

Last Updated: January 2024