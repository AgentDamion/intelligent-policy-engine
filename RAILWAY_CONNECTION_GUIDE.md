# 🔌 Railway Connection Verification Guide

This guide helps you verify that your Railway connections are working correctly.

## Quick Start

### 1. Test Railway Database Connection

**Option A: Using existing database connection file**
```bash
node database/db-connection.js
```

**Option B: Using comprehensive test script** (requires `pg` package)
```bash
# First install pg if needed
npm install pg

# Then run the test
node test-railway-connection.cjs
```

This script will:
- ✅ Check if `DATABASE_URL` environment variable is set
- ✅ Verify the connection string uses port 3000 (Railway standard)
- ✅ Test the database connection
- ✅ Check database schema and tables
- ✅ Verify `agent_task_requests` table exists (for worker.py)

### 2. Test Supabase Connection (for Agent Worker)

```bash
cd agent-worker
python test-supabase-connection.py
```

This script will:
- ✅ Check if `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
- ✅ Verify Supabase client can connect
- ✅ Test access to `agent_task_requests` table
- ✅ Check for permission issues

## Environment Variables Setup

### For Railway Database Connection

Railway automatically provides `DATABASE_URL` when you add a Postgres service. To verify:

1. Go to Railway Dashboard → Your Project
2. Click on your Postgres service
3. Go to the "Variables" tab
4. Look for `DATABASE_URL` - it should look like:
   ```
   postgresql://postgres:password@hostname.railway.app:3000/railway
   ```
   **Important**: Port should be `3000`, not `5432` [[memory:4543327]]

### For Supabase (Agent Worker)

Create a `.env` file in `agent-worker/` directory:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**Important**: Use the `service_role` key, NOT the `anon` key!

## Common Issues & Solutions

### Issue: DATABASE_URL not found

**Solution:**
1. Check Railway dashboard → Variables tab
2. Ensure Postgres service is running
3. If missing, add Postgres service to your Railway project

### Issue: Port mismatch (using 5432 instead of 3000)

**Solution:**
Railway Postgres uses port 3000. Update your connection string:
```bash
# Wrong (port 5432)
postgresql://postgres:pass@host:5432/db

# Correct (port 3000)
postgresql://postgres:pass@host:3000/db
```

### Issue: SSL connection error

**Solution:**
Ensure your connection code includes SSL configuration:
```javascript
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Railway
});
```

### Issue: Supabase authentication failed

**Solution:**
1. Verify you're using `service_role` key (starts with `eyJ`)
2. Check key hasn't been rotated in Supabase dashboard
3. Ensure `.env` file is in `agent-worker/` directory
4. Restart your worker after changing `.env`

### Issue: Table doesn't exist

**Solution:**
1. Run Supabase migrations:
   ```bash
   # Check supabase/migrations/ directory
   # Run migrations via Supabase CLI or Dashboard SQL Editor
   ```
2. Or create table manually in Supabase SQL Editor

## Testing Your Setup

### Complete Verification Checklist

- [ ] Railway `DATABASE_URL` is set and uses port 3000
- [ ] Database connection test passes (`node test-railway-connection.js`)
- [ ] Supabase credentials are set in `agent-worker/.env`
- [ ] Supabase connection test passes (`python agent-worker/test-supabase-connection.py`)
- [ ] `agent_task_requests` table exists and is accessible
- [ ] Agent worker can start without errors (`python agent-worker/worker.py`)

## Next Steps

Once connections are verified:

1. **Start the agent worker:**
   ```bash
   cd agent-worker
   python worker.py
   ```

2. **Test Railway server endpoints:**
   ```bash
   export RAILWAY_STATIC_URL=https://your-app.railway.app
   node test-railway.js
   ```

3. **Monitor logs:**
   - Railway Dashboard → Deployments → View Logs
   - Agent worker will show connection status on startup

## Need Help?

If tests fail:
1. Check error messages - they include specific guidance
2. Verify environment variables are set correctly
3. Check Railway/Supabase dashboards for service status
4. Review connection strings for typos or missing values

