# Decision Explainability System

A comprehensive AI decision explainability system for AICOMPLYR.io that provides transparency into AI governance decisions through detailed explanations, policy evaluations, and alternative outcomes.

## 🎯 Overview

The Decision Explainability System answers the critical question: **"Why did the AI make this decision?"** by providing:

- **Policy Evaluation**: Which policies were considered and their weights
- **Confidence Analysis**: How confident the AI was in its decision
- **Key Factors**: What factors influenced the decision
- **Alternative Outcomes**: What other outcomes were possible
- **Transparency Tools**: Share and export explanation data

## 🏗️ Architecture

### Backend API

**Endpoint**: `GET /api/decisions/explain/:decisionId`

**Authentication**: JWT token with organization scoping

**Database Integration**: 
- `audit_entries` table for decision data
- `audit_policy_references` table for policy evaluations
- `policies` table for policy details

### Frontend Component

**Component**: `DecisionExplainer`

**Features**:
- Modal interface with tabbed navigation
- Interactive policy tree visualization
- Confidence meters with color coding
- Alternative outcomes comparison
- Share and export functionality

## 📊 Data Flow

```
User Request → API Gateway → Decision Service → Database → Explanation Data → Frontend Component
```

1. **User clicks "Why this decision?"** on any decision
2. **Frontend calls** `/api/decisions/explain/:decisionId`
3. **Backend fetches** decision data from `audit_entries`
4. **Policy evaluation** data from `audit_policy_references`
5. **Alternative outcomes** calculated based on risk factors
6. **Structured response** returned to frontend
7. **Modal displays** explanation with interactive tabs

## 🔧 API Endpoints

### Main Explanation Endpoint

```http
GET /api/decisions/explain/:decisionId
Authorization: Bearer <jwt_token>
X-Organization-ID: <org_id>
```

**Response Format**:
```json
{
  "success": true,
  "explanation": {
    "decision_id": "550e8400-e29b-41d4-a716-446655440000",
    "decision_type": "policy",
    "agent": "ai-governance-agent",
    "timestamp": "2024-01-15T10:30:00Z",
    "policies_evaluated": [
      {
        "policy_name": "Global MLR Policy v2.1",
        "policy_version": "2.1",
        "policy_section": "Social Media Guidelines",
        "weight": 40,
        "status": "passed",
        "rule_triggered": "healthcare_content_review",
        "relevance_score": 0.85
      }
    ],
    "key_factors": [
      {
        "factor": "medium_urgency",
        "impact": -15,
        "description": "Reduced risk due to non-urgent timeline"
      }
    ],
    "final_calculation": {
      "risk_score": 55,
      "outcome": "conditional_approval",
      "confidence": 0.87,
      "compliance_score": 0.92,
      "processing_time_ms": 1200
    },
    "alternative_outcomes": [
      {
        "outcome": "approved",
        "probability": 0.6,
        "reason": "High compliance score",
        "impact": "Content approved without restrictions"
      }
    ],
    "reasoning": "Content complies with FDA social media guidelines...",
    "before_state": {...},
    "after_state": {...},
    "metadata": {...}
  }
}
```

### Policy Details Endpoint

```http
GET /api/decisions/:decisionId/policies
```

Returns detailed policy evaluation information including rules and risk profiles.

### Confidence Breakdown Endpoint

```http
GET /api/decisions/:decisionId/confidence
```

Returns confidence factors, uncertainty levels, and recommendations.

## 🎨 Frontend Component

### Usage

```jsx
import DecisionExplainer from './components/DecisionExplainer';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [decisionId, setDecisionId] = useState('');

  return (
    <div>
      <button onClick={() => {
        setDecisionId('decision-uuid');
        setIsOpen(true);
      }}>
        Why this decision?
      </button>
      
      <DecisionExplainer
        decisionId={decisionId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
```

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `decisionId` | string | Yes | UUID of the decision to explain |
| `isOpen` | boolean | Yes | Controls modal visibility |
| `onClose` | function | Yes | Callback when modal closes |
| `className` | string | No | Additional CSS classes |

### Component Features

#### 1. Overview Tab
- **Decision Summary**: Status, confidence, compliance, risk scores
- **Decision Reasoning**: Human-readable explanation
- **Quick Stats**: Policy count, factors, alternatives, processing time

#### 2. Policies Tab
- **Policy List**: All evaluated policies with weights
- **Expandable Details**: Click to see policy sections and rules
- **Status Indicators**: Passed/failed/neutral with color coding
- **Policy Links**: Direct links to policy documents

#### 3. Key Factors Tab
- **Factor Breakdown**: What influenced the decision
- **Impact Visualization**: Positive/negative/neutral impacts
- **Factor Descriptions**: Detailed explanations of each factor

#### 4. Alternatives Tab
- **Alternative Outcomes**: What other decisions were possible
- **Probability Analysis**: Likelihood of each alternative
- **Impact Assessment**: What each alternative would mean
- **Actual Outcome**: Highlighted current decision

#### 5. Details Tab
- **Technical Information**: Decision ID, type, agent, timestamp
- **Performance Metrics**: Processing time, scores, calculations
- **Metadata**: Raw technical data for debugging

## 🗄️ Database Schema

### audit_entries Table
```sql
CREATE TABLE audit_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES audit_sessions(session_id),
    timestamp TIMESTAMP DEFAULT NOW(),
    agent VARCHAR NOT NULL,
    decision_type VARCHAR,
    decision JSONB,
    reasoning TEXT[],
    confidence_score DECIMAL(3,2),
    compliance_score DECIMAL(3,2),
    risk_level VARCHAR,
    risk_score DECIMAL(3,2),
    risk_factors JSONB,
    confidence_factors JSONB,
    before_state JSONB,
    after_state JSONB,
    status VARCHAR,
    processing_time_ms INTEGER,
    metadata JSONB
);
```

### audit_policy_references Table
```sql
CREATE TABLE audit_policy_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id VARCHAR(255) NOT NULL REFERENCES audit_entries(entry_id),
    policy_id VARCHAR(255) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_version VARCHAR(50) NOT NULL,
    policy_section VARCHAR(255),
    relevance DECIMAL(3,2) NOT NULL,
    impact VARCHAR(50) DEFAULT 'neutral',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Features

### Organization Scoping
- All API calls automatically filtered by `req.user.organization_id`
- Prevents cross-organization data access
- Secure multi-tenant architecture

### Authentication
- JWT token validation on all endpoints
- Role-based access control
- Session management

### Data Validation
- UUID format validation for decision IDs
- Input sanitization
- SQL injection prevention

## 📱 Mobile Responsiveness

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Adaptive layouts for different screen sizes
- Optimized for tablets and phones

### Performance
- Lazy loading of explanation data
- Efficient state management
- Optimized re-renders
- Minimal bundle size

## 🎯 Use Cases

### 1. Compliance Officers
- **Need**: Understand why AI approved/rejected content
- **Solution**: Detailed policy evaluation with rule explanations
- **Benefit**: Audit trail for regulatory compliance

### 2. Marketing Teams
- **Need**: Quick understanding of decision rationale
- **Solution**: Visual confidence meters and key factors
- **Benefit**: Faster content iteration and approval

### 3. Legal Teams
- **Need**: Comprehensive decision documentation
- **Solution**: Exportable reports with all technical details
- **Benefit**: Legal defensibility and record keeping

### 4. AI Governance Teams
- **Need**: Monitor and improve AI decision quality
- **Solution**: Alternative outcomes and confidence analysis
- **Benefit**: Continuous AI system improvement

## 🚀 Implementation Guide

### 1. Backend Setup

```bash
# Add the decisions API route
npm install express-jwt jwks-rsa

# Update server-railway.js
const decisionsRoutes = require('./api/decisions');
app.use('/api/decisions', decisionsRoutes);
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install lucide-react

# Import component
import DecisionExplainer from './components/DecisionExplainer';
```

### 3. Database Migration

```sql
-- Ensure audit_policy_references table exists
CREATE TABLE IF NOT EXISTS audit_policy_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id VARCHAR(255) NOT NULL REFERENCES audit_entries(entry_id),
    policy_id VARCHAR(255) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_version VARCHAR(50) NOT NULL,
    policy_section VARCHAR(255),
    relevance DECIMAL(3,2) NOT NULL,
    impact VARCHAR(50) DEFAULT 'neutral',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Integration

```jsx
// Add to any decision list or detail view
<button onClick={() => openExplainer(decision.id)}>
  Why this decision?
</button>

<DecisionExplainer
  decisionId={selectedDecisionId}
  isOpen={isExplainerOpen}
  onClose={closeExplainer}
/>
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.aicomplyr.io

# API Settings
API_PORT=3000
NODE_ENV=production
```

### API Configuration

```javascript
// api/decisions.js
const router = express.Router();
router.use(checkJwt, requireOrganizationAccess);
```

## 📊 Analytics & Monitoring

### Metrics Tracked
- Decision explanation views
- Policy evaluation accuracy
- Confidence score distribution
- Alternative outcome analysis
- User engagement patterns

### Monitoring
- API response times
- Error rates and types
- Database query performance
- Frontend component usage

## 🔄 Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live explanations
- **Advanced Analytics**: Machine learning insights on decision patterns
- **Custom Explanations**: User-defined explanation templates
- **Integration APIs**: Connect with external policy management systems
- **Audit Trail**: Complete history of explanation views and exports

### Performance Improvements
- **Caching**: Redis cache for frequently accessed explanations
- **Pagination**: Handle large numbers of policies and factors
- **Lazy Loading**: Progressive loading of explanation components
- **CDN**: Static asset optimization

## 🧪 Testing

### Unit Tests
```javascript
// Test API endpoints
describe('Decision Explanation API', () => {
  it('should return explanation for valid decision ID', async () => {
    const response = await request(app)
      .get('/api/decisions/explain/valid-uuid')
      .set('Authorization', 'Bearer valid-token');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Test component integration
describe('DecisionExplainer Component', () => {
  it('should display explanation data correctly', () => {
    render(<DecisionExplainer decisionId="test-id" isOpen={true} />);
    expect(screen.getByText('Decision Explanation')).toBeInTheDocument();
  });
});
```

## 📚 Documentation

### API Documentation
- Swagger/OpenAPI specification
- Postman collection
- Example requests and responses

### Component Documentation
- Storybook integration
- Usage examples
- Props reference
- Styling guide

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Install dependencies
4. Run tests
5. Submit pull request

### Code Standards
- ESLint configuration
- Prettier formatting
- TypeScript for type safety
- Comprehensive comments

## 📄 License

This component is part of the AICOMPLYR platform and is licensed under the project's license terms.

---

**Decision Explainability System** - Making AI decisions transparent, understandable, and accountable. 