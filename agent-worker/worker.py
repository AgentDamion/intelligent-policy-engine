import time
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Load the secrets
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    print("Make sure you copied the 'service_role' key, not the anon key!")
    exit(1)

# 2. Connect to Supabase
supabase: Client = create_client(url, key)
TABLE_NAME = "agent_task_requests"

def process_task(task):
    print(f"\nFound Task {task['id']}!")
    print(f"   User asking: {task['request_payload'].get('prompt')}")
    
    # A. Mark as 'processing'
    supabase.table(TABLE_NAME).update({
        "status": "processing"
    }).eq("id", task['id']).execute()
    
    try:
        # --- THIS IS THE AGENT BRAIN ---
        # (This is where you will eventually put LangChain/Phidata code)
        
        # Simulating heavy "thinking" work
        time.sleep(3) 
        
        result_text = f"Agent Report: I successfully analyzed '{task['request_payload'].get('prompt')}'."
        # ----------------------------------

        # B. Mark as 'completed' & save result
        supabase.table(TABLE_NAME).update({
            "status": "completed",
            "response_payload": {
                "answer": result_text,
                "steps": ["Task Received", "Thinking", "Done"]
            },
            # updated_at is handled by the trigger we created!
        }).eq("id", task['id']).execute()
        
        print(f"Task {task['id']} Completed successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        supabase.table(TABLE_NAME).update({
            "status": "failed",
            "response_payload": {"error": str(e)}
        }).eq("id", task['id']).execute()

def main():
    import datetime
    print(f"Agent Worker is ONLINE.")
    print(f"Watching table '{TABLE_NAME}' for 'pending' tasks...")
    print(f"Started at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    poll_count = 0
    while True:
        try:
            # Poll for tasks
            response = supabase.table(TABLE_NAME).select("*").eq("status", "pending").execute()
            tasks = response.data
            
            if tasks:
                print(f"\nFound {len(tasks)} pending task(s) at {datetime.datetime.now().strftime('%H:%M:%S')}")
            
            for task in tasks:
                process_task(task)
            
            # Sleep to prevent spamming the database
            poll_count += 1
            if poll_count % 15 == 0:  # Print heartbeat every 30 seconds (15 polls * 2 seconds)
                print(f"Worker heartbeat: {datetime.datetime.now().strftime('%H:%M:%S')} - Still watching for tasks...")
            
            time.sleep(2)
            
        except Exception as e:
            print(f"Connection Error at {datetime.datetime.now().strftime('%H:%M:%S')}: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(5)

if __name__ == "__main__":
    main()
