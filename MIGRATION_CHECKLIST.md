# Supabase Auth Migration Checklist

## 🚀 Migration Steps (in order):

### 1. Backend Preparation
- [ ] Run the SQL migration to add auth helper functions:
  ```bash
  # Apply the new migration
  supabase db push
  ```
- [ ] Copy the new `supabase-auth.js` middleware to `api/middleware/`
- [ ] Replace `server.js` with `server-unified.js` (or rename)
- [ ] Update `.env` with Supabase credentials from `env.supabase-template`
- [ ] Install required dependencies:
  ```bash
  npm install @supabase/supabase-js helmet express-rate-limit
  ```

### 2. Frontend Updates  
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Add the `supabase-client.js` library to `src/lib/`
- [ ] Add the `AuthContext.jsx` provider to `src/contexts/`
- [ ] Update `.env.local` with `VITE_*` variables from template
- [ ] Wrap your app with `AuthProvider` in your main App component

### 3. Database Migration
- [ ] Backup your current database
- [ ] Run the user migration script (adjust for your schema):
  ```bash
  node scripts/migrate-to-supabase-auth.js
  ```
- [ ] Verify users received password reset emails
- [ ] Test login with migrated users

### 4. Testing
- [ ] Start the new server: `node server-unified.js`
- [ ] Run the auth migration tests: `npm test tests/auth-migration.test.js`
- [ ] Test login flow in the UI
- [ ] Verify WebSocket connections work with auth
- [ ] Check tenant isolation works correctly
- [ ] Test enterprise role permissions

### 5. Cleanup
- [ ] Run the cleanup script: `bash scripts/cleanup-old-auth.sh`
- [ ] Remove old auth code and dependencies
- [ ] Update documentation and README files
- [ ] Remove old environment variables

### 6. Production Deployment
- [ ] Update production environment variables
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor error logs for 24 hours
- [ ] Verify all authentication flows work in production

## 🔧 Troubleshooting

### Common Issues:

1. **Migration fails**: Check Supabase service key permissions
2. **WebSocket auth fails**: Verify token is being passed correctly
3. **CORS errors**: Check FRONTEND_URL in environment variables
4. **RLS policies**: Ensure your database policies allow authenticated users

### Rollback Plan:
- Keep backup of old `server.js`
- Keep backup of old auth middleware
- Keep backup of database before migration

## 📋 Verification Checklist

After migration, verify:

- [ ] Users can sign up and sign in
- [ ] Enterprise context is properly set
- [ ] Role-based permissions work
- [ ] WebSocket connections require auth
- [ ] Tenant isolation is enforced
- [ ] Audit logs are working
- [ ] All existing API endpoints work with new auth
- [ ] Frontend auth state management works
- [ ] Password reset emails are sent
- [ ] Session persistence works correctly

## 🆘 Support

If you encounter issues:
1. Check the Supabase dashboard for auth logs
2. Verify environment variables are correct
3. Check server logs for authentication errors
4. Ensure database migrations completed successfully
5. Verify RLS policies are properly configured

## 🎯 Success Criteria

Migration is complete when:
- All users can authenticate via Supabase
- Enterprise context is properly maintained
- WebSocket connections are secured
- Tenant isolation is enforced
- No old auth code remains
- All tests pass
- Production deployment is successful
