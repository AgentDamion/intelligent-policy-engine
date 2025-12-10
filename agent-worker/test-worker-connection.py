#!/usr/bin/env python3
"""Test script to verify worker can connect and query tasks"""

import os
from dotenv import load_dotenv
from supabase import create_client
import json

# Load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    exit(1)

print(f"✅ Connecting to Supabase: {url[:30]}...")

# Connect to Supabase
supabase = create_client(url, key)

# Test 1: Check all tasks
print("\n📋 All tasks in table:")
all_tasks = supabase.table("agent_task_requests").select("*").execute()
print(f"   Total tasks: {len(all_tasks.data)}")
for task in all_tasks.data:
    print(f"   - ID: {task['id'][:8]}... | Status: {task['status']} | Created: {task['created_at']}")

# Test 2: Check pending tasks specifically
print("\n🔍 Checking for pending tasks:")
pending_tasks = supabase.table("agent_task_requests").select("*").eq("status", "pending").execute()
print(f"   Pending tasks: {len(pending_tasks.data)}")
for task in pending_tasks.data:
    prompt = task.get('request_payload', {}).get('prompt', 'N/A')
    print(f"   - ID: {task['id']} | Prompt: {prompt}")

# Test 3: Create a test task
print("\n🧪 Creating test task...")
test_task = supabase.table("agent_task_requests").insert({
    "status": "pending",
    "request_payload": {
        "prompt": "Test task from connection test"
    }
}).execute()

if test_task.data:
    print(f"   ✅ Test task created: {test_task.data[0]['id']}")
    
    # Check if we can immediately query it
    print("\n🔍 Verifying test task can be queried...")
    verify_task = supabase.table("agent_task_requests").select("*").eq("id", test_task.data[0]['id']).execute()
    if verify_task.data:
        print(f"   ✅ Test task found: {verify_task.data[0]['status']}")
    else:
        print("   ❌ Test task not found!")
else:
    print("   ❌ Failed to create test task")

print("\n✅ Connection test complete!")

