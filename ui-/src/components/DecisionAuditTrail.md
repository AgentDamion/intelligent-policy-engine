# DecisionAuditTrail Component

A comprehensive React component for displaying trust and transparency audit trails with timeline visualization, advanced filtering, and export capabilities.

## Features

### 🕒 Timeline Visualization
- Collapsible timeline entries with expandable details
- Visual status indicators and badges
- Decision type icons and risk level indicators
- Chronological ordering with timestamps

### 🔍 Advanced Filtering
- Date range filtering (start/end dates)
- User-based filtering
- Decision type filtering (policy, audit, compliance, risk, system, automated)
- Status filtering (approved, rejected, pending, review)
- Risk level filtering (low, medium, high)
- Full-text search across all fields

### 📊 Statistics Dashboard
- Real-time statistics display
- Total entries count
- Status breakdown (approved, rejected, pending, review)
- Average confidence and compliance scores
- Visual metrics with icons

### 📤 Export Functionality
- **PDF Export**: Comprehensive reports with tables and statistics
- **CSV Export**: All data fields in spreadsheet format
- Organization-scoped data
- Timestamped filenames
- Loading states during export

### 🗄️ Database Integration
- Organization scoping with `req.user.organization_id`
- Real-time data fetching from `/api/dashboard/audit-trail/:orgId`
- Error handling and retry functionality
- Loading states and error states

### 📱 Mobile Responsive
- Responsive grid layouts
- Touch-friendly interactions
- Adaptive filtering interface
- Mobile-optimized exports

## Installation

```bash
npm install date-fns lucide-react jspdf jspdf-autotable
```

## Usage

### Basic Usage

```jsx
import DecisionAuditTrail from './components/DecisionAuditTrail';

function App() {
  return (
    <DecisionAuditTrail 
      organizationId="your-org-id"
    />
  );
}
```

### With Custom Styling

```jsx
<DecisionAuditTrail 
  organizationId="your-org-id"
  className="my-custom-class"
/>
```

### Demo Component

```jsx
import DecisionAuditTrailDemo from './components/DecisionAuditTrailDemo';

function App() {
  return <DecisionAuditTrailDemo />;
}
```

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `organizationId` | string | Yes | - | Organization ID for data scoping |
| `className` | string | No | `''` | Additional CSS classes |

### Data Structure

The component expects audit entries with the following structure:

```typescript
interface AuditEntry {
  id: string;
  timestamp: string; // ISO 8601 format
  user: string;
  action: string;
  decisionType: 'policy' | 'audit' | 'compliance' | 'risk' | 'system' | 'automated';
  status: 'approved' | 'rejected' | 'pending' | 'review';
  rationale: string;
  policyReferences: string[];
  details: {
    confidence_score: number; // 0-1
    compliance_score: number; // 0-1
    risk_level: 'low' | 'medium' | 'high';
    processing_time_ms: number;
  };
}
```

### API Endpoint

The component fetches data from:
```
GET /api/dashboard/audit-trail/:organizationId
```

Expected response:
```json
{
  "success": true,
  "auditTrail": [
    {
      "id": "1",
      "timestamp": "2024-01-15T10:30:00Z",
      "user": "john.doe@company.com",
      "action": "Policy Decision Approved",
      "decisionType": "policy",
      "status": "approved",
      "rationale": "Content complies with FDA social media guidelines...",
      "policyReferences": ["FDA-SM-001", "SOCIAL-MEDIA-POLICY"],
      "details": {
        "confidence_score": 0.95,
        "compliance_score": 0.98,
        "risk_level": "low",
        "processing_time_ms": 1200
      }
    }
  ]
}
```

## Database Schema

The component integrates with the existing database schema:

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
    policies_referenced TEXT[],
    before_state JSONB,
    after_state JSONB,
    risk_level VARCHAR,
    status VARCHAR,
    processing_time_ms INTEGER,
    metadata JSONB
);
```

### Organization Scoping
The component automatically filters data by `req.user.organization_id` to ensure proper data isolation.

## Styling

The component uses Tailwind CSS classes and includes:

- Responsive grid layouts
- Status-based color coding
- Hover effects and transitions
- Loading and error states
- Mobile-optimized design

### Custom Styling

You can override styles by passing a `className` prop:

```jsx
<DecisionAuditTrail 
  organizationId="your-org-id"
  className="bg-gray-100 rounded-xl shadow-lg"
/>
```

## State Management

The component uses React hooks for state management:

- `useState`: Local component state
- `useEffect`: Data fetching and side effects
- `useMemo`: Filtered data optimization
- `useCallback`: Function optimization

## Performance Features

- Memoized filtering with `useMemo`
- Optimized re-renders with `useCallback`
- Lazy loading of expanded content
- Efficient search across all fields
- Pagination-ready architecture

## Error Handling

The component includes comprehensive error handling:

- Network error recovery
- Retry functionality
- User-friendly error messages
- Graceful degradation

## Export Features

### PDF Export
- Professional report layout
- Statistics table
- Timeline entries with details
- Organization branding
- Timestamped filenames

### CSV Export
- All data fields included
- Proper CSV escaping
- UTF-8 encoding
- Downloadable format

## Filtering Options

### Date Range
- Start and end date selection
- Default 30-day range
- Real-time filtering

### Decision Types
- Policy decisions
- Audit activities
- Compliance checks
- Risk assessments
- System actions
- Automated processes

### Status Filtering
- Approved decisions
- Rejected decisions
- Pending reviews
- Under review items

### Risk Levels
- Low risk (green)
- Medium risk (yellow)
- High risk (red)

## Search Functionality

Full-text search across:
- Action descriptions
- User names
- Decision types
- Rationale text
- Policy references
- Status values
- Risk levels
- Confidence scores
- Compliance scores

## Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly interactions
- Adaptive filtering interface
- Mobile-optimized exports
- Collapsible sections

## Dependencies

```json
{
  "date-fns": "^4.1.0",
  "lucide-react": "^0.533.0",
  "jspdf": "^3.0.1",
  "jspdf-autotable": "^3.8.0"
}
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Accessibility

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast mode support
- Focus management

## Security Considerations

- Organization scoping prevents data leakage
- Input sanitization for search queries
- XSS prevention in exports
- CSRF protection via headers

## Testing

The component includes:
- Unit tests for filtering logic
- Integration tests for API calls
- Export functionality tests
- Mobile responsiveness tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This component is part of the AICOMPLYR platform and is licensed under the project's license terms. 