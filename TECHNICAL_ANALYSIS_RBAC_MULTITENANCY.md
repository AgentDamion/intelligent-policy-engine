# Technical Analysis: RBAC Multi-Tenancy Architecture
## AICOMPLYR.io Platform

---

## Executive Summary

AICOMPLYR.io implements a sophisticated Role-Based Access Control (RBAC) system with hierarchical multi-tenancy designed to support complex organizational structures. The architecture enables secure isolation between tenants while providing flexible access management across enterprises, agencies, and individual seats.

### Key Architecture Components:
- **Hierarchical Multi-Tenancy**: Three-tier structure (Platform → Enterprise → Agency Seats)
- **Context-Aware Authentication**: JWT-based system with dynamic context switching
- **Row-Level Security (RLS)**: PostgreSQL-based tenant isolation
- **Fine-Grained Permissions**: Resource and action-based authorization
- **Audit Trail**: Comprehensive activity logging with context tracking

---

## 1. Multi-Tenancy Architecture Overview

### 1.1 Hierarchical Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM LEVEL                            │
│                 (Super Admin Access)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┬─────────────────────┐
        │                           │                      │
┌───────▼────────┐        ┌────────▼────────┐   ┌────────▼────────┐
│  ENTERPRISE 1  │        │  ENTERPRISE 2   │   │  ENTERPRISE N   │
│   (Type: Agency)│        │ (Type: Client)  │   │ (Type: Partner) │
└───────┬────────┘        └────────┬────────┘   └────────┬────────┘
        │                          │                      │
   ┌────┴────┬────┐               │                      │
   │         │    │               │                      │
┌──▼──┐  ┌──▼──┐ ┌▼───┐     ┌───▼───┐             ┌────▼────┐
│Seat1│  │Seat2│ │SeatN│     │Default│             │ Default │
│     │  │     │ │    │     │ Seat  │             │  Seat   │
└─────┘  └─────┘ └────┘     └───────┘             └─────────┘
```

### 1.2 Database Schema Design

The system uses PostgreSQL with the following core tables:

#### Organizations/Enterprises Table
```sql
CREATE TABLE organizations_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('enterprise', 'agency', 'client', 'partner', 'other')),
    competitive_group VARCHAR(100),  -- Prevents data leakage between competitors
    industry VARCHAR(100),
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active'
);
```

#### Users Table with Enhanced Capabilities
```sql
CREATE TABLE users_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',  -- admin, manager, user, viewer
    permissions JSONB DEFAULT '{}',   -- Custom permissions override
    status VARCHAR(20) DEFAULT 'active'
);
```

#### User Contexts (Multi-Tenancy Core)
```sql
CREATE TABLE user_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    enterprise_id UUID REFERENCES enterprises(id),
    agency_seat_id UUID REFERENCES agency_seats(id),
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_accessed TIMESTAMP
);
```

---

## 2. Authentication & Authorization System

### 2.1 JWT-Based Authentication

The system implements a context-aware JWT token structure:

```javascript
{
  // User Identity
  "userId": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  
  // Current Context
  "contextId": "context-uuid",
  "contextType": "agencySeat|enterprise",
  "enterpriseId": "enterprise-uuid",
  "agencySeatId": "seat-uuid",  // Optional
  
  // Authorization
  "role": "enterprise_admin|seat_admin|seat_user|viewer",
  "permissions": [
    {"resource": "policies", "action": "create"},
    {"resource": "users", "action": "invite"}
  ],
  
  // Token Metadata
  "iat": 1234567890,
  "exp": 1234654290
}
```

### 2.2 Role Hierarchy

```
platform_super_admin
    └── enterprise_owner
            └── enterprise_admin
                    └── seat_admin
                            └── seat_manager
                                    └── seat_user
                                            └── viewer
```

### 2.3 Permission Model

The system uses a resource-action based permission model:

```javascript
const actionPermissions = {
    // Regular admin actions
    'restart_agent': ['admin', 'super-admin'],
    'clear_cache': ['admin', 'super-admin'],
    'backup_database': ['admin', 'super-admin'],
    
    // Super-admin only actions
    'suspend_client': ['super-admin'],
    'force_sync': ['super-admin']
};
```

---

## 3. Row-Level Security Implementation

### 3.1 PostgreSQL RLS Policies

The system implements comprehensive RLS policies for tenant isolation:

```sql
-- Organizations: Users can only view organizations they belong to
CREATE POLICY "Users can view own organization" ON organizations_enhanced
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Policies: Users can view policies in their organization
CREATE POLICY "Users can view organization policies" ON policies
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );
```

### 3.2 Context-Based Access Control

The hierarchical authentication system provides middleware for context-aware authorization:

```javascript
// Middleware stack for protected routes
router.get('/enterprises/:enterpriseId/seats',
    hierarchicalAuth.requireAuth(),                    // Verify JWT
    hierarchicalAuth.requirePermission('agency_seats', 'read'),  // Check permission
    async (req, res) => {
        // Access to req.user and req.context
        if (req.context.enterpriseId !== req.params.enterpriseId) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
);
```

---

## 4. Context Switching Mechanism

### 4.1 User Context Management

Users can have multiple contexts and switch between them:

```javascript
async switchUserContext(userId, contextId) {
    // Verify user has access to this context
    const context = await db.query(`
        SELECT uc.*, e.name as enterprise_name, as.name as agency_seat_name
        FROM user_contexts uc
        JOIN enterprises e ON uc.enterprise_id = e.id
        LEFT JOIN agency_seats as ON uc.agency_seat_id = as.id
        WHERE uc.id = $1 AND uc.user_id = $2 AND uc.is_active = true
    `, [contextId, userId]);
    
    // Generate new token with updated context
    return this.generateContextAwareToken(user, updatedContext);
}
```

### 4.2 Context Types

1. **Enterprise Context**: Direct enterprise access
2. **Agency Seat Context**: Access through agency seat assignment
3. **Cross-Enterprise Context**: For users managing multiple enterprises

---

## 5. Audit & Compliance

### 5.1 Comprehensive Audit Trail

```sql
CREATE TABLE context_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    context_id UUID REFERENCES user_contexts(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Audit Event Examples

```javascript
await hierarchicalAuth.logAction(
    userId,
    contextId,
    'create_policy',
    'policy',
    policyId,
    {
        policyName: policy.name,
        enterpriseId: enterpriseId,
        agencySeatId: seatId
    }
);
```

---

## 6. Security Features

### 6.1 Tenant Isolation Guarantees

1. **Database Level**: PostgreSQL RLS ensures queries are automatically filtered
2. **Application Level**: Context validation in middleware
3. **API Level**: Enterprise/seat ID validation in routes
4. **Competitive Group Isolation**: Prevents data leakage between competitors

### 6.2 Security Headers & CORS

```javascript
// Production security configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: { 
        secure: true,      // HTTPS only
        httpOnly: true,    // Prevent XSS
        sameSite: 'strict' // CSRF protection
    }
}));

// CORS configuration
const corsOptions = {
    origin: ['https://aicomplyr.io'],
    credentials: true
};
```

---

## 7. Scalability Considerations

### 7.1 Performance Optimizations

1. **Permission Caching**: In-memory cache for role permissions
2. **Database Indexes**: Strategic indexes on tenant columns
3. **Connection Pooling**: Efficient database connection management

```javascript
// Indexes for multi-tenant queries
CREATE INDEX idx_policies_organization ON policies(organization_id);
CREATE INDEX idx_users_enhanced_organization ON users_enhanced(organization_id);
CREATE INDEX idx_contracts_organization_status ON contracts(organization_id, status);
```

### 7.2 Horizontal Scaling Support

- Stateless JWT authentication enables horizontal scaling
- Database connection pooling for concurrent requests
- WebSocket connections for real-time updates

---

## 8. Implementation Best Practices

### 8.1 Tenant Data Isolation

```javascript
// Always include tenant context in queries
const policies = await db.query(`
    SELECT * FROM policies 
    WHERE organization_id = $1 
    AND ($2::uuid IS NULL OR agency_seat_id = $2)
`, [req.context.enterpriseId, req.context.agencySeatId]);
```

### 8.2 Context Validation Pattern

```javascript
// Validate context access before operations
if (req.context.enterpriseId !== enterpriseId && 
    req.context.role !== 'platform_super_admin') {
    return res.status(403).json({ error: 'Access denied' });
}
```

---

## 9. Current Implementation Status

### 9.1 Completed Features ✅

- **Multi-tenant Database Schema**: Complete with RLS policies
- **Hierarchical Organization Structure**: Enterprises and agency seats
- **Context-Aware Authentication**: JWT with context switching
- **Role-Based Permissions**: Configurable role hierarchy
- **Audit Trail System**: Comprehensive activity logging
- **API Endpoint Security**: Protected routes with context validation

### 9.2 Areas for Enhancement 🔧

1. **Advanced Permission Inheritance**: Implement cascading permissions
2. **Dynamic Role Creation**: Allow custom role definitions
3. **Tenant Resource Quotas**: Implement usage limits per tenant
4. **Cross-Tenant Collaboration**: Controlled data sharing mechanisms
5. **Performance Monitoring**: Tenant-specific metrics and analytics

---

## 10. Security Recommendations

### 10.1 Immediate Actions

1. **Enable SSL/TLS**: Ensure all communications are encrypted
2. **Implement Rate Limiting**: Prevent abuse and DoS attacks
3. **Add API Key Management**: Secondary authentication layer
4. **Enable Audit Log Retention**: Compliance with data retention policies

### 10.2 Future Enhancements

1. **Multi-Factor Authentication**: Additional security layer
2. **IP Whitelisting**: Enterprise-level access restrictions
3. **Data Encryption at Rest**: Encrypt sensitive tenant data
4. **Automated Security Scanning**: Regular vulnerability assessments

---

## Conclusion

The AICOMPLYR.io platform implements a robust RBAC multi-tenancy architecture that provides:

- **Strong Tenant Isolation**: Database-level RLS with application-layer validation
- **Flexible Access Control**: Context-aware permissions with role hierarchy
- **Scalable Design**: Stateless authentication supporting horizontal scaling
- **Comprehensive Auditing**: Full activity tracking for compliance
- **Enterprise-Ready Security**: Production-grade security measures

This architecture positions AICOMPLYR.io as a secure, scalable platform capable of serving complex organizational hierarchies while maintaining strict data isolation and compliance requirements.