# 🚀 Railway Deployment Guide for Agent Worker

## Architecture Overview

- **Database:** Supabase (Cloud) ✅
- **Compute:** Railway (Python Worker) ✅
- **⚠️ Important:** You do NOT need a Railway PostgreSQL database. You're using Supabase!

## Pre-Deployment Checklist

✅ **Local Tests Passed:**
- [x] Supabase connection verified (`python test-supabase-connection.py`)
- [x] `agent_task_requests` table exists and accessible
- [x] Worker can connect to Supabase locally

✅ **Deployment Files Ready:**
- [x] `Dockerfile` exists and configured
- [x] `requirements.txt` has all dependencies
- [x] `.dockerignore` excludes unnecessary files

## Step-by-Step Deployment

### Step 1: Verify Files Are Ready

Your deployment files are already created:
- ✅ `agent-worker/Dockerfile` - Build instructions
- ✅ `agent-worker/requirements.txt` - Python dependencies
- ✅ `agent-worker/.dockerignore` - Excludes .env files

### Step 2: Commit and Push to GitHub

```bash
# From project root
git add agent-worker/
git commit -m "chore: prepare agent-worker for Railway deployment"
git push origin main
```

### Step 3: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Log in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository (`intelligent-policy-engine`)

### Step 4: Configure Railway Settings ⚠️ CRITICAL

**🛑 DO NOT WAIT FOR BUILD - Configure immediately!**

#### A. Set Root Directory

1. Go to **Settings** → **General**
2. Find **"Root Directory"**
3. Change from `/` to `/agent-worker`
4. Click **"Save"**

#### B. Add Environment Variables

1. Go to **Variables** tab
2. Add these two variables from your local `.env` file:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**⚠️ Important:** Use the `service_role` key, NOT the `anon` key!

3. Click **"Save"** - Railway will automatically redeploy

### Step 5: Monitor Deployment

1. Go to **Deployments** tab
2. Watch the build logs
3. Look for:
   - ✅ "Building..." → "Deploying..." → "Active" (green)
   - ✅ Logs showing: "🟢 Agent Worker is ONLINE"
   - ✅ "👀 Watching table 'agent_task_requests' for 'pending' tasks..."

### Step 6: Verify It's Working

1. Check **Logs** tab - you should see:
   ```
   🟢 Agent Worker is ONLINE.
   👀 Watching table 'agent_task_requests' for 'pending' tasks...
   ⏰ Started at: [timestamp]
   ```

2. Test by creating a task in Supabase:
   ```sql
   INSERT INTO agent_task_requests (status, request_payload)
   VALUES ('pending', '{"prompt": "Test from Railway deployment"}');
   ```

3. Watch Railway logs - you should see the worker pick it up!

## Troubleshooting

### Build Fails

**Error: "Cannot find requirements.txt"**
- ✅ Check Root Directory is set to `/agent-worker`

**Error: "Module not found"**
- ✅ Check `requirements.txt` includes all dependencies
- ✅ Verify `supabase` and `python-dotenv` are listed

### Worker Won't Start

**Error: "Missing SUPABASE_URL"**
- ✅ Check Variables tab - both variables must be set
- ✅ Verify variable names match exactly (case-sensitive)

**Error: "Invalid API key"**
- ✅ Verify you're using `service_role` key, not `anon` key
- ✅ Check key hasn't been rotated in Supabase dashboard

### Worker Starts But No Logs

- ✅ Check Logs tab (not Deployments)
- ✅ Worker polls every 2 seconds - wait a moment
- ✅ Look for heartbeat messages every 30 seconds

## Cost Management

**⚠️ Railway Free Tier:**
- $5 credit/month
- Worker runs 24/7 = ~$0.01/hour = ~$7.20/month
- You may need to upgrade to Hobby ($5/month) for 24/7 operation

**To Monitor Usage:**
- Railway Dashboard → Project → Usage
- Set up billing alerts

## Next Steps After Deployment

1. ✅ Worker is running 24/7 on Railway
2. ✅ It watches Supabase for new tasks
3. ✅ Processes tasks automatically
4. ✅ Updates task status in Supabase

**You're done!** 🎉

Your architecture:
```
Frontend → Supabase (Database)
                ↓
         Agent Worker (Railway) ← Watches Supabase
                ↓
         Processes Tasks → Updates Supabase
```

