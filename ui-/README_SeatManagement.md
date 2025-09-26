# Enterprise Seat Management Dashboard

A comprehensive seat management system for AICOMPLYR Enterprise users that enables creation, management, and monitoring of agency seats with full policy control and compliance tracking.

## 🎯 Overview

The Enterprise Seat Management Dashboard provides enterprise users with powerful tools to manage agency seats within their organization. It includes visual seat utilization tracking, multi-step onboarding workflows, bulk policy assignment, and real-time compliance monitoring.

## 🚀 Features

### Core Functionality
- **Seat Overview Dashboard**: Visual metrics showing seat utilization, compliance scores, and key performance indicators
- **Multi-step Seat Creation**: Guided workflow for creating new agency seats with policy assignment
- **Bulk Policy Assignment**: Assign policies to multiple seats simultaneously with flexible rollout options
- **Real-time Analytics**: Live compliance tracking and detailed reports for each seat
- **Permission Management**: Granular control over seat permissions and user limits
- **User Invitations**: Invite users to seats with role-based access control

### Technical Features
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Dark Mode Support**: Automatic dark mode detection and styling
- **Real-time Updates**: WebSocket integration for live notifications and data updates
- **Error Handling**: Comprehensive error boundaries and retry mechanisms
- **Authentication**: JWT token handling with automatic refresh
- **Database Integration**: Full support for existing database schema

## 📁 File Structure

```
ui/
├── components/
│   ├── SeatManagementDashboard.jsx      # Main dashboard component
│   ├── SeatManagementDashboard.css      # Dashboard styles
│   ├── CreateSeatModal.jsx              # Seat creation modal
│   ├── CreateSeatModal.css              # Modal styles
│   ├── BulkPolicyAssignmentModal.jsx    # Bulk assignment modal
│   └── BulkPolicyAssignmentModal.css    # Bulk modal styles
├── services/
│   └── contextApi.js                    # API service layer (updated)
├── stores/
│   └── contextStore.js                  # Zustand state management (updated)
└── seat-management-demo.html            # Demo page
```

## 🏗️ Components

### SeatManagementDashboard
The main dashboard component that provides:
- Seat overview cards with key metrics
- Interactive seat grid with selection capabilities
- Bulk action buttons for policy assignment
- Create seat functionality
- Loading and error states

**Key Props:**
- `currentContext`: Current enterprise context
- `dashboardData`: Dashboard metrics and analytics

### CreateSeatModal
Multi-step modal for creating new agency seats:

**Steps:**
1. **Basic Information**: Seat name, description, admin email
2. **Policy Assignment**: Select policies to apply to the seat
3. **Permissions & Limits**: Configure user limits and permissions
4. **Review & Create**: Final review before creation

**Features:**
- Form validation with real-time feedback
- Policy search and filtering
- Permission configuration
- Custom branding options

### BulkPolicyAssignmentModal
Modal for assigning policies to multiple seats:

**Features:**
- Policy search and selection
- Assignment type options (add vs replace)
- Rollout scheduling
- Notification settings
- Real-time validation

## 🔌 API Integration

### Updated contextApi Service
Added new endpoints for seat management:

```javascript
// Seat Management
getEnterpriseSeats(enterpriseId)
createSeat(enterpriseId, seatData)
updateSeat(enterpriseId, seatId, seatData)
deleteSeat(enterpriseId, seatId)

// Policy Assignment
bulkAssignPolicies(enterpriseId, seatIds, policyIds, options)
getAvailablePolicies(enterpriseId)

// Analytics & Reports
getSeatAnalytics(enterpriseId, timeRange)
getSeatComplianceReport(enterpriseId, seatId)

// User Management
inviteUserToSeat(enterpriseId, seatId, userData)
```

### Backend API Endpoints
All endpoints are implemented in `api/routes.js`:

```javascript
// Seat Management
GET    /api/enterprise/:id/seats
POST   /api/enterprise/:id/seats
PUT    /api/enterprise/:id/seats/:seatId
DELETE /api/enterprise/:id/seats/:seatId

// Policy Assignment
POST   /api/enterprise/:id/seats/bulk-policy-assignment

// Analytics & Reports
GET    /api/enterprise/:id/seats/analytics
GET    /api/enterprise/:id/policies/available
GET    /api/enterprise/:id/seats/:seatId/compliance-report

// User Management
POST   /api/enterprise/:id/seats/:seatId/invite-user
```

## 🎨 Styling

### Design System
- **Color Scheme**: Consistent with AICOMPLYR brand colors
- **Typography**: Inter font family for modern readability
- **Spacing**: 8px grid system for consistent spacing
- **Shadows**: Subtle shadows for depth and hierarchy

### Responsive Design
- **Desktop**: Full-featured dashboard with side-by-side layouts
- **Tablet**: Optimized grid layouts and touch-friendly interactions
- **Mobile**: Stacked layouts with simplified navigation

### Dark Mode Support
- Automatic detection of system preference
- Consistent color mapping for all components
- Smooth transitions between light and dark modes

## 🔧 State Management

### Zustand Store Integration
The seat management system integrates with the existing Zustand store:

```javascript
// Seat-related state
seats: []
selectedSeats: []
analytics: null
isLoading: false
error: null

// Actions
loadSeats()
createSeat(seatData)
updateSeat(seatId, data)
deleteSeat(seatId)
bulkAssignPolicies(seatIds, policyIds, options)
```

### Real-time Updates
WebSocket integration for live updates:
- Seat status changes
- Policy assignment notifications
- Compliance score updates
- User activity tracking

## 🚀 Usage

### Basic Implementation
```jsx
import SeatManagementDashboard from './components/SeatManagementDashboard';

function App() {
  return (
    <div className="app">
      <SeatManagementDashboard />
    </div>
  );
}
```

### With Context Integration
```jsx
import { useContextStore } from './stores/contextStore';
import SeatManagementDashboard from './components/SeatManagementDashboard';

function App() {
  const { currentContext } = useContextStore();
  
  if (currentContext?.type !== 'enterprise') {
    return <div>Enterprise access required</div>;
  }
  
  return <SeatManagementDashboard />;
}
```

## 🔒 Security & Permissions

### Authentication
- JWT token validation for all API calls
- Automatic token refresh on expiration
- Secure storage in localStorage/sessionStorage

### Authorization
- Enterprise admin role required for seat management
- Permission-based access control for seat operations
- Audit logging for all seat-related actions

### Data Protection
- Input validation and sanitization
- CSRF protection for all forms
- Secure API endpoints with proper error handling

## 📊 Analytics & Reporting

### Dashboard Metrics
- **Active Seats**: Number of currently active seats
- **Average Compliance Score**: Overall compliance across all seats
- **Policy Violations**: Total violations and resolution status
- **Monthly Cost**: Cost tracking and billing information

### Compliance Tracking
- Real-time compliance scoring
- Violation detection and reporting
- Automated compliance recommendations
- Historical compliance trends

### Seat Analytics
- User utilization tracking
- Policy distribution analysis
- Performance metrics
- Cost optimization insights

## 🧪 Testing

### Component Testing
```javascript
// Test seat creation workflow
test('should create seat with valid data', async () => {
  const seatData = {
    name: 'Test Seat',
    adminEmail: 'admin@test.com',
    userLimit: 10
  };
  
  const result = await createSeat(enterpriseId, seatData);
  expect(result.name).toBe('Test Seat');
});

// Test bulk policy assignment
test('should assign policies to multiple seats', async () => {
  const result = await bulkAssignPolicies(
    enterpriseId,
    ['seat-1', 'seat-2'],
    ['policy-1', 'policy-2'],
    { addToExisting: true }
  );
  
  expect(result.success).toBe(true);
});
```

### API Testing
```javascript
// Test seat endpoints
describe('Seat Management API', () => {
  test('GET /enterprise/:id/seats', async () => {
    const response = await request(app)
      .get('/api/enterprise/test-enterprise/seats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.seats).toBeDefined();
  });
});
```

## 🚀 Deployment

### Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws

# Authentication
REACT_APP_AUTH_DOMAIN=your-auth-domain
REACT_APP_AUTH_CLIENT_ID=your-client-id
```

### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm start
```

## 🔄 Integration with Existing System

### Context Switching
The seat management dashboard integrates seamlessly with the existing context switching system:
- Enterprise users can access seat management through the context switcher
- Seat operations are properly logged in the audit system
- Real-time updates are synchronized across all components

### Database Schema
Compatible with existing database structure:
```sql
-- Enterprise tables
enterprises (id, name, type, subscription_tier)
agency_seats (id, enterprise_id, name, is_active)
user_contexts (user_id, enterprise_id, agency_seat_id, role)

-- Policy tables
policies (id, name, description, category, version)
seat_policies (seat_id, policy_id, assigned_at)

-- Analytics tables
seat_analytics (seat_id, compliance_score, violations, last_updated)
```

## 📈 Performance Optimization

### Code Splitting
- Lazy loading for modal components
- Dynamic imports for heavy features
- Optimized bundle size

### Caching Strategy
- API response caching
- Policy data caching
- User session persistence

### Real-time Updates
- WebSocket connection management
- Efficient message handling
- Automatic reconnection logic

## 🐛 Troubleshooting

### Common Issues

**Seat Creation Fails**
- Check admin email format
- Verify enterprise permissions
- Ensure required fields are provided

**Policy Assignment Errors**
- Validate policy IDs exist
- Check seat permissions
- Verify assignment options

**Real-time Updates Not Working**
- Check WebSocket connection
- Verify authentication token
- Review network connectivity

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('debug', 'seat-management:*');
```

## 📚 Additional Resources

- [API Documentation](./api/README.md)
- [Component Library](./components/README.md)
- [State Management Guide](./stores/README.md)
- [Demo Page](./seat-management-demo.html)

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure responsive design for all components
5. Test dark mode compatibility

## 📄 License

This project is part of the AICOMPLYR platform and follows the same licensing terms. 