# Troubleshooting Guide

**Project**: aicomply.io  
**Last Updated**: 2025-01-15

---

## Common Production Issues

### Authentication Errors

**Symptom**: Users cannot log in, see "Invalid credentials" error

**Possible Causes**:
1. Supabase site URL misconfigured
2. Email confirmation required but not enabled
3. MFA challenge failing
4. Rate limiting triggered

**Diagnosis**:
```sql
-- Check recent auth errors
SELECT * FROM auth_logs
WHERE metadata->>'msg' ILIKE '%error%'
ORDER BY timestamp DESC
LIMIT 20;
```

**Resolution**:
1. Verify Supabase Auth settings:
   - URL Configuration → Site URL: `https://aicomply.io`
   - Redirect URLs: `https://aicomply.io/**`
2. Check if MFA is causing issue:
   - Temporarily disable MFA enforcement
   - Test login again
3. Review rate limiting logs for 429 errors

---

### Database Connection Errors

**Symptom**: "Connection to database failed" or "too many connections"

**Diagnosis**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Find long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

**Resolution**:
1. Kill long-running queries:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE pid = [problematic-pid];
   ```
2. Increase connection pool size (Supabase Dashboard → Settings → Database)
3. Check for connection leaks in edge functions

---

### Rate Limiting False Positives

**Symptom**: Legitimate users receiving 429 "Too Many Requests"

**Diagnosis**:
```sql
-- Check rate limit hits by user
SELECT user_id, COUNT(*) as hits
FROM rate_limit_tracking
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id
ORDER BY hits DESC;
```

**Resolution**:
1. Increase rate limits for power users:
   ```typescript
   // supabase/functions/_shared/rate-limit.ts
   const isEnterpriseAdmin = await checkAdminStatus(userId);
   const maxRequests = isEnterpriseAdmin ? 50 : 10; // Higher limit for admins
   ```
2. Whitelist specific users/IPs if needed
3. Monitor for API abuse patterns

---

### RLS Policy Violations

**Symptom**: Users see "permission denied for table X" or empty results

**Diagnosis**:
```bash
# Run RLS linter
npm run audit:rls

# Test specific policy
psql $DATABASE_URL -c "
  SET ROLE authenticated;
  SET request.jwt.claims.sub = '[user-id]';
  SELECT * FROM policies WHERE id = '[policy-id]';
"
```

**Resolution**:
1. Review policy definition:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'policies';
   ```
2. Add missing workspace membership:
   ```sql
   INSERT INTO workspace_members (user_id, workspace_id, role)
   VALUES ('[user-id]', '[workspace-id]', 'member');
   ```
3. Temporarily disable RLS for debugging (never in production):
   ```sql
   ALTER TABLE policies DISABLE ROW LEVEL SECURITY;
   -- Test query
   ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
   ```

---

### MFA Enrollment Issues

**Symptom**: QR code not displaying, verification code fails

**Diagnosis**:
```sql
-- Check MFA factors for user
SELECT * FROM auth.mfa_factors WHERE user_id = '[user-id]';
```

**Resolution**:
1. Verify Supabase MFA is enabled (Dashboard → Auth → Providers)
2. Reset MFA factor:
   ```sql
   DELETE FROM auth.mfa_factors WHERE user_id = '[user-id]';
   ```
3. Clear browser cache and retry enrollment
4. Test with different authenticator app (Google Authenticator, Authy)

---

## Edge Function Debugging

### Function Not Responding

**Diagnosis**:
```bash
# Check function logs
supabase functions logs cursor-agent-adapter --tail

# Test function directly
curl -X POST https://dqemokpnzasbeytdbzei.supabase.co/functions/v1/cursor-agent-adapter \
  -H "Authorization: Bearer [user-jwt]" \
  -d '{"agentName": "compliance"}'
```

**Resolution**:
1. Verify function is deployed:
   ```bash
   supabase functions list
   ```
2. Check for syntax errors in logs
3. Redeploy function:
   ```bash
   git push origin main # Triggers auto-deploy
   ```

---

### CORS Errors

**Symptom**: Browser console shows "CORS policy blocked"

**Resolution**:
1. Verify CORS headers in edge function:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
   ```
2. Check Supabase API settings (should allow all origins by default)

---

## Performance Issues

### Slow Page Loads

**Diagnosis**:
1. Check Sentry performance dashboard
2. Review Logtail for slow queries:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   WHERE mean_exec_time > 1000
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

**Resolution**:
1. Add database indexes:
   ```sql
   CREATE INDEX idx_policies_workspace ON policies(workspace_id);
   CREATE INDEX idx_submissions_workspace ON submissions(workspace_id);
   ```
2. Optimize React queries (use React Query caching)
3. Enable lazy loading for heavy components

---

## Security Incident Response

### Suspected Data Breach

**Immediate Actions**:
1. Force all users to log out:
   ```sql
   DELETE FROM auth.sessions WHERE expires_at > NOW();
   ```
2. Revoke all API keys
3. Review audit logs:
   ```sql
   SELECT * FROM audit_events
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```
4. Contact security team: security@aicomply.io

---

## Contact & Escalation

- **On-Call Engineer**: [PagerDuty Link]
- **Slack**: #incidents (urgent), #tech-support (non-urgent)
- **Email**: support@aicomply.io
- **Security**: security@aicomply.io

---

## Related Documentation

- [Production Monitoring Guide](./PRODUCTION_MONITORING.md)
- [Security Hardening Guide](./SECURITY_HARDENING.md)
