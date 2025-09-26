# Human Override System

A comprehensive human override system for AI decisions that provides structured workflows, audit trails, and compliance management for AICOMPLYR.io.

## 🎯 Overview

The Human Override System enables users to request human review of AI decisions when:
- AI confidence is below acceptable thresholds
- Policy ambiguity requires human interpretation
- Business context is missing from AI analysis
- Regulatory complexity requires expert review
- Edge cases not covered by standard policies

## 🏗️ Architecture

### Database Schema

**Enhanced `audit_entries` table:**
```sql
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_reason VARCHAR(100);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_justification TEXT;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested_by UUID REFERENCES users(id);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_reviewed_by UUID REFERENCES users(id);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_review_notes TEXT;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested_at TIMESTAMP;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_resolved_at TIMESTAMP;
```

**Supporting tables:**
- `override_reasons` - Standardized override reason categories
- `override_workflows` - Workflow management and routing
- `override_audit_log` - Complete activity audit trail

### Backend API

**Core Endpoints:**
- `GET /api/overrides/reasons` - Get available override reasons
- `POST /api/overrides/request` - Submit override request
- `GET /api/overrides/pending` - Get pending override requests
- `POST /api/overrides/:decisionId/review` - Review and approve/reject override
- `GET /api/overrides/:decisionId/history` - Get override history
- `GET /api/overrides/dashboard` - Get dashboard statistics
- `POST /api/overrides/:decisionId/cancel` - Cancel override request

### Frontend Components

**Core Components:**
- `HumanOverrideRequest` - Override request form
- `OverrideReviewPanel` - Review and decision panel
- `HumanOverrideDemo` - Complete system demonstration

## 📊 Data Flow

```
User Request → Override Form → API Validation → Database Update → Workflow Creation → Review Queue → Human Review → Decision Update → Audit Log
```

1. **User identifies decision requiring override**
2. **Opens override request form with standardized reasons**
3. **Submits request with justification and priority**
4. **System creates workflow and assigns reviewer**
5. **Reviewer receives notification and reviews request**
6. **Reviewer approves/rejects with new decision or notes**
7. **System updates original decision and logs all activities**

## 🔧 API Endpoints

### Override Reasons

```http
GET /api/overrides/reasons
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "reasons": {
    "QUALITY": [
      {
        "reason_code": "AI_CONFIDENCE_LOW",
        "reason_name": "Low AI Confidence",
        "description": "AI confidence score below acceptable threshold",
        "category": "QUALITY",
        "requires_justification": true,
        "requires_review": true
      }
    ],
    "POLICY": [
      {
        "reason_code": "POLICY_AMBIGUITY",
        "reason_name": "Policy Ambiguity",
        "description": "Unclear or conflicting policy requirements",
        "category": "POLICY",
        "requires_justification": true,
        "requires_review": true
      }
    ]
  }
}
```

### Request Override

```http
POST /api/overrides/request
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "decisionId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "AI_CONFIDENCE_LOW",
  "justification": "AI confidence score of 72% is below our 80% threshold...",
  "priority": "normal",
  "assignedReviewer": "reviewer@company.com"
}
```

### Review Override

```http
POST /api/overrides/:decisionId/review
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "approved",
  "notes": "Override approved based on additional context...",
  "newDecision": {
    "status": "approved",
    "reasoning": "Content is compliant with additional context...",
    "decision": {}
  }
}
```

## 🎨 Frontend Components

### HumanOverrideRequest

**Usage:**
```jsx
import HumanOverrideRequest from './components/HumanOverrideRequest';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [decisionId, setDecisionId] = useState('');

  return (
    <div>
      <button onClick={() => {
        setDecisionId('decision-uuid');
        setIsOpen(true);
      }}>
        Request Override
      </button>
      
      <HumanOverrideRequest
        decisionId={decisionId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(overrideId) => console.log('Override requested:', overrideId)}
      />
    </div>
  );
}
```

**Features:**
- **Standardized Reason Categories**: Quality, Policy, Context, Compliance, Exception, Technical, Urgency, Business, Risk
- **Detailed Justification**: Required text area for comprehensive explanation
- **Priority Levels**: Low, Normal, High, Urgent with visual indicators
- **Optional Reviewer Assignment**: Direct assignment or automatic routing
- **Form Validation**: Ensures all required fields are completed
- **Success/Error States**: Clear feedback on submission status

### OverrideReviewPanel

**Usage:**
```jsx
import OverrideReviewPanel from './components/OverrideReviewPanel';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState(null);

  return (
    <div>
      <button onClick={() => {
        setSelectedOverride(overrideData);
        setIsOpen(true);
      }}>
        Review Override
      </button>
      
      <OverrideReviewPanel
        override={selectedOverride}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onReview={(reviewData) => console.log('Override reviewed:', reviewData)}
      />
    </div>
  );
}
```

**Features:**
- **Comprehensive Review Interface**: Split-panel layout with details and actions
- **Multiple Review Actions**: Approve, Reject, Cancel with clear visual indicators
- **New Decision Specification**: When approving, specify new decision status and reasoning
- **Review Notes**: Required notes field for audit trail
- **Original Decision Context**: Shows original AI decision for comparison
- **Time Tracking**: Displays how long override has been pending

## 🗄️ Database Schema

### Enhanced audit_entries Table

```sql
-- Override columns added to existing audit_entries table
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_reason VARCHAR(100);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_justification TEXT;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested_by UUID REFERENCES users(id);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_reviewed_by UUID REFERENCES users(id);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_review_notes TEXT;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested_at TIMESTAMP;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_resolved_at TIMESTAMP;
```

### override_reasons Table

```sql
CREATE TABLE IF NOT EXISTS override_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason_code VARCHAR(50) UNIQUE NOT NULL,
    reason_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    requires_justification BOOLEAN DEFAULT TRUE,
    requires_review BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### override_workflows Table

```sql
CREATE TABLE IF NOT EXISTS override_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES audit_entries(entry_id),
    workflow_type VARCHAR(50) NOT NULL,
    current_step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    assigned_reviewer UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'normal',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### override_audit_log Table

```sql
CREATE TABLE IF NOT EXISTS override_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES audit_entries(entry_id),
    action_type VARCHAR(50) NOT NULL,
    action_by UUID NOT NULL REFERENCES users(id),
    action_details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT Token Validation**: All endpoints require valid JWT tokens
- **Organization Scoping**: All data filtered by `req.user.organization_id`
- **Role-based Permissions**: `review_overrides` permission required for review actions
- **User Tracking**: All actions logged with user ID for audit trail

### Data Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **UUID Validation**: Decision IDs validated for proper UUID format
- **Required Fields**: Server-side validation of all required fields
- **Status Validation**: Override status changes validated against business rules

### Audit Trail
- **Complete Activity Logging**: Every action logged with timestamp and user
- **Decision History**: Full history of override requests and reviews
- **Compliance Reporting**: Structured data for regulatory compliance
- **Audit Queries**: Optimized queries for audit and compliance reports

## 📱 Mobile Responsiveness

### Responsive Design
- **Mobile-first Approach**: Optimized for mobile devices
- **Touch-friendly Interactions**: Large touch targets and intuitive gestures
- **Adaptive Layouts**: Responsive grid systems for different screen sizes
- **Progressive Enhancement**: Core functionality works on all devices

### Performance Optimization
- **Lazy Loading**: Override reasons loaded on demand
- **Efficient State Management**: Minimal re-renders and optimized updates
- **Bundle Optimization**: Tree-shaking and code splitting for smaller bundles
- **Caching Strategy**: Intelligent caching of frequently accessed data

## 🎯 Use Cases

### 1. Compliance Officers
- **Need**: Review AI decisions that may have compliance implications
- **Solution**: Structured override process with detailed audit trail
- **Benefit**: Regulatory compliance with documented human oversight

### 2. AI Governance Teams
- **Need**: Monitor and improve AI decision quality
- **Solution**: Analytics dashboard with override reason breakdown
- **Benefit**: Continuous improvement of AI systems based on override patterns

### 3. Business Users
- **Need**: Request human review when AI lacks business context
- **Solution**: Simple override request form with standardized reasons
- **Benefit**: Faster resolution of edge cases and business-specific scenarios

### 4. Legal Teams
- **Need**: Comprehensive documentation for legal defensibility
- **Solution**: Complete audit trail with decision history
- **Benefit**: Legal protection with documented human oversight process

## 🚀 Implementation Guide

### 1. Database Migration

```bash
# Run the migration
psql -d your_database -f database/migrations/005_add_human_override_system.sql
```

### 2. Backend Setup

```bash
# Add the overrides API route
npm install express-jwt jwks-rsa

# Update server-railway.js
const overridesRoutes = require('./api/overrides');
app.use('/api/overrides', overridesRoutes);
```

### 3. Frontend Setup

```bash
# Install dependencies
npm install lucide-react

# Import components
import HumanOverrideRequest from './components/HumanOverrideRequest';
import OverrideReviewPanel from './components/OverrideReviewPanel';
```

### 4. Integration

```jsx
// Add override request button to decision components
<button onClick={() => openOverrideRequest(decision.id)}>
  Request Override
</button>

// Add override review to admin panels
<button onClick={() => openOverrideReview(override)}>
  Review Override
</button>
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.aicomplyr.io

# Override Settings
OVERRIDE_REQUIRES_REVIEW=true
OVERRIDE_MAX_PENDING_HOURS=24
OVERRIDE_AUTO_ESCALATION=true
```

### API Configuration

```javascript
// api/overrides.js
const router = express.Router();
router.use(checkJwt, requireOrganizationAccess);

// Review endpoints require special permission
router.post('/:decisionId/review', checkJwt, requireOrganizationAccess, requirePermission('review_overrides'));
```

## 📊 Analytics & Monitoring

### Metrics Tracked
- **Override Volume**: Total requests, approvals, rejections
- **Resolution Time**: Average time to resolve overrides
- **Reason Analysis**: Breakdown of override reasons
- **User Activity**: Most active requesters and reviewers
- **SLA Compliance**: Time to first review and resolution

### Monitoring
- **API Performance**: Response times and error rates
- **Database Performance**: Query optimization and indexing
- **User Experience**: Form completion rates and error patterns
- **System Health**: Workflow queue monitoring and alerting

## 🔄 Future Enhancements

### Planned Features
- **Automated Routing**: AI-powered reviewer assignment
- **Escalation Workflows**: Automatic escalation for urgent overrides
- **Integration APIs**: Connect with external workflow systems
- **Advanced Analytics**: Machine learning insights on override patterns
- **Mobile App**: Native mobile application for override management

### Performance Improvements
- **Real-time Updates**: WebSocket integration for live status updates
- **Caching Strategy**: Redis cache for frequently accessed data
- **Pagination**: Handle large numbers of override requests
- **Search & Filter**: Advanced search capabilities across overrides

## 🧪 Testing

### Unit Tests
```javascript
// Test override request API
describe('Override Request API', () => {
  it('should create override request with valid data', async () => {
    const response = await request(app)
      .post('/api/overrides/request')
      .set('Authorization', 'Bearer valid-token')
      .send({
        decisionId: 'valid-uuid',
        reason: 'AI_CONFIDENCE_LOW',
        justification: 'Test justification'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Test override workflow
describe('Override Workflow', () => {
  it('should complete full override lifecycle', async () => {
    // 1. Request override
    const requestResponse = await createOverrideRequest();
    
    // 2. Review override
    const reviewResponse = await reviewOverride(requestResponse.overrideId);
    
    // 3. Verify audit trail
    const auditResponse = await getOverrideHistory(requestResponse.overrideId);
    
    expect(auditResponse.history.length).toBeGreaterThan(0);
  });
});
```

## 📚 Documentation

### API Documentation
- **OpenAPI Specification**: Complete API documentation
- **Postman Collection**: Ready-to-use API collection
- **Example Requests**: Sample requests for all endpoints
- **Error Codes**: Comprehensive error code documentation

### Component Documentation
- **Storybook Integration**: Interactive component documentation
- **Usage Examples**: Real-world usage patterns
- **Props Reference**: Complete props documentation
- **Styling Guide**: Customization and theming guide

## 🤝 Contributing

### Development Setup
1. **Fork Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/human-override`
3. **Install Dependencies**: `npm install`
4. **Run Tests**: `npm test`
5. **Submit Pull Request**: With comprehensive description

### Code Standards
- **ESLint Configuration**: Consistent code style
- **Prettier Formatting**: Automatic code formatting
- **TypeScript**: Type safety for all components
- **Comprehensive Comments**: Inline documentation

## 📄 License

This component is part of the AICOMPLYR platform and is licensed under the project's license terms.

---

**Human Override System** - Enabling human oversight and control over AI decisions with comprehensive audit trails and compliance management. 