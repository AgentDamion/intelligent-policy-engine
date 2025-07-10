# AICombly.io - Comprehensive API Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [REST API Endpoints](#rest-api-endpoints)
3. [AI Agents](#ai-agents)
4. [Frontend Components](#frontend-components)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Usage Examples](#usage-examples)
8. [Integration Guide](#integration-guide)

---

## System Overview

**AICombly.io** is an intelligent AI compliance management system that provides automated policy decisions, risk assessment, and multi-client conflict resolution for marketing agencies and enterprises.

### Architecture
```
Frontend UI ↔ REST API ↔ AI Agents ↔ PostgreSQL Database
     ↓           ↓          ↓            ↓
   HTML/CSS/JS  Express.js  Context     Organizations
   Dashboard    Routes      Policy      Users
   Components   Auth        Negotiation Audit Trails
                           Audit       Policies
                           Conflict    
```

### Core Features
- **Context-Aware Analysis**: Intelligent urgency and context detection
- **Risk-Based Policy Decisions**: Automated compliance decisions with conditional approvals
- **Multi-Client Conflict Resolution**: Handles competing client relationships
- **Comprehensive Audit Trail**: Enterprise-grade compliance tracking
- **Real-Time Dashboard**: Professional compliance monitoring interface

---

## REST API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Health & Status

#### GET /api/health
**Description**: Check system health and active agents  
**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "message": "Policy engine is running",
  "timestamp": "2024-01-19T16:00:00.000Z",
  "activeAgents": ["audit", "policy", "negotiation", "context", "conflict-detection"]
}
```

**Example**:
```bash
curl -X GET http://localhost:3000/api/health
```

---

### Agent Processing Endpoints

#### POST /api/process/context
**Description**: Process user input through Context Agent for urgency and context analysis  
**Authentication**: None required

**Request Body**:
```json
{
  "userMessage": "Need to use ChatGPT for Monday's presentation!!!",
  "organizationId": "demo-org",
  "userId": "demo-user"
}
```

**Response**:
```json
{
  "timestamp": "2024-01-19T16:00:00.000Z",
  "urgency": {
    "level": 1.0,
    "emotionalState": "panicked",
    "timePressure": 0.9
  },
  "context": {
    "inferredType": "client_presentation",
    "confidence": 0.7,
    "reasoning": ["Matched keywords for client_presentation"]
  },
  "clarification": {
    "question": "Is this for the Johnson & Co. quarterly review we've been prepping?",
    "purpose": "refine_context_and_urgency"
  },
  "recommendations": [...],
  "nextSteps": [...]
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/process/context \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Need urgent help with client presentation!",
    "organizationId": "org-123",
    "userId": "user-456"
  }'
```

#### POST /api/process/policy
**Description**: Process context output through Policy Agent for compliance decisions  
**Authentication**: None required

**Request Body**:
```json
{
  "contextOutput": {
    "urgency": { "level": 0.8 },
    "context": { "inferredType": "client_presentation", "confidence": 0.7 }
  },
  "organizationId": "demo-org",
  "userId": "demo-user"
}
```

**Response**:
```json
{
  "decision": {
    "status": "approved",
    "type": "conditional_approval",
    "reasoning": "Medium risk request approved with conditions"
  },
  "risk": {
    "score": 0.75,
    "level": "high",
    "factors": ["High urgency may lead to rushed decisions"]
  },
  "conditions": {
    "guardrails": {
      "content_review": { "required": true },
      "time_limits": { "required": true },
      "quality_checks": { "required": true }
    },
    "compliance_requirements": [
      "Follow AI usage guidelines",
      "Maintain audit trail"
    ]
  },
  "monitoring": {
    "requirements": {
      "usage_tracking": { "enabled": true },
      "quality_monitoring": { "enabled": true }
    }
  },
  "next_steps": [
    "Proceed with AI tool usage",
    "Document usage in compliance log"
  ]
}
```

#### POST /api/process/negotiation
**Description**: Process multi-client conflicts through Negotiation Agent  
**Authentication**: None required

**Request Body**:
```json
{
  "contextOutput": { /* Context Agent output */ },
  "policyDecision": { /* Policy Agent output */ },
  "organizationId": "demo-org",
  "userId": "demo-user"
}
```

**Response**:
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
      "Maintain separate workspaces for each client"
    ]
  },
  "escalation": {
    "required": true,
    "reason": "High risk request requires management approval"
  }
}
```

---

### Conflict Detection

#### POST /api/analyze-conflicts
**Description**: Analyze multiple policies for conflicts and inconsistencies  
**Authentication**: None required

**Request Body**:
```json
{
  "policies": [
    {
      "name": "AI Usage Policy",
      "content": "All AI tools must be pre-approved..."
    },
    {
      "name": "Client Data Policy", 
      "content": "Client data cannot be shared with AI systems..."
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "policies_analyzed": 2,
      "conflicts_found": 1,
      "severity_level": "medium",
      "resolution_complexity": "medium_complexity"
    },
    "conflicts": {
      "list": [
        {
          "type": "direct_contradiction",
          "severity": 0.9,
          "policies": ["policy_1", "policy_2"],
          "description": "Direct contradiction found between policies"
        }
      ]
    },
    "resolution": {
      "strategy": "guided_resolution",
      "recommendations": {
        "immediate_actions": ["Schedule stakeholder review meeting"],
        "short_term_solutions": ["Create interim policy guidelines"]
      }
    }
  }
}
```

---

### Dashboard Data Endpoints

#### GET /api/policies
**Description**: Retrieve all organizational policies  
**Authentication**: Session-based

**Response**:
```json
{
  "success": true,
  "policies": [
    {
      "id": "1643723400000",
      "title": "AI Usage Guidelines",
      "description": "Comprehensive AI tool usage policy",
      "createdAt": "2024-01-19T16:00:00.000Z",
      "status": "active"
    }
  ]
}
```

#### POST /api/policies
**Description**: Create a new organizational policy  
**Authentication**: Session-based

**Request Body**:
```json
{
  "title": "New AI Policy",
  "description": "Updated guidelines for AI tool usage"
}
```

#### GET /api/agencies
**Description**: Retrieve all registered agencies  
**Authentication**: Session-based

**Response**:
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

#### GET /api/enterprise/stats
**Description**: Get enterprise-level statistics  
**Authentication**: Session-based

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalAgencies": 3,
    "activePolicies": 5,
    "pendingSubmissions": 2,
    "averageComplianceRate": 92,
    "totalAgentActivities": 150,
    "totalOverrides": 3
  }
}
```

#### GET /api/agent/activity
**Description**: Get recent agent activities  
**Authentication**: None required  
**Query Parameters**: 
- `limit` (optional): Number of activities to return (default: 20)

**Response**:
```json
{
  "activities": [
    {
      "id": 1643723400000,
      "agent": "Policy Agent",
      "action": "Evaluated Request",
      "details": {
        "decisionStatus": "approved",
        "riskLevel": "medium"
      },
      "timestamp": "2024-01-19T16:00:00.000Z"
    }
  ],
  "total": 150
}
```

#### GET /api/audit-feed
**Description**: Get comprehensive audit trail feed  
**Authentication**: None required

**Response**:
```json
[
  {
    "timestamp": "2024-06-01T09:15:00Z",
    "event": "AI Decision Approved",
    "user": "jane.doe@agency.com",
    "tool": "ChatGPT",
    "outcome": "approved",
    "regTag": "FDA 21 CFR Part 11",
    "explanation": "AI-generated content approved under FDA guidelines"
  }
]
```

---

## AI Agents

### Context Agent

**Class**: `ContextAgent`  
**File**: `/agents/context-agent.js`  
**Purpose**: Analyzes user requests for urgency, context, and emotional state

#### Public Methods

##### `processUserInput(userMessage)`
**Description**: Main entry point for context analysis  
**Parameters**:
- `userMessage` (string): User's request message

**Returns**: Structured context analysis object

**Example**:
```javascript
const agent = new ContextAgent();
const result = agent.processUserInput("Need ChatGPT for Monday's presentation!!!");

console.log(result.urgency.level); // 1.0 (high urgency)
console.log(result.context.inferredType); // "client_presentation"
console.log(result.clarification.question); // Smart clarifying question
```

##### `analyzeContext(content, contextType)`
**Description**: API-compatible wrapper for backend integration  
**Parameters**:
- `content` (string): Content to analyze
- `contextType` (string): Expected context type

**Returns**: API-formatted response with relevance score

---

### Policy Agent

**Class**: `PolicyAgent`  
**File**: `/agents/policy-agent.js`  
**Purpose**: Makes intelligent compliance decisions based on context analysis

#### Public Methods

##### `evaluateRequest(contextAgentOutput)`
**Description**: Main policy evaluation method  
**Parameters**:
- `contextAgentOutput` (object): Output from Context Agent

**Returns**: Comprehensive policy decision object

**Example**:
```javascript
const policyAgent = new PolicyAgent();
const contextOutput = { /* Context Agent output */ };
const decision = policyAgent.evaluateRequest(contextOutput);

console.log(decision.decision.status); // "approved" | "denied" | "pending"
console.log(decision.risk.level); // "low" | "medium" | "high"
console.log(decision.conditions.guardrails); // Required guardrails
```

#### Key Features
- **Risk Assessment**: Multi-factor scoring (urgency, presentation type, timing)
- **Conditional Approvals**: Smart decisions with appropriate guardrails
- **Escalation Logic**: Automatic escalation for high-risk requests
- **Compliance Integration**: GDPR, CCPA, brand guidelines

---

### Negotiation Agent

**Class**: `NegotiationAgent`  
**File**: `/agents/negotiation-agent.js`  
**Purpose**: Handles multi-client policy conflicts and competitive relationships

#### Public Methods

##### `negotiateMultiClientRequest(contextAgentOutput, policyAgentOutput)`
**Description**: Processes multi-client conflicts  
**Parameters**:
- `contextAgentOutput` (object): Context analysis
- `policyAgentOutput` (object): Policy decision

**Returns**: Negotiation result with conflict resolution

**Example**:
```javascript
const negotiationAgent = new NegotiationAgent();
const result = negotiationAgent.negotiateMultiClientRequest(contextOutput, policyOutput);

console.log(result.relationships.competitors); // Competing client pairs
console.log(result.conflicts.total); // Number of conflicts found
console.log(result.solution.approach); // Resolution strategy
```

#### Features
- **Client Relationship Mapping**: Competitors, partners, neutral relationships
- **Conflict Detection**: Competitive intelligence, regulatory, brand conflicts
- **Solution Generation**: Compromise solutions with specific requirements
- **Industry Compliance**: Pharmaceutical, automotive, technology regulations

---

### Audit Agent

**Class**: `AuditAgent`  
**File**: `/agents/audit-agent.js`  
**Purpose**: Comprehensive compliance audit trail system

#### Public Methods

##### `startAuditSession(userMessage, userId)`
**Description**: Initialize new audit session  
**Parameters**:
- `userMessage` (string): Original user request
- `userId` (string): User identifier

**Returns**: Session ID

##### `logDecision(agentType, decisionType, decision, reasoning, policiesReferenced)`
**Description**: Log agent decisions for audit trail  
**Parameters**:
- `agentType` (string): Agent making decision
- `decisionType` (string): Type of decision
- `decision` (object): Decision details
- `reasoning` (string): Decision reasoning
- `policiesReferenced` (array): Referenced policies

**Returns**: Entry ID

##### `completeAuditSession(finalDecision, totalProcessingTime)`
**Description**: Complete audit session with summary  
**Parameters**:
- `finalDecision` (object): Final decision result
- `totalProcessingTime` (number): Total processing time

**Returns**: Complete session object

**Example**:
```javascript
const auditAgent = new AuditAgent();

// Start session
const sessionId = auditAgent.startAuditSession("User request", "user-123");

// Log decisions
auditAgent.logContextDecision(contextOutput);
auditAgent.logPolicyDecision(policyOutput, contextOutput);

// Complete session
const session = auditAgent.completeAuditSession(finalDecision, 1500);
```

##### `searchAuditLogs(criteria)`
**Description**: Search audit logs with criteria  
**Parameters**:
- `criteria` (object): Search criteria (agent, decision_type, status, etc.)

##### `exportAuditLogs(format, criteria)`
**Description**: Export audit logs in various formats  
**Parameters**:
- `format` (string): Export format ("json", "csv", "pdf")
- `criteria` (object): Optional search criteria

---

### Conflict Detection Agent

**Class**: `ConflictDetectionAgent`  
**File**: `/agents/conflict-detection-agent.js`  
**Purpose**: Analyzes multiple policies for conflicts and contradictions

#### Public Methods

##### `analyzeConflicts(policiesData)`
**Description**: Main conflict analysis method  
**Parameters**:
- `policiesData` (array): Array of policy objects to analyze

**Returns**: Comprehensive conflict report

**Example**:
```javascript
const agent = new ConflictDetectionAgent();
const policies = [
  { name: "Policy A", content: "..." },
  { name: "Policy B", content: "..." }
];

const report = await agent.analyzeConflicts(policies);
console.log(report.summary.conflicts_found);
console.log(report.resolution.strategy);
```

#### Features
- **AI-Enhanced Detection**: Uses AI service for deep conflict analysis
- **Multiple Conflict Types**: Direct contradictions, requirement overlaps, timeline conflicts
- **Resolution Strategies**: Automated, guided, or expert mediation approaches
- **Implementation Planning**: Detailed resolution timelines and resources

---

## Frontend Components

### Main Interface Components

#### AIComplyrUI Class
**File**: `/ui/script.js`  
**Purpose**: Main frontend controller for the compliance dashboard

##### Public Methods

##### `handleSubmit()`
**Description**: Process user input through the agent workflow  
**Usage**: Called when user clicks "Analyze Request" button

##### `processWithContextAgent(userMessage)`
**Description**: Send request to Context Agent API  
**Parameters**:
- `userMessage` (string): User's input message

**Returns**: Promise with context analysis

##### `processWithPolicyAgent(contextOutput)`
**Description**: Send context to Policy Agent API  
**Parameters**:
- `contextOutput` (object): Context Agent response

**Returns**: Promise with policy decision

##### `processWithNegotiationAgent(contextOutput, policyDecision)`
**Description**: Send request to Negotiation Agent API  
**Parameters**:
- `contextOutput` (object): Context Agent response
- `policyDecision` (object): Policy Agent response

**Returns**: Promise with negotiation result

**Example**:
```javascript
// Initialize the UI
const ui = new AIComplyrUI();

// Process a request programmatically
const contextOutput = await ui.processWithContextAgent("Need help with presentation");
const policyDecision = await ui.processWithPolicyAgent(contextOutput);
const negotiationResult = await ui.processWithNegotiationAgent(contextOutput, policyDecision);
```

### Dashboard Pages

#### 1. Main Dashboard (`/ui/index.html`)
**Purpose**: Primary compliance analysis interface  
**Features**:
- Real-time context analysis
- Policy decision display
- Risk assessment visualization
- Guardrails and monitoring requirements

#### 2. Negotiation Center (`/ui/negotiation-center.html`)
**Purpose**: Multi-client conflict resolution interface  
**Features**:
- Client relationship mapping
- Conflict visualization
- Solution planning
- Escalation management

#### 3. Policy Builder (`/ui/policy-builder.html`)
**Purpose**: Policy creation and management interface  
**Features**:
- Policy template library
- Rule configuration
- Conflict checking
- Version management

#### 4. Audit Trail (`/ui/audit-trail.html`)
**Purpose**: Compliance audit and reporting interface  
**Features**:
- Complete audit history
- Searchable decision logs
- Compliance reports
- Export functionality

#### 5. Workspace Admin (`/ui/workspace-admin.html`)
**Purpose**: Administrative dashboard for workspace management  
**Features**:
- User management
- Organization settings
- System monitoring
- Performance metrics

---

## Database Schema

### Core Tables

#### `organizations`
**Purpose**: Store client organizations, agencies, and enterprise entities

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    type VARCHAR CHECK (type IN ('enterprise', 'agency', 'client', 'partner', 'other')),
    competitive_group VARCHAR,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users`
**Purpose**: System users with role-based access

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `audit_sessions`
**Purpose**: Track complete compliance decision workflows

```sql
CREATE TABLE audit_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

#### `audit_entries`
**Purpose**: Individual agent decisions within sessions

```sql
CREATE TABLE audit_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES audit_sessions(session_id),
    timestamp TIMESTAMP DEFAULT NOW(),
    agent VARCHAR NOT NULL,
    decision_type VARCHAR,
    decision JSONB,
    reasoning TEXT[],
    policies_referenced TEXT[],
    before_state JSONB,
    after_state JSONB,
    risk_level VARCHAR,
    status VARCHAR,
    processing_time_ms INTEGER,
    metadata JSONB
);
```

#### `policies`
**Purpose**: Organizational compliance policies

```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR NOT NULL,
    risk_profiles JSONB,
    rules JSONB,
    version INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `relationships`
**Purpose**: Inter-organizational relationships (competitors, partners)

```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL,
    source_type VARCHAR CHECK (source_type IN ('organization', 'project', 'agency')),
    target_id UUID NOT NULL,
    target_type VARCHAR CHECK (target_type IN ('organization', 'project', 'agency')),
    relationship_type VARCHAR NOT NULL, -- 'competitor', 'partner', 'client', etc.
    competitive_group VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Authentication & Authorization

### Session Management

#### Login Endpoint
**POST** `/auth/login`

**Request**:
```json
{
  "email": "user@agency.com"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@agency.com",
    "role": "admin",
    "organization_id": "org-uuid"
  }
}
```

### Middleware Functions

#### `requireAdminAuth`
**Description**: Require admin-level JWT authentication  
**Usage**: Protect admin-only endpoints

```javascript
app.get('/admin/users', requireAdminAuth, (req, res) => {
  // Admin-only functionality
});
```

#### `requireSuperAdminAuth`
**Description**: Require super-admin level access  
**Usage**: Protect critical system operations

#### `requireActionAuth(action)`
**Description**: Action-specific authorization  
**Parameters**:
- `action` (string): Specific action requiring authorization

**Example**:
```javascript
app.post('/admin/restart', requireActionAuth('restart_agent'), (req, res) => {
  // Restart agent functionality
});
```

### Authorization Levels

1. **User**: Basic access to compliance tools
2. **Admin**: Manage organization settings and users
3. **Super-Admin**: Cross-organizational system management

---

## Usage Examples

### Complete Workflow Example

```javascript
// 1. Initialize agents
const contextAgent = new ContextAgent();
const policyAgent = new PolicyAgent();
const auditAgent = new AuditAgent();

// 2. Start audit session
const sessionId = auditAgent.startAuditSession(
  "Need ChatGPT for client presentation", 
  "user-123"
);

// 3. Process context
const contextOutput = contextAgent.processUserInput(
  "Need ChatGPT for Monday's presentation!!!"
);
auditAgent.logContextDecision(contextOutput);

// 4. Make policy decision
const policyDecision = policyAgent.evaluateRequest(contextOutput);
auditAgent.logPolicyDecision(policyDecision, contextOutput);

// 5. Handle multi-client scenarios
if (contextOutput.context.inferredType === 'client_presentation') {
  const negotiationAgent = new NegotiationAgent();
  const negotiationResult = negotiationAgent.negotiateMultiClientRequest(
    contextOutput, 
    policyDecision
  );
  auditAgent.logNegotiationDecision(negotiationResult, contextOutput, policyDecision);
}

// 6. Complete audit session
const completedSession = auditAgent.completeAuditSession(
  policyDecision, 
  1500 // processing time
);
```

### Frontend Integration Example

```javascript
// Initialize UI
const ui = new AIComplyrUI();

// Set up event handlers
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const userInput = document.getElementById('userInput').value;
  
  try {
    // Process through agent workflow
    const contextOutput = await ui.processWithContextAgent(userInput);
    const policyDecision = await ui.processWithPolicyAgent(contextOutput);
    
    // Display results
    ui.displayResults(contextOutput, policyDecision);
  } catch (error) {
    ui.showError('Analysis failed: ' + error.message);
  }
});
```

### API Integration Example

```javascript
// Context analysis API call
const analyzeContext = async (message) => {
  const response = await fetch('/api/process/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage: message,
      organizationId: 'org-123',
      userId: 'user-456'
    })
  });
  
  return await response.json();
};

// Policy evaluation API call
const evaluatePolicy = async (contextOutput) => {
  const response = await fetch('/api/process/policy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contextOutput: contextOutput,
      organizationId: 'org-123',
      userId: 'user-456'
    })
  });
  
  return await response.json();
};

// Usage
const main = async () => {
  const contextResult = await analyzeContext("Need help with presentation");
  const policyResult = await evaluatePolicy(contextResult);
  
  console.log('Decision:', policyResult.decision.status);
  console.log('Risk Level:', policyResult.risk.level);
};
```

---

## Integration Guide

### Setting Up Development Environment

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables**
```bash
# .env file
PORT=3000
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://user:password@localhost:5432/aicomplyr
```

3. **Database Setup**
```bash
npm run migrate
npm run seed
```

4. **Start Development Server**
```bash
npm run dev
```

### Adding New Agents

1. **Create Agent Class**
```javascript
// agents/my-agent.js
class MyAgent {
  constructor() {
    // Initialize agent
  }
  
  processRequest(input) {
    // Agent logic
    return result;
  }
}

module.exports = { MyAgent };
```

2. **Add to Routes**
```javascript
// api/routes.js
const { MyAgent } = require('../agents/my-agent.js');

router.post('/process/my-agent', async (req, res) => {
  const agent = new MyAgent();
  const result = agent.processRequest(req.body);
  res.json(result);
});
```

3. **Update Frontend**
```javascript
// ui/script.js
async processWithMyAgent(input) {
  const response = await fetch('/api/process/my-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  return await response.json();
}
```

### Custom Policy Rules

```javascript
// Define custom risk factors
const customPolicyAgent = new PolicyAgent();
customPolicyAgent.policies.custom_rule = {
  risk_factors: {
    weekend_usage: 0.3,
    external_client: 0.4
  },
  approval_thresholds: {
    auto_approve: 0.4,
    conditional_approve: 0.7,
    require_escalation: 0.9
  }
};
```

### Extending Database Schema

```sql
-- Add custom fields to existing tables
ALTER TABLE organizations ADD COLUMN custom_settings JSONB DEFAULT '{}';

-- Create custom tables
CREATE TABLE custom_compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    rule_name VARCHAR NOT NULL,
    rule_config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Deployment Considerations

1. **Environment Configuration**
   - Set production environment variables
   - Configure HTTPS and secure sessions
   - Set up database connection pooling

2. **Security**
   - Enable CORS restrictions for production
   - Implement rate limiting
   - Add input validation middleware

3. **Monitoring**
   - Set up application logging
   - Monitor agent performance
   - Track audit trail completeness

4. **Scaling**
   - Consider agent processing queues
   - Implement caching for frequent decisions
   - Database optimization and indexing

---

This comprehensive documentation covers all public APIs, functions, and components in the AICombly.io system. For additional support or specific implementation questions, refer to the individual agent files and test scenarios included in the codebase.