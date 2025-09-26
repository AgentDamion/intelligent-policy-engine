# AICOMPLYR Context-Aware React Component System

A comprehensive React component system that enables seamless switching between Enterprise admin and Agency seat views within the same user session. The system maintains state during context switching and provides context-specific navigation, dashboards, and notifications.

## 🎯 Core Features

- **Context Switching**: Smooth transitions between Enterprise and Agency views
- **State Persistence**: Maintains user state during context changes using Zustand
- **Real-time Updates**: WebSocket integration for live notifications and data
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- **Dark Mode Support**: Automatic dark mode detection and styling
- **Error Handling**: Comprehensive error boundaries and retry mechanisms
- **Authentication**: JWT token handling with automatic refresh

## 📦 Components

### 1. ContextSwitcher
A dropdown component that allows users to switch between different enterprise and agency contexts.

**Features:**
- Groups contexts by type (Enterprise vs Agency)
- Search functionality for large context lists
- Visual indicators for current context
- Smooth animations and transitions
- Loading and error states

### 2. ContextAwareDashboard
Renders different dashboard layouts based on the current context.

**Enterprise View:**
- Policy Management dashboard
- Seat Management overview
- Audit Center with real-time metrics
- Analytics and compliance reporting

**Agency View:**
- Submissions tracking
- Client Compliance monitoring
- Tool Management interface
- Quick Actions for common tasks

### 3. ContextAwareNavigation
Provides context-specific navigation menus that adapt based on user permissions.

**Features:**
- Dynamic menu items based on context
- Permission-based navigation
- Badge indicators for notifications
- Mobile-responsive sidebar

### 4. NotificationCenter
Aggregates notifications from all user contexts with filtering capabilities.

**Features:**
- Context-aware notification filtering
- Priority-based visual indicators
- Real-time notification updates
- Mark as read functionality

## 🚀 Quick Start

### Installation

1. **Install Dependencies:**
```bash
npm install
```

2. **Set Environment Variables:**
```bash
# Create .env file
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws
```

3. **Start Development Server:**
```bash
npm start
```

### Backend Integration

The components are designed to work with your existing AICOMPLYR backend. Here are the required API endpoints:

#### Required API Endpoints

```javascript
// User Contexts
GET /api/user/contexts
Response: {
  contexts: [
    {
      id: "enterprise-1",
      name: "PharmaCorp Enterprise",
      type: "enterprise",
      role: "Enterprise Admin",
      isDefault: true,
      permissions: ["policy_management", "seat_management"]
    }
  ]
}

// Switch Context
POST /api/user/context/switch
Body: { contextId: "enterprise-1" }
Response: { success: true, context: {...} }

// Dashboard Data
GET /api/dashboard/enterprise/enterprise-1
Response: {
  enterprise: {
    activePolicies: 24,
    complianceRate: "98.5%",
    totalSeats: 156,
    activeUsers: 142,
    auditEvents: 1247,
    pendingReviews: 12,
    complianceSavings: "$2.4M",
    efficiencyGain: "67%"
  }
}

// Notifications
GET /api/notifications/enterprise-1?filter=all
Response: {
  notifications: [
    {
      id: "1",
      title: "Policy Update Required",
      message: "New compliance policy requires immediate review",
      contextId: "enterprise-1",
      contextType: "enterprise",
      contextName: "PharmaCorp Enterprise",
      type: "warning",
      priority: "high",
      timestamp: "2024-01-15T10:30:00Z",
      isRead: false
    }
  ]
}

// Mark Notification Read
PUT /api/notifications/1/read
Response: { success: true }

// Mark All Notifications Read
PUT /api/notifications/enterprise-1/read-all
Response: { success: true }

// User Profile
GET /api/user/profile
Response: {
  id: "user-1",
  name: "John Doe",
  email: "john@aicomplyr.io",
  avatar: "https://...",
  preferences: {...}
}
```

#### WebSocket Events

```javascript
// Connect to WebSocket
ws://localhost:3000/ws?token=JWT_TOKEN

// Event Types
{
  type: "notification",
  payload: {
    id: "1",
    title: "New Policy",
    message: "A new policy has been assigned",
    contextId: "enterprise-1",
    contextType: "enterprise",
    type: "info",
    priority: "medium",
    timestamp: "2024-01-15T10:30:00Z"
  }
}

{
  type: "dashboard_update",
  payload: {
    enterprise: {
      activePolicies: 25,
      complianceRate: "99.1%"
    }
  }
}

{
  type: "context_update",
  payload: {
    id: "enterprise-1",
    name: "Updated Enterprise Name",
    role: "Updated Role"
  }
}

{
  type: "compliance_alert",
  payload: {
    severity: "high",
    message: "Compliance violation detected",
    contextId: "enterprise-1"
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws

# Feature Flags
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_ENABLE_DARK_MODE=true
REACT_APP_ENABLE_ANALYTICS=false

# Development
REACT_APP_DEBUG_MODE=true
REACT_APP_MOCK_API=false
```

### Authentication Setup

```javascript
// Store JWT token
localStorage.setItem('aicomplyr_token', 'your-jwt-token');

// The API service will automatically:
// - Include token in requests
// - Handle 401 responses
// - Redirect to login on auth failure
```

## 📋 Component API

### ContextSwitcher Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | String | No | Additional CSS classes |

### ContextAwareDashboard Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onNavigate` | Function | Yes | Navigation callback |
| `className` | String | No | Additional CSS classes |

### ContextAwareNavigation Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentContext` | Object | Yes | Current context object |
| `onNavigate` | Function | Yes | Navigation callback |
| `className` | String | No | Additional CSS classes |

### NotificationCenter Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | String | No | Additional CSS classes |

## 🎨 Customization

### Color Scheme

Modify the color scheme by updating CSS variables:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --text-primary: #333;
  --text-secondary: #666;
  --background-primary: #fff;
  --background-secondary: #f8f9fa;
}
```

### Adding New Context Types

1. **Update ContextSwitcher:**
```jsx
const getContextIcon = (type) => {
  switch (type) {
    case 'enterprise':
      return '🏢';
    case 'agency':
      return '🏛️';
    case 'government': // New type
      return '🏛️';
    default:
      return '👤';
  }
};
```

2. **Update API Service:**
```javascript
// Add new API endpoints
getGovernmentData: async (governmentId) => {
  return apiRequest(`/governments/${governmentId}`);
},
```

3. **Update Zustand Store:**
```javascript
// Add new state and actions
governmentData: null,

loadGovernmentData: async () => {
  // Implementation
},
```

## 🔧 Integration with Backend

### Database Schema Mapping

```sql
-- Expected database tables
users {
  id: uuid PRIMARY KEY,
  email: string UNIQUE,
  name: string,
  created_at: timestamp,
  updated_at: timestamp
}

enterprises {
  id: uuid PRIMARY KEY,
  name: string,
  type: enum('pharma', 'agency'),
  subscription_tier: string,
  created_at: timestamp,
  updated_at: timestamp
}

agency_seats {
  id: uuid PRIMARY KEY,
  enterprise_id: uuid REFERENCES enterprises(id),
  name: string,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

user_contexts {
  user_id: uuid REFERENCES users(id),
  enterprise_id: uuid REFERENCES enterprises(id),
  agency_seat_id: uuid REFERENCES agency_seats(id) NULLABLE,
  role: enum('enterprise_owner', 'enterprise_admin', 'seat_admin', 'seat_user'),
  is_active: boolean,
  is_default: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

notifications {
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  context_id: uuid,
  context_type: enum('enterprise', 'agency'),
  title: string,
  message: text,
  type: enum('success', 'warning', 'alert', 'info'),
  priority: enum('low', 'medium', 'high'),
  is_read: boolean DEFAULT false,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Authentication Integration

```javascript
// JWT Token Management
const getAuthToken = () => {
  return localStorage.getItem('aicomplyr_token') || sessionStorage.getItem('aicomplyr_token');
};

// Automatic token refresh
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('aicomplyr_token', token);
    return token;
  }
  
  throw new Error('Token refresh failed');
};
```

## 📱 Responsive Design

The components are built with a mobile-first approach:

- **Desktop**: Full sidebar navigation with expanded views
- **Tablet**: Collapsible sidebar with touch-friendly interactions
- **Mobile**: Hamburger menu with overlay navigation

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

## 🌙 Dark Mode

The components automatically detect and adapt to system dark mode preferences:

```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles */
}
```

## 🧪 Testing

### Component Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ContextSwitcher from './ContextSwitcher';

test('switches context when option is clicked', () => {
  render(<ContextSwitcher />);
  
  fireEvent.click(screen.getByText('Agency'));
  expect(screen.getByText('Agency')).toBeInTheDocument();
});
```

### API Mocking

```javascript
// Mock API responses for testing
jest.mock('../services/contextApi', () => ({
  contextApi: {
    getUserContexts: jest.fn().mockResolvedValue([
      {
        id: 'enterprise-1',
        name: 'Test Enterprise',
        type: 'enterprise',
        role: 'Admin'
      }
    ]),
    switchContext: jest.fn().mockResolvedValue({ success: true })
  }
}));
```

## 🚀 Performance Optimization

### Lazy Loading

```jsx
import React, { lazy, Suspense } from 'react';

const ContextAwareDashboard = lazy(() => import('./ContextAwareDashboard.jsx'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContextAwareDashboard />
    </Suspense>
  );
}
```

### Memoization

```jsx
import React, { useMemo } from 'react';

const ContextSwitcher = React.memo(({ className }) => {
  const filteredContexts = useMemo(() => {
    return availableContexts.filter(ctx => ctx.active);
  }, [availableContexts]);
  
  // Component logic
});
```

## 🔒 Security

### Token Security

- Tokens are stored in localStorage for persistence
- Automatic token refresh on 401 responses
- Secure token transmission via HTTPS
- Token cleanup on logout

### XSS Protection

- All user input is sanitized
- React's built-in XSS protection
- Content Security Policy headers

## 📄 License

This component system is part of the AICOMPLYR platform and is proprietary software.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions about the component system:

- **Documentation**: See `demo.html` for detailed examples
- **Issues**: Report bugs and feature requests through the project issue tracker
- **Email**: Contact the development team for enterprise support

---

**Built with ❤️ for AICOMPLYR** 