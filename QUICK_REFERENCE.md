# AIComplyr.io Quick Reference Guide

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd aicomplyr-intelligence
npm install
cp .env.example .env

# Database setup
createdb aicomplyr
npm run migrate

# Start server
npm start
```

## 📡 Core API Endpoints

### Health Check
```bash
GET /api/health
```

### Agent Workflow
```bash
# 1. Context Analysis
POST /api/process/context
{
  "userMessage": "Need ChatGPT for presentation!!!",
  "organizationId": "org-uuid",
  "userId": "user-uuid"
}

# 2. Policy Evaluation
POST /api/process/policy
{
  "contextOutput": {...},
  "organizationId": "org-uuid",
  "userId": "user-uuid"
}

# 3. Negotiation
POST /api/process/negotiation
{
  "contextOutput": {...},
  "policyDecision": {...},
  "organizationId": "org-uuid",
  "userId": "user-uuid"
}
```

### Conflict Detection
```bash
POST /api/analyze-conflicts
{
  "policies": [
    {"name": "Policy A", "content": "..."},
    {"name": "Policy B", "content": "..."}
  ]
}
```

## 🔑 Authentication

### Login
```javascript
POST /auth/login
{ "email": "user@example.com" }
```

### Protected Routes
```javascript
// Add header
Authorization: Bearer <jwt-token>
```

### Auth Levels
- **User**: Basic access
- **Admin**: `requireAdminAuth`
- **Super Admin**: `requireSuperAdminAuth`
- **Action-based**: `requireActionAuth('action_name')`

## 🤖 Agent Classes

### ConflictDetectionAgent
```javascript
const agent = new ConflictDetectionAgent();
const report = agent.analyzeConflicts(policies);
```

### ContextAgent
```javascript
const agent = new ContextAgent();
const result = agent.processUserInput(message);
```

### PolicyAgent
```javascript
const agent = new PolicyAgent();
const decision = await agent.evaluateRequest(context, orgId);
```

### NegotiationAgent
```javascript
const agent = new NegotiationAgent();
const result = await agent.negotiate(context, policy, orgId);
```

## 💾 Database Tables

```sql
-- Core tables
organizations    -- Companies/agencies
users           -- System users
policies        -- Compliance policies
audit_sessions  -- Audit trail sessions
audit_entries   -- Individual audit records
negotiations    -- Negotiation records
relationships   -- Inter-org relationships
```

## 🎨 UI Components

### Main Dashboard
```html
<!-- Input -->
<textarea id="userInput"></textarea>
<button id="submitBtn">Analyze</button>

<!-- Results -->
<div id="urgencyBar"></div>
<div id="decisionStatus"></div>
<div id="riskFill"></div>
```

### JavaScript Functions
```javascript
// Main workflow
analyzeRequest()

// UI updates
updateUrgencyDisplay(level)
updatePolicyDisplay(data)
updateContextDisplay(data)

// Utilities
formatContextType(type)
getUrgencyLabel(level)
animateValue(element, start, end, duration)
```

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=secret
SESSION_SECRET=secret
```

### Policy Structure
```javascript
{
  name: "Policy Name",
  riskProfiles: {
    low: { threshold: 0.3, autoApprove: true },
    medium: { threshold: 0.7, requiresReview: true },
    high: { threshold: 0.9, requiresExecutiveApproval: true }
  },
  rules: [
    { type: "tool", value: "chatgpt", risk: 0.5 }
  ]
}
```

## 📊 Response Formats

### Context Analysis Response
```json
{
  "urgency": {
    "level": 0.85,
    "emotionalState": "stressed",
    "timePressure": 0.9
  },
  "context": {
    "inferredType": "client_presentation",
    "confidence": 0.75,
    "reasoning": ["..."]
  },
  "clarification": {
    "question": "Is this for...",
    "purpose": "refine_context"
  }
}
```

### Policy Decision Response
```json
{
  "decision": {
    "status": "approved|pending|rejected",
    "type": "ai_usage_request"
  },
  "risk": {
    "score": 0.75,
    "level": "high|medium|low"
  },
  "conditions": {
    "guardrails": {...},
    "compliance_requirements": [...]
  }
}
```

### Conflict Report Response
```json
{
  "summary": {
    "policies_analyzed": 2,
    "conflicts_found": 3,
    "severity_level": "medium",
    "resolution_complexity": "medium_complexity"
  },
  "conflicts": {
    "list": [...],
    "severity_breakdown": {...}
  },
  "resolution": {
    "strategy": {...},
    "recommendations": {...}
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test
npm run test:agents
npm run test:api

# Test individual endpoints
curl -X GET http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/process/context \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "test"}'
```

## 🐛 Common Issues

### Database Connection
```bash
# Check connection
psql -d aicomplyr -c "SELECT 1"

# Reset database
dropdb aicomplyr && createdb aicomplyr
npm run migrate
```

### Auth Issues
```javascript
// Check token
console.log(localStorage.getItem('authToken'));

// Verify JWT
jwt.verify(token, process.env.JWT_SECRET);
```

### CORS Issues
```javascript
// Server config
app.use(cors({
  origin: true,
  credentials: true
}));
```

## 📝 CSS Classes

### Status Indicators
```css
.status-approved { color: green; }
.status-pending { color: orange; }
.status-rejected { color: red; }

.risk-low { background: #10b981; }
.risk-medium { background: #f59e0b; }
.risk-high { background: #ef4444; }
```

### Components
```css
.card { /* Main content container */ }
.urgency-meter { /* Urgency display */ }
.btn-primary { /* Primary button */ }
.loading-spinner { /* Loading state */ }
```

## 🔗 Useful Commands

```bash
# Development
npm run dev          # Start in dev mode
npm run lint         # Run linter
npm run format       # Format code

# Database
npm run migrate      # Run migrations
npm run seed         # Seed data
npm run db:reset     # Reset database

# Production
npm run build        # Build for production
npm run start:prod   # Start production server
```

## 📦 Key Dependencies

- **express**: Web framework
- **pg**: PostgreSQL client
- **jsonwebtoken**: JWT auth
- **cors**: CORS middleware
- **express-session**: Session management
- **dotenv**: Environment variables

---

**Need more help?** Check the full documentation:
- [API Documentation](./API_DOCUMENTATION.md)
- [UI Documentation](./UI_DOCUMENTATION.md)
- [Main README](./README.md)