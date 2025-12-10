#!/usr/bin/env python3
"""
Test script to verify Supabase connection for agent-worker
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("Supabase Connection Verification for Agent Worker")
print("=" * 60)

# Load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

print("\n1. Environment Variables Check:")
print(f"   SUPABASE_URL: {'[OK] Set' if url else '[ERROR] Missing'}")
print(f"   SUPABASE_SERVICE_KEY: {'[OK] Set' if key else '[ERROR] Missing'}")

if not url:
    print("\n[ERROR] SUPABASE_URL not found!")
    print("\nTo fix:")
    print("   1. Create a .env file in agent-worker/ directory")
    print("   2. Add: SUPABASE_URL=https://your-project.supabase.co")
    print("   3. Add: SUPABASE_SERVICE_KEY=your_service_role_key")
    sys.exit(1)

if not key:
    print("\n[ERROR] SUPABASE_SERVICE_KEY not found!")
    print("\nTo fix:")
    print("   1. Go to Supabase Dashboard -> Settings -> API")
    print("   2. Copy the 'service_role' key (NOT the anon key)")
    print("   3. Add it to your .env file as SUPABASE_SERVICE_KEY")
    sys.exit(1)

# Check if using service role key (starts with eyJ)
if not key.startswith("eyJ"):
    print("\n[WARNING] SUPABASE_SERVICE_KEY doesn't look like a JWT token")
    print("   Make sure you're using the 'service_role' key, not the 'anon' key")

print("\n2. Testing Supabase Connection:")

try:
    supabase: Client = create_client(url, key)
    print("   [OK] Supabase client created")
    
    # Test connection by checking a table
    TABLE_NAME = "agent_task_requests"
    
    print(f"\n3. Testing Table Access: '{TABLE_NAME}'")
    
    try:
        # Try to select from the table
        response = supabase.table(TABLE_NAME).select("id").limit(1).execute()
        print(f"   [OK] Table '{TABLE_NAME}' exists and is accessible")
        print(f"   [INFO] Can read from table")
        
        # Count tasks by status
        count_response = supabase.table(TABLE_NAME).select("status", count="exact").execute()
        print(f"   [INFO] Total records: {count_response.count if hasattr(count_response, 'count') else 'N/A'}")
        
    except Exception as table_err:
        error_msg = str(table_err)
        if "relation" in error_msg.lower() or "does not exist" in error_msg.lower():
            print(f"   [WARNING] Table '{TABLE_NAME}' does not exist")
            print("\nTo create the table, run your Supabase migration:")
            print("   - Check supabase/migrations/ for migration files")
            print("   - Or create the table manually in Supabase SQL Editor")
        elif "permission" in error_msg.lower() or "policy" in error_msg.lower():
            print(f"   [WARNING] Permission denied accessing '{TABLE_NAME}'")
            print("\nPossible issues:")
            print("   - Check Row Level Security (RLS) policies")
            print("   - Verify you're using service_role key (bypasses RLS)")
            print("   - Check table permissions in Supabase")
        else:
            print(f"   [ERROR] Error accessing table: {error_msg}")
            raise
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Supabase connection verification complete!")
    print("\nYour agent-worker should be ready to run!")
    print("   Run: python agent-worker/worker.py")
    
except Exception as e:
    print(f"\n[ERROR] Connection test failed!")
    print(f"   Error: {str(e)}")
    
    error_str = str(e).lower()
    if "invalid api key" in error_str or "401" in error_str:
        print("\nAuthentication failed:")
        print("   - Verify SUPABASE_SERVICE_KEY is correct")
        print("   - Make sure you're using 'service_role' key, not 'anon' key")
        print("   - Check key hasn't expired or been rotated")
    elif "network" in error_str or "connection" in error_str:
        print("\nNetwork/Connection issue:")
        print("   - Check SUPABASE_URL is correct")
        print("   - Verify internet connectivity")
        print("   - Check if Supabase project is active")
    else:
        print("\nCheck:")
        print("   - SUPABASE_URL format: https://xxxxx.supabase.co")
        print("   - SUPABASE_SERVICE_KEY is a valid JWT token")
        print("   - Supabase project is active and not paused")
    
    sys.exit(1)

