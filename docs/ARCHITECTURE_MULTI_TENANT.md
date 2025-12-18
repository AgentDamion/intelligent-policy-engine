# Multi-Tenant Architecture Documentation

## Overview

The VERA Platform implements a comprehensive multi-tenant architecture supporting Enterprise, Partner, and dual-mode users across 31 screens. This document describes the architectural components and their interactions.

## Core Components

### 1. Database Schema

#### Partner-Enterprise Relationships
- `partner_enterprise_relationships` - Manages relationships between Partner and Client enterprises
- `partner_client_contexts` - User contexts for Partner users working with specific clients

#### Role System
- Expanded role system supporting 8 Partner roles in addition to 5 Enterprise roles
- Role hierarchy table for permission inheritance
- Default permissions seeded for all roles

#### Performance Optimizations
- Composite indexes for common query patterns
- Materialized views for dashboard performance
- Partial indexes for active records

### 2. Cache Abstraction Layer

The platform uses a cache abstraction supporting both in-memory (Map) and Redis providers:

- **Memory Provider**: Fast, no external dependencies, suitable for development
- **Redis Provider**: Scalable, shared across instances, suitable for production

Cache keys follow a hierarchical pattern:
- `user:{userId}:contexts` - User contexts
- `enterprise:{enterpriseId}:dashboard` - Enterprise dashboard data
- `ratelimit:{enterpriseId}:{contextId}` - Rate limit counters

### 3. Authentication & Authorization

#### Context-Aware JWT Tokens
JWT tokens include:
- User information
- Current context (enterprise/partner/agencySeat)
- Role and permissions
- Enterprise/Partner IDs

#### Dual-Mode Context Switching
Users can switch between:
- Enterprise contexts (enterprise, agencySeat)
- Partner contexts (partner-client relationships)

Context switching:
- Validates relationship status
- Updates last accessed timestamp
- Generates new JWT token
- Invalidates relevant caches
- Logs switch for audit

### 4. Screen Access Control

All 31 screens have defined access rules:
- Required roles
- Allowed context types
- Feature requirements
- Relationship requirements
- Multiple context requirements

Access is enforced via middleware that:
- Checks role permissions
- Validates context type
- Verifies relationships (for Partner screens)
- Logs access attempts

### 5. Rate Limiting

Context-aware rate limiting with tier-based limits:
- Standard: 1,000 requests/hour
- Premium: 5,000 requests/hour
- Enterprise: 10,000 requests/hour

Rate limits are:
- Per enterprise
- Per user (optional)
- Tracked in cache
- Returned in response headers

## Data Flow

### Context Switching Flow

```
User Request → Auth Middleware → Context Validation → Relationship Check → 
Token Generation → Cache Invalidation → Response
```

### Screen Access Flow

```
User Request → Auth Middleware → Screen Access Middleware → 
Role Check → Context Type Check → Relationship Check → Screen Access
```

### Dashboard Data Flow

```
User Request → Cache Check → Materialized View Query → 
Cache Update → Response
```

## API Endpoints

### Context Management
- `POST /api/auth/context/switch` - Switch context
- `GET /api/auth/contexts/available` - Get all available contexts grouped
- `GET /api/auth/contexts/partner` - Get partner contexts
- `GET /api/auth/contexts/enterprise` - Get enterprise contexts

### Partner Relationships
- `POST /api/partner-relationships` - Create relationship
- `GET /api/partner-relationships` - List relationships
- `GET /api/partner-relationships/partner/:id/clients` - Get partner clients
- `GET /api/partner-relationships/enterprise/:id/partners` - Get enterprise partners

### Screens
- `GET /api/screens/available` - Get available screens for user
- All 31 screen routes with access control

### Dashboards
- `GET /api/dashboards/enterprise/:id` - Enterprise dashboard
- `GET /api/dashboards/partner/:id` - Partner dashboard
- `GET /api/dashboards/compliance/:id` - Compliance metrics

## Performance Optimizations

### Materialized Views
- `enterprise_dashboard_cache` - Refreshed every 5 minutes
- `partner_dashboard_cache` - Refreshed every 5 minutes
- `compliance_metrics_cache` - Refreshed every 5 minutes

### Caching Strategy
- Context lists: 5-minute TTL
- Dashboard data: 1-hour TTL
- Subscription tiers: 1-hour TTL
- Rate limit counters: Per-window TTL

### Database Indexes
- Composite indexes on frequently queried columns
- Partial indexes for active records
- Covering indexes for common queries

## Security Considerations

1. **Data Isolation**: Strict tenant isolation at database and API layers
2. **Context Validation**: All context switches validated before execution
3. **Relationship Verification**: Partner screens require active relationships
4. **Audit Logging**: All context switches and access attempts logged
5. **Rate Limiting**: Prevents abuse while allowing legitimate traffic

## Scalability

The architecture supports:
- 1000+ enterprises
- 10,000+ users
- 100,000+ context switches/day
- Horizontal scaling via stateless API servers
- Database read replicas for dashboard queries
- Redis cluster for shared state

## Migration Guide

1. Run database migrations in order:
   - `010_enhance_partner_enterprise_model.sql`
   - `011_expand_role_system.sql`
   - `012_add_performance_indexes.sql`
   - `013_create_dashboard_materialized_views.sql`

2. Configure environment variables:
   - `CACHE_PROVIDER=memory|redis`
   - `REDIS_URL=redis://localhost:6379`
   - `RATE_LIMIT_ENABLED=true`

3. Seed default permissions for new roles

4. Set up materialized view refresh job (cron or job queue)

## Future Enhancements

1. Advanced analytics for context switching patterns
2. Predictive compliance scoring
3. Real-time collaboration features
4. Mobile app support
5. Advanced feature flags system

