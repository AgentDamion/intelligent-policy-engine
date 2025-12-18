# AICOMPLYR.io Hierarchical Multi-Tenant Access Control System

## 🎯 Overview

This document describes the complete implementation of AICOMPLYR.io's sophisticated hierarchical multi-tenant access control system. The system enables enterprises to manage multiple agency seats, with users having seamless context switching between different enterprise and agency roles.

## 🏗️ Architecture

### Core Components

1. **Database Schema** (`database/migrations/004_create_hierarchical_access_control.sql`)
   - Enhanced multi-tenant tables with enterprise/seat hierarchy
   - User contexts for multi-context user management
   - Permission system with role-based access control
   - Audit logging for all context-aware actions

2. **Authentication System** (`api/auth/hierarchical-auth.js`)
   - Context-aware JWT tokens with user and context information
   - Seamless context switching with new token generation
   - Role-based permission enforcement
   - Enterprise and seat management functions

3. **API Routes** (`api/routes/hierarchical-routes.js`)
   - Authentication endpoints with context awareness
   - Enterprise and agency seat management
   - Policy management with hierarchical assignment
   - User invitation and role management
   - Dashboard data with context filtering

4. **Frontend Store** (`ui/stores/hierarchicalContextStore.js`)
   - Zustand-based state management
   - Context switching with automatic token updates
   - Permission checking and role validation
   - WebSocket integration for real-time updates

5. **UI Components** (`ui/components/HierarchicalContextSwitcher.jsx`)
   - Enhanced context switcher with enterprise/seat grouping
   - Search and filtering capabilities
   - Role-based visual indicators
   - Responsive design with dark mode support

## 🗄️ Database Schema

### Core Tables

```sql
-- Enterprises (top-level organizations)
enterprises (
  id, name, slug, type, subscription_tier, settings, limits
)

-- Agency Seats (managed workspaces within enterprises)
agency_seats (
  id, enterprise_id, name, slug, description, seat_type, settings, limits
)

-- Users with enhanced profile
users (
  id, email, name, avatar_url, is_active, last_login
)

-- Multi-context user management
user_contexts (
  id, user_id, enterprise_id, agency_seat_id, role, permissions, is_default
)

-- Permission system
permissions (id, name, description, category, resource, action)
role_permissions (role, permission_id, is_granted, conditions)

-- Context-aware sessions
user_sessions (
  id, user_id, session_token, context_id, ip_address, user_agent, expires_at
)

-- Audit trail
context_audit_log (
  id, user_id, context_id, action, resource_type, resource_id, details
)

-- Enhanced policies with hierarchy
policies (
  id, name, description, enterprise_id, agency_seat_id, policy_type, rules
)

-- Policy assignments to seats
seat_policy_assignments (
  id, agency_seat_id, policy_id, assignment_type, priority, assigned_by
)
```

## 🔐 Authentication & Authorization

### Context-Aware JWT Tokens

JWT tokens include context information:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "contextId": "uuid",
  "contextType": "enterprise|agencySeat",
  "enterpriseId": "uuid",
  "agencySeatId": "uuid|null",
  "role": "enterprise_owner|enterprise_admin|seat_admin|seat_user|platform_super_admin",
  "permissions": ["permission1", "permission2"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role Hierarchy

1. **Platform Super Admin** - Full platform control
2. **Enterprise Owner** - Full control over enterprise and all seats
3. **Enterprise Admin** - Policy management, seat oversight, user management
4. **Seat Admin** - Full management within assigned seat
5. **Seat User** - Workflow access within assigned seat

### Permission System

Permissions are checked at multiple levels:
- **Explicit permissions** in JWT token
- **Role-based permissions** from database
- **Context-aware validation** for enterprise/seat access

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with context awareness
- `POST /api/auth/context/switch` - Switch user context
- `GET /api/auth/contexts` - Get user contexts

### Enterprise Management
- `POST /api/enterprises` - Create enterprise (super admin only)
- `GET /api/enterprises/:enterpriseId` - Get enterprise details
- `PUT /api/enterprises/:enterpriseId` - Update enterprise

### Agency Seat Management
- `POST /api/enterprises/:enterpriseId/seats` - Create agency seat
- `GET /api/enterprises/:enterpriseId/seats` - Get enterprise seats
- `PUT /api/enterprises/:enterpriseId/seats/:seatId` - Update seat
- `DELETE /api/enterprises/:enterpriseId/seats/:seatId` - Delete seat

### Policy Management
- `POST /api/policies` - Create policy
- `GET /api/policies` - Get policies with filtering
- `POST /api/enterprises/:enterpriseId/seats/bulk-policy-assignment` - Bulk assign policies

### User Management
- `POST /api/enterprises/:enterpriseId/seats/:seatId/invite-user` - Invite user to seat
- `GET /api/enterprises/:enterpriseId/seats/:seatId/users` - Get seat users
- `PUT /api/enterprises/:enterpriseId/seats/:seatId/users/:userId/role` - Update user role

### Dashboard & Analytics
- `GET /api/dashboard/enterprise/:enterpriseId` - Enterprise dashboard
- `GET /api/dashboard/agency-seat/:seatId` - Agency seat dashboard

## 🎨 Frontend Components

### HierarchicalContextSwitcher

Enhanced context switcher with:
- **Enterprise/Seat grouping** with visual indicators
- **Search and filtering** capabilities
- **Role-based badges** and icons
- **Responsive design** with dark mode support
- **Loading states** and error handling

### State Management

Zustand store provides:
- **Context switching** with automatic token updates
- **Permission checking** and role validation
- **Dashboard data** loading for current context
- **WebSocket integration** for real-time updates
- **Error handling** and retry mechanisms

## 🔧 Setup & Installation

### 1. Database Migration

```bash
# Run the hierarchical migration
npm run migrate

# Verify migration status
npm run migrate:status
```

### 2. Seed Sample Data

```bash
# Seed hierarchical multi-tenant data
npm run seed:hierarchical
```

### 3. Test Credentials

After seeding, you can test with these credentials:

- **Platform Super Admin**: `admin@aicomplyr.io`
- **Enterprise Owner**: `john@ogilvy.com`
- **Enterprise Admin**: `sarah@pfizer.com`
- **Multi-context User**: `david@ogilvy.com`

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 🧪 Testing the System

### 1. Authentication Flow

```javascript
// Login with context awareness
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@aicomplyr.io', password: 'password' })
});

const { token, user, defaultContext } = await response.json();
```

### 2. Context Switching

```javascript
// Switch to different context
const switchResponse = await fetch('/api/auth/context/switch', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ contextId: 'new-context-id' })
});

const { context: newContext, token: newToken } = await switchResponse.json();
```

### 3. Permission Checking

```javascript
// Check if user has permission
const hasPermission = await hierarchicalAuth.checkPermission(
  token, 
  'policies', 
  'create', 
  enterpriseId
);
```

## 📊 Business Scenarios

### Scenario 1: Enterprise Owner Managing Seats

1. **John Smith** (Enterprise Owner at Ogilvy Health)
2. Creates agency seats for different clients
3. Assigns policies to seats
4. Invites users to specific seats
5. Monitors compliance across all seats

### Scenario 2: Multi-Context User

1. **David Lee** has multiple contexts:
   - Seat Admin at Ogilvy Health (Pfizer Account Team)
   - Seat User at Pfizer (for client work)
2. Seamlessly switches between contexts
3. Different permissions and dashboards per context
4. Maintains state during context switching

### Scenario 3: Policy Distribution

1. **Sarah Johnson** (Enterprise Admin at Pfizer)
2. Creates enterprise-wide policies
3. Distributes policies to agency seats
4. Monitors policy compliance across seats
5. Views cross-seat analytics

## 🔒 Security Features

### Data Isolation
- **Strict enterprise isolation** - No cross-enterprise data access
- **Controlled seat sharing** - Data sharing only within enterprise hierarchy
- **Context-aware queries** - All database queries filtered by context

### Audit Logging
- **All actions logged** with context information
- **User tracking** across context switches
- **Compliance reporting** for enterprise requirements

### Permission Enforcement
- **Role-based access control** at multiple levels
- **Context-aware permissions** that adapt to current context
- **Token-based security** with automatic expiration

## 🚀 Performance Optimizations

### Database Indexes
- Optimized indexes for user contexts
- Session token indexing
- Audit log performance indexes
- Policy assignment indexes

### Caching
- Permission cache for role-based permissions
- Context cache for frequently accessed contexts
- Token validation caching

### WebSocket Integration
- Real-time context updates
- Live dashboard data
- Notification delivery
- Connection management with reconnection

## 🔄 Migration from Existing System

### Backward Compatibility
- Existing authentication still works
- Gradual migration path available
- Data migration scripts provided

### Integration Points
- Existing API routes remain functional
- New hierarchical routes added alongside
- Frontend components can be gradually replaced

## 📈 Monitoring & Analytics

### Dashboard Metrics
- **Enterprise Overview**: Seat count, user count, policy count
- **Compliance Tracking**: Average confidence, compliance scores
- **Activity Monitoring**: Recent actions, user engagement
- **Performance Metrics**: Response times, error rates

### Audit Reports
- **User Activity**: Context switches, actions performed
- **Policy Compliance**: Violations, resolution status
- **Security Events**: Failed logins, permission denials
- **System Health**: Database performance, API usage

## 🎯 Future Enhancements

### Planned Features
1. **Advanced Policy Engine**: AI-powered policy recommendations
2. **Real-time Collaboration**: Multi-user context sharing
3. **Advanced Analytics**: Predictive compliance insights
4. **Mobile Support**: Native mobile context switching
5. **API Rate Limiting**: Context-aware rate limiting
6. **Multi-language Support**: Internationalization for enterprises

### Scalability Improvements
1. **Database Sharding**: Enterprise-based data sharding
2. **Microservices**: Service decomposition for better scaling
3. **CDN Integration**: Global content delivery
4. **Load Balancing**: Context-aware load balancing

## 📞 Support & Documentation

### API Documentation
- Complete API reference available
- Interactive API testing tools
- Code examples for all endpoints

### Troubleshooting Guide
- Common issues and solutions
- Debug mode for development
- Log analysis tools

### Community Support
- Developer community forum
- Issue tracking and bug reports
- Feature request system

---

**AICOMPLYR.io Hierarchical Multi-Tenant System** - Enterprise-grade access control for modern compliance management. 