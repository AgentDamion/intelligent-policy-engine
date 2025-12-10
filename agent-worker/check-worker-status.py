#!/usr/bin/env python3
"""Check the status of worker processes and recent tasks"""

import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timedelta

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    exit(1)

supabase = create_client(url, key)

print("=" * 60)
print("🔍 AGENT WORKER STATUS CHECK")
print("=" * 60)

# Check recent tasks
print("\n📋 Recent Tasks (last 10):")
recent_tasks = supabase.table("agent_task_requests").select("*").order("created_at", desc=True).limit(10).execute()

if not recent_tasks.data:
    print("   No tasks found in database")
else:
    for task in recent_tasks.data:
        prompt = task.get('request_payload', {}).get('prompt', 'N/A')
        created = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
        updated = datetime.fromisoformat(task['updated_at'].replace('Z', '+00:00'))
        duration = (updated - created).total_seconds()
        
        status_icon = {
            'pending': '⏳',
            'processing': '⚙️',
            'completed': '✅',
            'failed': '❌'
        }.get(task['status'], '❓')
        
        print(f"\n   {status_icon} Task: {task['id'][:8]}...")
        print(f"      Status: {task['status']}")
        print(f"      Prompt: {prompt[:50]}...")
        print(f"      Created: {created.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"      Updated: {updated.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"      Duration: {duration:.2f}s")
        
        if task.get('response_payload'):
            answer = task['response_payload'].get('answer', 'N/A')
            print(f"      Response: {answer[:50]}...")

# Check pending tasks
print("\n\n⏳ Pending Tasks:")
pending_tasks = supabase.table("agent_task_requests").select("*").eq("status", "pending").execute()

if not pending_tasks.data:
    print("   ✅ No pending tasks - worker is caught up!")
else:
    print(f"   ⚠️  Found {len(pending_tasks.data)} pending task(s):")
    for task in pending_tasks.data:
        prompt = task.get('request_payload', {}).get('prompt', 'N/A')
        created = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
        age_seconds = (datetime.now(created.tzinfo) - created).total_seconds()
        print(f"      - {task['id'][:8]}... | Age: {age_seconds:.0f}s | Prompt: {prompt[:40]}...")

# Check for stuck processing tasks
print("\n\n⚙️  Processing Tasks (might be stuck):")
processing_tasks = supabase.table("agent_task_requests").select("*").eq("status", "processing").execute()

if not processing_tasks.data:
    print("   ✅ No stuck processing tasks")
else:
    print(f"   ⚠️  Found {len(processing_tasks.data)} task(s) stuck in 'processing' state:")
    for task in processing_tasks.data:
        prompt = task.get('request_payload', {}).get('prompt', 'N/A')
        created = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
        age_seconds = (datetime.now(created.tzinfo) - created).total_seconds()
        print(f"      - {task['id'][:8]}... | Age: {age_seconds:.0f}s | Prompt: {prompt[:40]}...")
        if age_seconds > 60:
            print(f"         ⚠️  This task has been processing for {age_seconds:.0f} seconds - might be stuck!")

print("\n" + "=" * 60)
print("💡 TIP: If you don't see worker output, restart it with:")
print("   python worker.py")
print("=" * 60)

