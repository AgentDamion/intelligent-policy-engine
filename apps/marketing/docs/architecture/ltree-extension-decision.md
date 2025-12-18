# Architectural Decision: ltree Extension Schema Location

**Date**: 2025-10-18  
**Status**: Accepted  
**Decision Makers**: Development Team  
**Impact**: Low Risk, Operational Simplification

---

## Executive Summary

The PostgreSQL `ltree` extension will remain installed in the `public` schema despite Supabase's best practice recommendation to use a dedicated `extensions` schema. This decision prioritizes operational stability and risk mitigation over namespace optimization.

---

## Context

Supabase flagged a warning regarding the `ltree` extension being installed in the `public` schema:

> **Warning**: The PostgreSQL extension ltree is installed in the public schema (public.ltree). Best practice is to avoid installing extensions in public to reduce clutter, accidental privilege inheritance, and potential security risks.

The `ltree` extension is a critical component of our policy inheritance system, used extensively in:
- `scopes.scope_path` column (hierarchical organization paths)
- `policy_inheritance_tree` view
- Multiple policy-related functions (`get_effective_policy`, `detect_policy_conflicts`)
- Policy hierarchy traversal and conflict detection

---

## Problem Statement

### Security Considerations
- **Public Schema Accessibility**: The `public` schema has broader default access
- **Privilege Inheritance**: Functions/operators in `public` may inherit default privileges
- **Namespace Pollution**: Extensions in `public` can create naming conflicts

### Technical Implications
- **Deep Integration**: ltree is embedded in core database schema
- **Migration Complexity**: Moving requires dropping and recreating 15+ dependent objects
- **Downtime Risk**: Migration requires maintenance window with data conversion
- **Rollback Difficulty**: Failure scenarios require full database restore

---

## Options Considered

### Option 1: Keep ltree in public Schema (SELECTED)
**Pros**:
- Zero disruption to production services
- No data migration risks
- No dependency recreation complexity
- Immediate availability

**Cons**:
- Persistent Supabase warning
- Theoretical security exposure (mitigated by RLS)
- Non-standard schema organization

### Option 2: Migrate to extensions Schema
**Pros**:
- Follows Supabase best practices
- Cleaner namespace separation
- Improved security hygiene
- Warning elimination

**Cons**:
- 5-10 hours migration effort
- Required maintenance window
- Data integrity risks during conversion
- Complex rollback procedure
- Potential for breaking changes

---

## Decision

**We will keep the `ltree` extension in the `public` schema.**

This decision is documented and accepted as a known architectural trade-off.

---

## Rationale

### 1. Low Actual Security Risk
- **Row-Level Security (RLS)**: All tables have comprehensive RLS policies
- **Controlled Access**: Supabase environment is not publicly accessible
- **Limited Attack Surface**: Application-level authentication guards all operations
- **Audit Trail**: All policy operations are logged and traceable

### 2. High Migration Complexity
The migration would require:
- Dropping `scopes.scope_path` column (core data)
- Recreating 3+ critical functions
- Rebuilding views and triggers
- Updating search_path configurations
- Comprehensive testing of policy inheritance

### 3. Active Production Use
- Policy inheritance is actively used
- Scope hierarchy is fundamental to multi-tenancy
- Conflict detection depends on ltree operators
- No safe rollback mechanism without full restore

### 4. Cost-Benefit Analysis
- **Migration Cost**: 5-10 developer hours + maintenance window + testing
- **Security Benefit**: Marginal in our controlled environment
- **Risk of Migration**: Higher than risk of staying

---

## Trade-offs Accepted

### Security
- **Accepted**: Slightly broader theoretical attack surface
- **Mitigated By**: RLS policies, authentication, limited scope access
- **Monitoring**: Database audit logs, RLS policy effectiveness

### Best Practices
- **Accepted**: Deviation from Supabase recommended schema organization
- **Documented**: This decision record provides context for future maintainers
- **Justified**: Operational stability prioritized over namespace aesthetics

### Maintainability
- **Accepted**: Warning will persist in Supabase dashboard
- **Documented**: Team members aware of intentional deviation
- **Reversible**: Can migrate in future if risk profile changes

---

## Monitoring & Validation

### Ongoing Checks
1. **RLS Policy Effectiveness**: Regular audits of policy enforcement
2. **Access Patterns**: Monitor for unexpected public schema access
3. **Extension Updates**: Review ltree version updates for security patches
4. **Supabase Warnings**: Track if additional warnings emerge

### Security Validation
```sql
-- Verify RLS is enabled on all ltree-dependent tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('scopes', 'policies', 'policy_conflicts');

-- Check for unexpected public grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('scopes', 'policies');
```

---

## When to Reconsider This Decision

Reassess this decision if any of the following occur:

1. **Architectural Changes**
   - Major database refactoring planned
   - Multi-database deployment requirements
   - Schema migration already scheduled

2. **Security Requirements**
   - SOC 2 audit identifies this as high-risk
   - Compliance frameworks mandate extension isolation
   - Penetration testing reveals exploitable patterns

3. **Operational Changes**
   - Public API exposure of database
   - Third-party database access requirements
   - Multi-tenant database sharing with external parties

4. **Resource Availability**
   - Scheduled maintenance window available
   - Dedicated migration time allocated
   - Comprehensive test coverage in place

---

## Implementation Guidelines (If Future Migration Needed)

### Pre-Migration Checklist
- [ ] Full database backup verified
- [ ] Maintenance window scheduled (2-4 hours)
- [ ] All dependencies catalogued
- [ ] Rollback procedure documented
- [ ] Test environment migration successful
- [ ] Stakeholder notification complete

### Migration Phases
1. **Preparation**: Create temporary data columns
2. **Drop Dependencies**: Remove views, functions, triggers
3. **Extension Migration**: Drop and recreate in extensions schema
4. **Schema Rebuild**: Recreate all dependent objects
5. **Data Restoration**: Convert and validate data
6. **Validation**: Comprehensive testing
7. **Monitoring**: Post-migration observation period

### Success Criteria
- All ltree functionality operational
- No data loss
- RLS policies effective
- Application performance unchanged
- Edge functions compatible

---

## References

### Documentation
- [PostgreSQL ltree Extension](https://www.postgresql.org/docs/current/ltree.html)
- [Supabase Extension Management](https://supabase.com/docs/guides/database/extensions)
- [PostgreSQL Schema Best Practices](https://www.postgresql.org/docs/current/ddl-schemas.html)

### Related Architecture Docs
- `docs/SYSTEM_ARCHITECTURE.md` - Overall system design
- Migration files implementing ltree-dependent features:
  - `20251018_phase2_policy_inheritance.sql`

### Security Context
- Row-Level Security (RLS) implementation
- Multi-tenant isolation strategy
- Audit logging and compliance framework

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Created** | 2025-10-18 |
| **Last Reviewed** | 2025-10-18 |
| **Next Review** | 2026-04-18 (6 months) |
| **Owner** | Development Team |
| **Stakeholders** | Security Team, DevOps, Product |
| **Related ADRs** | Policy Inheritance System Design |

---

## Approval

This architectural decision has been reviewed and accepted by the development team as a pragmatic choice balancing security best practices with operational realities.

**Decision Record**: This document serves as the official record of this architectural decision and should be referenced in code reviews, security audits, and future planning discussions.
